import json
from enum import Enum
from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field, RootModel, ConfigDict, field_validator
from loguru import logger

class SourceFact(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(..., description="Unique technical identifier.")
    client_name: str = Field(default="Unbox-ED", description="Client or brand this fact belongs to.")
    release_date: Optional[str] = Field(default="", description="Official source release date.")
    core_fact: str = Field(..., description="The core fact or claim.")
    student_outcome: Optional[str] = Field(default="", description="The real-world benefit, value outcome, or metric.")
    pedagogical_context: Optional[str] = Field(default="", description="Context, delivery framework, or methodology.")
    target_audience: Optional[str] = Field(default="Target audience", description="Primary audience for this fact.")
    keywords: List[str] = Field(default_factory=list)
    learning_challenges: List[str] = Field(default_factory=list, description="Specific pain points or challenges addressed.")
    skill_milestones: List[str] = Field(default_factory=list, description="Key milestones or outcomes achieved.")
    teaching_differentiator: Optional[str] = Field(None, description="How this differentiator beats traditional alternatives.")
    lesson_format: Optional[str] = Field(None, description="Modality or delivery format.")
    curriculum_prerequisites: Optional[str] = Field(None, description="Prerequisites or requirements.")
    product_name: Optional[str] = Field(None, description="Commercial Product or USP this fact belongs to.")
    category: Optional[str] = Field(None, description="Subject category (e.g. ROI, Pedagogy, Security).")
    proof_metric: Optional[str] = Field(None, description="Quantifiable proof metric, certification, or statistic.")
    km_inferred_details: List[str] = Field(default_factory=list, description="Details inferred by Knowledge Manager from raw source.")

class ProductUSP(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: str = Field(..., description="The name of the product or module.")
    student_age_group: Optional[str] = Field(default="", description="Age group or demographic.")
    target_segment: Optional[str] = Field(default="", description="Specific audience segment or persona.")
    key_outcome: Optional[str] = Field(default="", description="Measurable value outcome or benefit.")
    id: Optional[str] = None

class ClientUSPs(BaseModel):
    model_config = ConfigDict(extra='ignore')
    products: List[Any] = Field(default_factory=list, description="Core products/platforms offered with target segment.")
    services: List[Any] = Field(default_factory=list, description="Strategic services/consulting provided.")
    ips: List[Any] = Field(default_factory=list, description="Cutting-edge IP, proprietary tools, or frameworks.")

    @property
    def product_strings(self) -> List[str]:
        results = []
        for p in self.products:
            if isinstance(p, dict):
                name = p.get("name", "")
                seg = p.get("target_segment") or p.get("student_age_group", "")
                results.append(f"{name} ({seg})" if seg else name)
            elif hasattr(p, "name"):
                seg = getattr(p, "target_segment", "") or getattr(p, "student_age_group", "")
                results.append(f"{p.name} ({seg})" if seg else p.name)
            elif isinstance(p, str):
                results.append(p)
        return results

    @property
    def service_strings(self) -> List[str]:
        results = []
        for s in self.services:
            if isinstance(s, dict):
                results.append(s.get("name", str(s)))
            else:
                results.append(str(s))
        return results

    @property
    def ip_strings(self) -> List[str]:
        results = []
        for ip in self.ips:
            if isinstance(ip, dict):
                results.append(ip.get("name", str(ip)))
            else:
                results.append(str(ip))
        return results


class ClientData(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: str = Field(..., description="Brand or Client Name")
    password: str = Field(default="changeme2026", description="Client specific login password for SaaS portal")
    industry: str = Field(..., description="Industry vertical")
    usps: ClientUSPs = Field(..., description="Hierarchical Unique Selling Points (Products, Services, IPs).")
    brand_voice: str = Field(..., description="Desired tone and style.")
    brand_vision: str = Field(..., description="Client long-term vision.")
    brand_mission: Optional[str] = Field(None, description="Client strategic mission statement.")
    brand_focus: str = Field(..., description="Client strategic focus.")
    brand_messaging: str = Field(..., description="The core message the brand wants to communicate to its customers.")
    tone_formality: int = Field(default=5, ge=1, le=10, description="Formality scale from 1 (Casual/Playful) to 10 (Academic/Formal).")
    market_trajectory: Literal["going down", "stabilizing", "neutral", "going up"] = Field(default="neutral", description="The client's view on current market direction.")
    cta_preference: str = Field(..., description="Primary lead-gen call to action.")
    target_audience: List[str] = Field(default_factory=list, description="Target demographic groups.")
    audience_personas: List[str] = Field(default_factory=list, description="Granular personas.")
    donts: List[str] = Field(default_factory=list, description="Negative constraints: What the AI must NEVER say or do for this brand.")
    narrative_hooks: List[str] = Field(default_factory=lambda: ["Contrarian/Insightful", "Technical Deep-Dive", "Strategic Visionary", "Case-Study style outcome"], description="Allowed narrative styles/hooks for generation.")
    micro_kb: List[Dict[str, Any]] = Field(default_factory=list, description="Sovereign Short KB Fact Vault.")
    visual_config: Dict[str, Any] = Field(default_factory=dict, description="Structured visual style config and palette.")

class SwarmSignal(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(..., description="Unique identifier for the trend signal.")
    title: str = Field(..., description="Title or headline of the trend.")
    summary: str = Field(default="", description="Detailed summary of the market signal.")
    url: str = Field(default="", description="Source URL or citation.")
    consensus_pct: float = Field(default=0.0, description="Consensus percentage across scraper swarm.")
    source_count: int = Field(default=1, description="Number of distinct sources corroborating signal.")
    importance_badge: str = Field(default="🟢 High Signal", description="Badge/importance level.")
    category: str = Field(default="General", description="Topic category.")
    timestamp: str = Field(default="", description="Extraction or discovery timestamp.")
    suggested_hook: Optional[str] = Field(None, description="Suggested narrative angle or hook.")

class SwarmKBModel(RootModel):
    root: Dict[str, SwarmSignal]

class SourceKBModel(RootModel):
    root: Dict[str, SourceFact]

class ClientKBModel(RootModel):
    root: Dict[str, ClientData]

class AdjudicationOutput(BaseModel):
    """Schema for LLM Adjudication output to ensure data integrity."""
    model_config = ConfigDict(extra='ignore')
    refined_post: str = Field(..., description="The compliant, refined social post.")
    nano_prompt: str = Field(..., description="Image generation prompt.")
    acid_score: int = Field(..., ge=1, le=10, description="Score for technical consistency and logic reliability.")
    quality_score: int = Field(..., ge=1, le=10, description="Score for creative authority and engagement.")
    client_score: int = Field(..., ge=1, le=10, description="Score for adherence to client USPs, voice, and vision.")
    hallucination_risk: str = Field(..., description="Assessment of technical accuracy.")
    fact_alignment_score: int = Field(..., ge=1, le=10, description="How much of the core KB fact was preserved.")
    inferred_details: List[str] = Field(default_factory=list, description="List of technical details added by AI reasoning (the 'Gap').")
    writing_engine_violation: bool = Field(default=False, description="Set to true if the draft violates ANY Modern Writing Engine rules (e.g., uses corporate buzzwords, starts with a generic 'At [Brand Name]...', or uses passive voice).")
    visual_style_violation: bool = Field(default=False, description="Set to true if the nano_prompt contradicts the provided VISUAL CONSTRAINTS (e.g., if the visual constraint is '3D Isometric' but the prompt is 'photorealistic').")

    @field_validator('refined_post')
    @classmethod
    def check_forbidden_words(cls, v: str) -> str:
        import re
        # Repurposing this validator to act as an XML tag sanitizer (defense-in-depth)
        # since forbidden words context is handled by the Orchestrator Observatory.
        if "<DATA" in v or "</DATA" in v:
            logger.warning("Detected potentially malicious <DATA> tags in refined_post. Stripping them.")
            v = v.replace("<DATA", "< DATA").replace("</DATA", "</ DATA")
            
        # Strip hallucinated visual prompt meta-text from the post
        pattern = r"(?i)(?:\n\s*)?\**(?:Nano Banana\s*)?Visual Prompt:?\**.*"
        if re.search(pattern, v, flags=re.DOTALL):
            logger.warning("Detected leaked visual prompt meta-text in refined_post. Stripping it.")
            v = re.sub(pattern, "", v, flags=re.DOTALL).strip()
            
        return v

class ComplianceKB(BaseModel):
    model_config = ConfigDict(extra='forbid')
    forbidden_words: List[str]
    required_elements: List[str]
    branding_rule: str

class FunnelStage(str, Enum):
    AWARENESS = "Awareness (TOFU)"
    ENGAGEMENT = "Engagement (MOFU)"
    LEADS = "Leads (MOFU/BOFU)"
    CONVERSION = "Conversion (BOFU)"
    RETENTION = "Retention (Advocacy)"

class ContentSourceMode(str, Enum):
    BRAND_DB = "Brand Database (Approved Facts)"
    INTERNET_RESEARCH = "Internet Research (Live Trends)"
    HYBRID_FUSION = "Hybrid Fusion (Verified Trends)"

class ApprovalStatus(str, Enum):
    PENDING_REVIEW = "Pending Review"
    APPROVED = "Approved"
    REVISION_REQUESTED = "Revision Requested"

class CostTelemetry(BaseModel):
    model_config = ConfigDict(extra='ignore')
    generation_time_ms: float = Field(default=0.0, description="Time taken to generate and adjudicate in milliseconds.")
    total_tokens: int = Field(default=0, description="Total tokens utilized.")
    estimated_cost_inr: float = Field(default=0.0, description="Estimated total compute cost in INR.")
    human_baseline_cost_inr: float = Field(default=1000.0, description="Human agency cost baseline.")
    target_sla_cost_inr: float = Field(default=200.0, description="SLA target cost in INR.")
    cost_savings_inr: float = Field(default=0.0, description="Net cost savings vs baseline.")
    cost_savings_pct: float = Field(default=0.0, description="Percentage cost reduction.")
    speed_savings_pct: float = Field(default=0.0, description="Percentage time reduction vs 1hr baseline.")

class MarketingAssetPackage(BaseModel):
    """Schema for channel-ready marketing asset package with lifecycle and telemetry."""
    model_config = ConfigDict(extra='ignore')
    id: str = Field(..., description="Unique asset identifier.")
    topic: str = Field(..., description="Topic or headline.")
    funnel_stage: str = Field(default=FunnelStage.AWARENESS.value, description="Target funnel stage.")
    source_mode: str = Field(default=ContentSourceMode.BRAND_DB.value, description="Content knowledge source mode.")
    channel_format: str = Field(default="LinkedIn Post", description="Marketing channel format.")
    raw_draft: str = Field(default="", description="Initial draft generated.")
    refined_post: str = Field(..., description="Final adjudicated post text.")
    nano_prompt: str = Field(default="", description="Visual prompt description.")
    adjudication_output: Optional[AdjudicationOutput] = Field(default=None, description="Full adjudication output.")
    approval_status: str = Field(default=ApprovalStatus.PENDING_REVIEW.value, description="Current approval status.")
    approver_notes: str = Field(default="", description="Notes or edits from Marketing Head.")
    cost_telemetry: Optional[CostTelemetry] = Field(default=None, description="Cost and SLA telemetry.")
    created_at: str = Field(default="", description="Creation timestamp.")