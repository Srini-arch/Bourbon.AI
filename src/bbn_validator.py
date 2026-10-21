"""
Bourbon.AI BBN Canonical Deliverable Validator (Schema v2.5)
Strictly verifies that any .bbn file is an authentic, non-partial,
canonical Bourbon AI slide deliverable produced by the multi-agent engine.
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional
from loguru import logger

REQUIRED_TOP_LEVEL_KEYS = [
    "schema_version",
    "project_meta",
    "brand_governance",
    "phase_1_genai",
    "phase_2_compositing",
    "swarm_audit_trail"
]

def validate_bbn_manifest(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates a loaded dictionary against canonical Bourbon AI Schema v2.5.
    Returns (is_valid, list_of_errors).
    """
    errors: List[str] = []

    if not isinstance(data, dict):
        return False, ["Manifest is not a valid JSON dictionary."]

    # 1. Reject wrapper bundles masquerading as slide deliverables
    if "slides" in data and isinstance(data["slides"], list):
        return False, ["Manifest contains top-level 'slides' array (wrapper bundle, not a single deliverable .bbn)."]

    # 2. Check schema version
    ver = data.get("schema_version")
    if not ver or not str(ver).startswith("2."):
        errors.append(f"Invalid or missing schema_version (expected '2.x', got '{ver}').")

    # 3. Check required top-level sections
    for key in REQUIRED_TOP_LEVEL_KEYS:
        if key not in data:
            errors.append(f"Missing required section: '{key}'.")

    if errors:
        return False, errors

    # 4. Validate project_meta
    pm = data.get("project_meta", {})
    if not isinstance(pm, dict):
        errors.append("Invalid 'project_meta' section (expected object).")
    else:
        for f in ["bbn_id", "title", "campaign_id"]:
            if not pm.get(f):
                errors.append(f"Missing required project_meta field: '{f}'.")

    # 5. Validate brand_governance
    bg = data.get("brand_governance", {})
    if not isinstance(bg, dict):
        errors.append("Invalid 'brand_governance' section (expected object).")
    else:
        if not bg.get("client_name"):
            errors.append("Missing client_name in brand_governance.")

    # 6. Validate phase_1_genai
    p1 = data.get("phase_1_genai", {})
    if not isinstance(p1, dict):
        errors.append("Invalid 'phase_1_genai' section (expected object).")
    else:
        if not p1.get("engine"):
            errors.append("Missing AI engine in phase_1_genai.")
        if not p1.get("base_prompt"):
            errors.append("Missing base_prompt in phase_1_genai.")

    # 7. Validate phase_2_compositing
    p2 = data.get("phase_2_compositing", {})
    if not isinstance(p2, dict):
        errors.append("Invalid 'phase_2_compositing' section (expected object).")
    else:
        if not p2.get("template_type"):
            errors.append("Missing template_type in phase_2_compositing.")
        typo = p2.get("typography", {})
        if not isinstance(typo, dict) or not typo.get("main_headline"):
            errors.append("Missing typography.main_headline in phase_2_compositing.")

    # 8. Validate swarm_audit_trail
    sat = data.get("swarm_audit_trail", {})
    if not isinstance(sat, dict):
        errors.append("Invalid 'swarm_audit_trail' section (expected object).")
    elif "consensus_score" not in sat:
        errors.append("Missing consensus_score in swarm_audit_trail.")

    is_valid = len(errors) == 0
    return is_valid, errors

def is_canonical_bourbon_bbn(file_path: Path) -> Tuple[bool, Optional[Dict[str, Any]], List[str]]:
    """
    Checks if a physical file path is a valid Bourbon.AI .bbn package.
    """
    if not file_path.exists() or not file_path.is_file():
        return False, None, [f"File {file_path} does not exist."]

    if file_path.suffix.lower() != ".bbn":
        return False, None, [f"File {file_path.name} does not have .bbn extension."]

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return False, None, [f"JSON parse error in {file_path.name}: {str(e)}"]

    is_valid, errors = validate_bbn_manifest(data)
    return is_valid, data if is_valid else None, errors
