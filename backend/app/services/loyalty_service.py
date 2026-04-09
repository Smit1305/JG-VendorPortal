from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.loyalty import LoyaltyAccount, LoyaltyReward, LoyaltyTransaction
from app.core.exceptions import BadRequest, NotFound


# ── Tier logic ────────────────────────────────────────────────

TIERS = [
    ("Bronze",   0,     999),
    ("Silver",   1000,  4999),
    ("Gold",     5000,  19999),
    ("Platinum", 20000, 999_999_999),
]


def compute_tier(points: int) -> str:
    for name, low, high in TIERS:
        if low <= points <= high:
            return name
    return "Bronze"


# ── Account helpers ───────────────────────────────────────────

async def get_or_create_account(db: AsyncSession, user_id: str) -> LoyaltyAccount:
    result = await db.execute(
        select(LoyaltyAccount).where(LoyaltyAccount.user_id == user_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        account = LoyaltyAccount(user_id=user_id, total_points=0, member_since=date.today())
        db.add(account)
        await db.commit()
        await db.refresh(account)
    return account


async def add_points(
    db: AsyncSession,
    user_id: str,
    points: int,
    event: str,
    tx_type: str = "earned",
) -> LoyaltyAccount:
    """Add (positive) or deduct (negative) points and record a transaction."""
    account = await get_or_create_account(db, user_id)
    account.total_points = max(0, account.total_points + points)
    tx = LoyaltyTransaction(
        account_id=account.id,
        user_id=user_id,
        points=points,
        event=event,
        type=tx_type,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(account)
    return account


# ── Rewards catalogue ─────────────────────────────────────────

async def list_active_rewards(db: AsyncSession) -> list[LoyaltyReward]:
    result = await db.execute(
        select(LoyaltyReward)
        .where(LoyaltyReward.is_active == True)  # noqa: E712
        .order_by(LoyaltyReward.points_required)
    )
    return result.scalars().all()


async def redeem_reward(db: AsyncSession, user_id: str, reward_id: str) -> str:
    # Fetch reward
    result = await db.execute(
        select(LoyaltyReward).where(
            LoyaltyReward.id == reward_id,
            LoyaltyReward.is_active == True,  # noqa: E712
        )
    )
    reward = result.scalar_one_or_none()
    if not reward:
        raise NotFound("Reward not found or no longer available")

    # Check points
    account = await get_or_create_account(db, user_id)
    if account.total_points < reward.points_required:
        raise BadRequest(
            f"Insufficient points. You have {account.total_points} pts but need {reward.points_required} pts."
        )

    # Deduct points
    await add_points(
        db, user_id,
        points=-reward.points_required,
        event=f"Redeemed: {reward.name}",
        tx_type="redeemed",
    )
    return reward.name


# ── Full data response ────────────────────────────────────────

async def get_rewards_data(db: AsyncSession, user_id: str) -> dict:
    account = await get_or_create_account(db, user_id)

    # Load transactions without triggering lazy-load
    tx_result = await db.execute(
        select(LoyaltyTransaction)
        .where(LoyaltyTransaction.account_id == account.id)
        .order_by(LoyaltyTransaction.created_at.desc())
        .limit(50)
    )
    transactions = tx_result.scalars().all()

    rewards = await list_active_rewards(db)

    history = [
        {
            "date": t.created_at.strftime("%Y-%m-%d"),
            "event": t.event,
            "points": f"+{t.points}" if t.points >= 0 else str(t.points),
            "type": t.type,
        }
        for t in transactions
    ]

    available_rewards = [
        {
            "id": r.id,
            "name": r.name,
            "points": r.points_required,
            "description": r.description or "",
        }
        for r in rewards
    ]

    return {
        "points": account.total_points,
        "tier": compute_tier(account.total_points),
        "member_since": account.member_since.strftime("%Y-%m-%d") if account.member_since else None,
        "history": history,
        "available_rewards": available_rewards,
    }
