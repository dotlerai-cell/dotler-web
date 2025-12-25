from typing import List, Dict, Any
from urllib.parse import urlparse

class CampaignValidationError(Exception):
    pass

def validate_campaign_spec(spec: Dict[str, Any]) -> Dict[str, Any]:
    errors = []
    
    # Campaign name
    name = spec.get("campaign_name", "").strip()
    if not name:
        errors.append("campaign_name is required")
    elif len(name) > 255:
        errors.append(f"campaign_name exceeds 255 chars (got {len(name)})")
    
    # Budget
    budget = spec.get("budget_amount_micros")
    if budget is None:
        errors.append("budget_amount_micros is required")
    elif not isinstance(budget, (int, float)) or budget <= 0:
        errors.append(f"budget_amount_micros must be > 0 (got {budget})")
    
    # Keywords
    keywords = spec.get("keywords", [])
    if not keywords or len(keywords) == 0:
        errors.append("At least 1 keyword is required")
    else:
        for i, kw in enumerate(keywords):
            if isinstance(kw, dict):
                if not kw.get("text", "").strip():
                    errors.append(f"Keyword {i} has empty text")
                if kw.get("match_type") not in ["EXACT", "PHRASE", "BROAD"]:
                    errors.append(f"Keyword {i} has invalid match_type: {kw.get('match_type')}")
            elif isinstance(kw, str):
                if not kw.strip():
                    errors.append(f"Keyword {i} is empty")
    
    # Headlines
    headlines = spec.get("headlines", [])
    if len(headlines) < 3:
        errors.append(f"At least 3 headlines required (got {len(headlines)})")
    else:
        seen = set()
        for i, h in enumerate(headlines):
            h_str = str(h).strip()
            if not h_str:
                errors.append(f"Headline {i} is empty")
            elif len(h_str) > 30:
                errors.append(f"Headline {i} exceeds 30 chars (got {len(h_str)})")
            elif h_str in seen:
                errors.append(f"Headline {i} is duplicate: '{h_str}'")
            seen.add(h_str)
    
    # Descriptions
    descriptions = spec.get("descriptions", [])
    if len(descriptions) < 2:
        errors.append(f"At least 2 descriptions required (got {len(descriptions)})")
    else:
        seen = set()
        for i, d in enumerate(descriptions):
            d_str = str(d).strip()
            if not d_str:
                errors.append(f"Description {i} is empty")
            elif len(d_str) > 90:
                errors.append(f"Description {i} exceeds 90 chars (got {len(d_str)})")
            elif d_str in seen:
                errors.append(f"Description {i} is duplicate: '{d_str}'")
            seen.add(d_str)
    
    # Final URL
    final_url = spec.get("final_url", "").strip()
    if not final_url:
        errors.append("final_url is required")
    else:
        parsed = urlparse(final_url)
        if parsed.scheme != "https":
            errors.append(f"final_url must be HTTPS (got {parsed.scheme})")
    
    # Bidding strategy
    bidding = spec.get("bidding_strategy", "").upper()
    if bidding not in ["MAXIMIZE_CLICKS", "MAXIMIZE_CONVERSIONS", "TARGET_CPA", "MANUAL_CPC"]:
        errors.append(f"Invalid bidding_strategy: {bidding}")
    
    if errors:
        raise CampaignValidationError("; ".join(errors))
    
    return spec

def normalize_keywords(keywords: List[Any]) -> List[Dict[str, str]]:
    normalized = []
    for kw in keywords:
        if isinstance(kw, dict):
            normalized.append({
                "text": str(kw.get("text", "")).strip()[:80],
                "match_type": kw.get("match_type", "BROAD").upper()
            })
        elif isinstance(kw, str):
            normalized.append({"text": kw.strip()[:80], "match_type": "BROAD"})
    return normalized
