# ☕ Bourbon.AI Studio — Enterprise Edition

[![GitHub Pages Deployment](https://github.com/Srini-arch/Bourbon.AI/actions/workflows/deploy_pages.yml/badge.svg)](https://github.com/Srini-arch/Bourbon.AI/actions/workflows/deploy_pages.yml)
[![License: Proprietary IP](https://img.shields.io/badge/Security-IP--Protected%20Precompiled%20Core-amber)](https://github.com/Srini-arch/Bourbon.AI)
[![Frontend: React 19 + MUI](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Material--UI-blue)](https://mui.com/)
[![Backend: FastAPI Async](https://img.shields.io/badge/Backend-FastAPI%20Async-009688)](https://fastapi.tiangolo.com/)

> **Live Web Application:** [https://srini-arch.github.io/Bourbon.AI/](https://srini-arch.github.io/Bourbon.AI/)  
> **Master Admin Key:** `bourbon2026`

---

## 🌟 Overview

Bourbon.AI is an **autonomous, multi-stage brand intelligence and high-authority content generation engine**. Unlike generic prompt-wrapper apps, Bourbon.AI implements a closed-loop multi-agent assembly line:

```
┌────────────────────────────────────────────────────────────────────────┐
│              BOURBON.AI SINGLE-PASS ASSEMBLY LINE                      │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ Stage             │ Engine                     │ Core Function         │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ 1. SME Generator  │ Grounded Fact Fusion       │ 0% Hallucination Draft│
│ 2. The Observatory│ AST Adjudication Gate      │ 1:1 Anti-Jargon Purge │
│ 3. Vision Gate    │ Multimodal Quality Auditor │ Zero-Text / Zero-Anat │
│ 4. Watermarker    │ Luminance Compositor       │ Deterministic Branding│
└───────────────────┴────────────────────────────┴───────────────────────┘
```

---

## 🛡️ Intellectual Property (IP) Protection Architecture

To ensure enterprise security and protect commercial intellectual property in this public repository:
- **Zero Proprietary Source Code:** Algorithms, prompt recipes, and mathematical phase-locking engines are **not** distributed in raw `.py` form.
- **Precompiled Binary Core:** The core modules (`generator`, `adjudicator`, `orchestrator`, `image_agent`, `unified_vector_db`) are precompiled with Python `-OO` bytecode optimization into `core_binaries/` with all docstrings and assertions stripped.
- **Single Admin Gateway:** Access to all brand KYC, campaign suites, and generation controls is protected behind the master admin security gate.

---

## 🚀 Quick Start (Local Execution)

### 1. Clone the Public Repository
```bash
git clone https://github.com/Srini-arch/Bourbon.AI.git
cd Bourbon.AI
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch the IP-Protected Public Server
```bash
python public_server.py
```

The unified dashboard will be accessible at **`http://localhost:8000`**.

### 4. Admin Access
- **Identifier:** `admin`
- **Master Key:** `bourbon2026`

---

## 🌐 Live Web Deployment (GitHub Pages)

The React 19 Material-UI frontend is configured for automatic continuous deployment via GitHub Actions:
- **Hosting URL:** `https://srini-arch.github.io/Bourbon.AI/`
- Every push to the `main` branch automatically triggers `.github/workflows/deploy_pages.yml`, building the Vite distribution and publishing it to GitHub Pages.

---

## 📁 Repository Structure

```
Bourbon.AI/
├── .github/
│   └── workflows/
│       └── deploy_pages.yml      # Automated GitHub Pages CI/CD
├── core_binaries/                # 🛡️ Precompiled IP-Protected Binary Core (.pyc)
│   ├── generator.pyc
│   ├── adjudicator.pyc
│   ├── image_agent.pyc
│   ├── orchestrator.pyc
│   ├── unified_vector_db.pyc
│   ├── ip_manifest.json          # Compilation audit record
│   └── __init__.py               # Binary loader package
├── frontend/                     # React 19 + MUI Enterprise Studio
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLogin.jsx    # ✨ Master Admin Login Landing Page
│   │   │   ├── BbnWorkstation.jsx# Central Campaign Suite
│   │   │   ├── CreativeStudio.jsx# Multi-Slide Visual Designer
│   │   │   └── BrandKYC.jsx      # Brand Identity & Guardrails
│   │   ├── App.jsx               # AuthGate & Navigation
│   │   └── apiConfig.js          # Unified API Config
│   ├── dist/                     # Pre-built production bundle
│   ├── package.json
│   └── vite.config.js
├── src/                          # Public models & data schemas
│   ├── models.py
│   ├── ai_provider.py
│   └── auth_manager.py
├── public_server.py              # Public FastAPI server launcher
├── requirements.txt              # Runtime dependencies
└── README.md
```

---

## 📄 License & Attribution

Copyright © 2026 Bourbon.AI. All Rights Reserved.  
Core algorithms and prompt engineering IP are proprietary. Distributed under precompiled binary evaluation license.
