"""
Bourbon.AI Studio — Public Precompiled Server & Dashboard Launcher
===================================================================
Runs the Bourbon.AI platform utilizing precompiled, IP-protected binary cores.
Zero proprietary algorithm source code is required or distributed.
"""

import os
import sys
import time
import secrets
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Fix Windows cp1252 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
CORE_DIR = ROOT_DIR / "core_binaries"
SRC_DIR = ROOT_DIR / "src"
DIST_DIR = ROOT_DIR / "frontend" / "dist"

# Add precompiled binaries & public models to sys.path
for p in [str(CORE_DIR), str(SRC_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from models import ClientData
from auth_manager import manage_session

app = FastAPI(
    title="Bourbon.AI Enterprise Engine (Public Edition)",
    description="Autonomous Brand Intelligence & Content Studio with IP Protection",
    version="2.0-public"
)

# CORS middleware for development & GitHub Pages evaluations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION MODELS & ENDPOINTS ---
class AuthLoginRequest(BaseModel):
    username: str
    password: str

class AuthLogoutRequest(BaseModel):
    token: str

# Generate secure temporary key if ADMIN_PASSWORD is not set
DYNAMIC_ADMIN_KEY = os.getenv("ADMIN_PASSWORD") or secrets.token_urlsafe(12)

@app.post("/api/auth/login")
def api_auth_login(req: AuthLoginRequest):
    username = req.username.strip()
    password = req.password.strip()

    admin_pass = os.getenv("ADMIN_PASSWORD") or DYNAMIC_ADMIN_KEY

    if username == "admin" and password == admin_pass:
        token = manage_session("create", client="Unbox-ED", username=username)
        return {
            "success": True,
            "token": token,
            "username": username,
            "client": "Unbox-ED",
            "message": "Admin session authorized."
        }
    raise HTTPException(status_code=401, detail="Invalid username or security key.")

@app.get("/api/auth/verify")
def api_auth_verify(token: str = Query(...)):
    session = manage_session("verify", token=token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    return {"success": True, "session": session}

@app.post("/api/auth/logout")
def api_auth_logout(req: AuthLogoutRequest):
    manage_session("delete", token=req.token)
    return {"success": True, "message": "Logged out successfully."}

@app.get("/api/health")
def api_health():
    return {
        "status": "ok",
        "edition": "Bourbon.AI IP-Protected Public Release",
        "timestamp": int(time.time()),
        "binaries_loaded": True
    }

@app.get("/api/clients")
def api_clients():
    return {
        "clients": ["Unbox-ED"],
        "selected_client": "Unbox-ED",
        "client_data": {
            "name": "Unbox-ED",
            "industry": "EdTech",
            "brand_voice": "Empathetic, Visionary, and Rigorous",
            "brand_vision": "Transforming foundational learning into lifelong creative agency.",
            "brand_focus": "Hands-on sensory writing and speech mechanics",
            "brand_messaging": "Tactile learning breaks through blank-page anxiety.",
            "tone_formality": 6,
            "cta_preference": "Explore the Unbox-ED Method",
            "target_audience": ["Parents of 8-14 year olds", "Educators"],
            "donts": ["Do not use generic corporate jargon like synergy, leverage, utilize."]
        }
    }

# Mount static React MUI distribution if built
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 65)
    print("  ☕ BOURBON.AI STUDIO — IP-PROTECTED PUBLIC LAUNCHER")
    print("=" * 65)
    print("  Serving React MUI Frontend & APIs on http://localhost:8000")
    if os.getenv("ADMIN_PASSWORD"):
        print("  Admin Key: [Configured via ADMIN_PASSWORD environment variable]\n")
    else:
        print(f"  Temporary Local Admin Key: {DYNAMIC_ADMIN_KEY}")
        print("  (Tip: Set ADMIN_PASSWORD in environment to use a custom key)\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
