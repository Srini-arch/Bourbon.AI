import json
import time
import os
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from loguru import logger
from pydantic import BaseModel
from google import genai
from google.genai import types
from groq import Groq
from dotenv import load_dotenv

# Load .env from the project root so all API keys are available
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class AIEngine(ABC):
    last_reasoning: Optional[str] = None

    @abstractmethod
    def generate_json(self, system_instruction: str, prompt: str, schema_class: Optional[BaseModel] = None, model_name: str = "") -> dict:
        pass
        
    @abstractmethod
    def generate_text(self, system_instruction: str, prompt: str, model_name: str = "") -> str:
        pass

class GroqEngine(AIEngine):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        self.default_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        if not self.api_key:
            logger.warning("Groq API key missing. GroqEngine will fail if called.")
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def _execute_with_model_fallback(self, func, primary_model: str):
        fallback_models = [primary_model, "llama-3.3-70b-versatile", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"]
        candidates = list(dict.fromkeys([m for m in fallback_models if m]))
        last_err = None
        for model in candidates:
            try:
                return func(model)
            except Exception as e:
                err_str = str(e).lower()
                if "model_not_found" in err_str or "does not exist" in err_str or "404" in err_str:
                    logger.warning(f"Groq model '{model}' not found on key. Trying fallback...")
                    last_err = e
                    continue
                raise e
        raise last_err or RuntimeError("No usable Groq model found.")
        
    def generate_text(self, system_instruction: str, prompt: str, model_name: str = "") -> str:
        model_name = model_name or self.default_model
        
        def _call(model):
            logger.info(f"GroqEngine: Generating text using {model}...")
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                model=model,
                temperature=0.7,
            )
            return response.choices[0].message.content

        return self._execute_with_model_fallback(_call, model_name)

    def generate_json(self, system_instruction: str, prompt: str, schema_class=None, model_name="") -> dict:
        model_name = model_name or self.default_model
        
        sys_inst = system_instruction
        if schema_class and hasattr(schema_class, 'model_json_schema'):
            schema_json = schema_class.model_json_schema()
            sys_inst += f"\n\nYou MUST return a valid JSON object strictly matching this schema:\n{json.dumps(schema_json)}"

        def _call(model):
            logger.info(f"GroqEngine: Generating JSON using {model}...")
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_inst},
                    {"role": "user", "content": prompt}
                ],
                model=model,
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)

        try:
            return self._execute_with_model_fallback(_call, model_name)
        except json.JSONDecodeError as e:
            logger.error(f"GroqEngine JSON parse failed: {e}")
            raise e

class GeminiEngine(AIEngine):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("Gemini API key missing.")
            
    def generate_text(self, system_instruction: str, prompt: str, model_name: str = "gemini-2.5-flash") -> str:
        logger.info(f"GeminiEngine: Generating text using {model_name}...")
        if not self.client:
            raise RuntimeError("Gemini API key missing.")
        config = types.GenerateContentConfig(
            system_instruction=system_instruction
        ) if system_instruction else None
        response = self.client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config
        )
        return response.text or ""

    def generate_json(self, system_instruction: str, prompt: str, schema_class=None, model_name="gemini-2.5-flash") -> dict:
        logger.info(f"GeminiEngine: Generating JSON using {model_name}...")
        if not self.client:
            raise RuntimeError("Gemini API key missing.")
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=schema_class if schema_class else None
        )
        response = self.client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config
        )
        return json.loads(response.text)


class GPT4AllEngine(AIEngine):
    def __init__(self):
        from gpt4all import GPT4All
        self.default_model = "Meta-Llama-3-8B-Instruct.Q4_0.gguf"
        # Delay instantiation until first call to save memory if unused
        self.model = None

    def _get_model(self, model_name: str):
        from gpt4all import GPT4All
        if self.model is None or self.model.config['filename'] != model_name:
            logger.info(f"GPT4AllEngine: Loading {model_name} into memory...")
            self.model = GPT4All(model_name, device='cpu')
        return self.model

    def generate_text(self, system_instruction: str, prompt: str, model_name: str = "") -> str:
        model_name = model_name or self.default_model
        model = self._get_model(model_name)
        full_prompt = f"{system_instruction}\n\nUser: {prompt}\n\nAssistant:"
        
        logger.info(f"GPT4AllEngine: Generating text locally...")
        return model.generate(full_prompt, max_tokens=1000)

    def generate_json(self, system_instruction: str, prompt: str, schema_class=None, model_name="") -> dict:
        model_name = model_name or self.default_model
        model = self._get_model(model_name)
        
        if schema_class and hasattr(schema_class, 'model_json_schema'):
            schema_json = schema_class.model_json_schema()
            system_instruction += f"\n\nYou MUST return a valid JSON object strictly matching this schema:\n{json.dumps(schema_json)}"

        full_prompt = f"{system_instruction}\n\nUser: {prompt}\n\nAssistant: Here is the JSON:\n```json\n"
        
        logger.info(f"GPT4AllEngine: Generating JSON draft locally...")
        raw_text = model.generate(full_prompt, max_tokens=1500)
        
        # Cleanup
        raw_text = raw_text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]
        raw_text = raw_text.strip()
        
        # Force JSON boundary parsing
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            raw_text = raw_text[start_idx:end_idx+1]
            
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            logger.error(f"GPT4AllEngine: Local JSON parsing failed: {e}\nRaw output: {raw_text}")
            raise e

class CloudflareEngine(AIEngine):
    def __init__(self, account_id: str = None, api_token: str = None):
        self.account_id = account_id or os.environ.get("CLOUDFLARE_ACCOUNT_ID")
        self.api_token = api_token or os.environ.get("CLOUDFLARE_API_TOKEN")
        self.default_model = os.environ.get("CLOUDFLARE_MODEL", "@cf/meta/llama-3.3-70b-instruct-awq-int4")
        if not self.account_id or not self.api_token:
            logger.warning("Cloudflare credentials missing. CloudflareEngine will fail if called.")

    def generate_text(self, system_instruction: str, prompt: str, model_name: str = "") -> str:
        model = model_name or self.default_model
        logger.info(f"CloudflareEngine: Generating text using {model}...")
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/{model}"
        headers = {"Authorization": f"Bearer {self.api_token}", "Content-Type": "application/json"}
        payload = {
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 2048,
            "temperature": 0.6
        }
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            result = resp.json().get("result", {})
            if isinstance(result, dict) and "response" in result:
                res_val = result["response"]
                if isinstance(res_val, dict):
                    return json.dumps(res_val)
                return str(res_val).strip()
            return json.dumps(result) if isinstance(result, (dict, list)) else str(result)

    def generate_json(self, system_instruction: str, prompt: str, schema_class=None, model_name="") -> dict:
        model = model_name or self.default_model
        logger.info(f"CloudflareEngine: Generating JSON using {model}...")
        if schema_class and hasattr(schema_class, 'model_json_schema'):
            schema_json = schema_class.model_json_schema()
            system_instruction += f"\n\nYou MUST return a valid JSON object strictly matching this schema:\n{json.dumps(schema_json)}"

        text = self.generate_text(system_instruction, prompt, model_name=model)
        
        # Cleanup
        raw_text = text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]
        raw_text = raw_text.strip()
        
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            raw_text = raw_text[start_idx:end_idx+1]
            
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            logger.error(f"CloudflareEngine: JSON parse failed: {e}\nRaw output: {raw_text}")
            raise e

class SarvamEngine(AIEngine):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("SARVAM_API_KEY")
        self.default_model = os.environ.get("SARVAM_MODEL", "sarvam-105b")
        self.last_reasoning = None
        if not self.api_key:
            logger.warning("Sarvam API key missing. SarvamEngine will fail if called.")
        from sarvam_service import sarvam_service, SarvamService
        self.service = sarvam_service if not api_key else SarvamService(api_key=api_key)

    def generate_text(self, system_instruction: str, prompt: str, model_name: str = "") -> str:
        model = model_name or self.default_model
        logger.info(f"SarvamEngine: Generating text using {model}...")
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
        res = self.service.chat_completion(
            messages=messages,
            model=model,
            max_tokens=4096, # 4096 token headroom for reasoning + full polished response
            temperature=0.3
        )
        content = res.get("content") or ""
        reasoning = res.get("reasoning") or ""

        # Extract inline <think> tags if model returned reasoning in content directly
        if "<think>" in content and "</think>" in content:
            parts = content.split("</think>", 1)
            extracted_reasoning = parts[0].replace("<think>", "").strip()
            content = parts[1].strip()
            if not reasoning:
                reasoning = extracted_reasoning

        self.last_reasoning = reasoning if reasoning else None

        # Return strictly polished content; fallback only if content was completely empty
        if content:
            return content
        elif reasoning:
            return reasoning
        return ""

    def generate_json(self, system_instruction: str, prompt: str, schema_class=None, model_name="") -> dict:
        model = model_name or self.default_model
        logger.info(f"SarvamEngine: Generating JSON using {model}...")
        
        sys_prompt = system_instruction
        if schema_class and hasattr(schema_class, 'model_json_schema'):
            schema_json = schema_class.model_json_schema()
            sys_prompt += f"\n\nYou MUST return a valid JSON object strictly matching this schema:\n{json.dumps(schema_json)}"

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ]
        
        res = self.service.chat_completion(
            messages=messages,
            model=model,
            max_tokens=4096,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        self.last_reasoning = res.get("reasoning") or None
        
        raw_text = res.get("content") or ""
        raw_text = raw_text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.startswith("```"): raw_text = raw_text[3:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            raw_text = raw_text[start_idx:end_idx+1]

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            logger.error(f"SarvamEngine: JSON parse failed: {e}\nRaw output: {raw_text}")
            raise e

class AIProviderFactory:
    @staticmethod
    def get_engine(provider: str) -> AIEngine:
        provider = provider.lower()
        if provider in ["sarvam", "sarvam.ai", "sarvam-ai"]:
            return SarvamEngine()
        elif provider == "groq":
            return GroqEngine()
        elif provider == "cloudflare":
            return CloudflareEngine()
        elif provider == "gemini":
            return GeminiEngine()
        elif provider in ["gpt4all", "bourbon.ai"]:
            return GPT4AllEngine()
        else:
            raise ValueError(f"Unknown AI Provider: {provider}")

