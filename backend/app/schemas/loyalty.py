from pydantic import BaseModel


class LoyaltyTransactionOut(BaseModel):
    date: str        # YYYY-MM-DD
    event: str
    points: str      # "+500" or "-200"
    type: str        # "earned" | "redeemed"

    model_config = {"from_attributes": True}


class LoyaltyRewardOut(BaseModel):
    id: str
    name: str
    points: int          # field alias for points_required
    description: str | None = None

    model_config = {"from_attributes": True}


class LoyaltyDataOut(BaseModel):
    points: int
    tier: str
    member_since: str | None = None
    history: list[LoyaltyTransactionOut] = []
    available_rewards: list[LoyaltyRewardOut] = []
