"""Editable default pricing and vehicle limits for Fleet App plans."""

PLANS = {
    "free": {
        "code": "free",
        "name": "Free",
        "price": 0,
        "currency": "UGX",
        "billing_period_days": None,
        "vehicle_limit": 3,
        "description": "Try the core fleet tools with up to 3 vehicles.",
        "features": ["Vehicle records", "Maintenance tracking", "Documents and insurance", "Basic reports"],
    },
    "starter": {
        "code": "starter",
        "name": "Starter",
        "price": 30000,
        "currency": "UGX",
        "billing_period_days": 30,
        "vehicle_limit": 15,
        "description": "For small transport companies growing their fleet.",
        "features": ["Everything in Free", "Up to 15 vehicles", "Monthly subscription"],
    },
    "business": {
        "code": "business",
        "name": "Business",
        "price": 75000,
        "currency": "UGX",
        "billing_period_days": 30,
        "vehicle_limit": 50,
        "description": "More capacity for established fleets.",
        "features": ["Everything in Starter", "Up to 50 vehicles", "Monthly subscription"],
    },
}


def public_plans():
    return list(PLANS.values())
