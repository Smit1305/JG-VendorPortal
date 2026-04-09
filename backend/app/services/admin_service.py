from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Conflict, NotFound
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserStatusUpdate, UserUpdate


# ── Dashboard ─────────────────────────────────────────────────

async def get_dashboard_stats(db: AsyncSession, org_id: str) -> dict:
    async def count(model, *filters):
        result = await db.execute(select(func.count()).select_from(model).where(*filters))
        return result.scalar_one()

    total_users    = await count(User, User.organization_id == org_id, User.role == "vendor")
    verified       = await count(User, User.organization_id == org_id,
                                 User.role == "vendor", User.document_verify_status == "verified")
    pending        = await count(User, User.organization_id == org_id,
                                 User.role == "vendor", User.document_verify_status == "pending")
    rejected       = await count(User, User.organization_id == org_id,
                                 User.role == "vendor", User.document_verify_status == "rejected")

    from app.models.product import Product
    total_products = await count(Product, Product.organization_id == org_id)

    from app.models.category import Category
    total_categories = await count(Category, Category.organization_id == org_id)

    total_all_users = await count(User, User.organization_id == org_id)

    # Recent users & vendors
    recent_users_q = await db.execute(
        select(User).where(User.organization_id == org_id)
        .order_by(User.created_at.desc()).limit(10)
    )
    recent_users = [
        {"id": u.id, "name": u.name, "email": u.email, "mobile": u.mobile,
         "role": u.role, "verification_status": u.verification_status,
         "created_at": u.created_at.isoformat() if u.created_at else None}
        for u in recent_users_q.scalars().all()
    ]

    from app.models.vendor_profile import VendorProfile

    recent_vendors_q = await db.execute(
        select(User, VendorProfile.company_name)
        .outerjoin(VendorProfile, VendorProfile.user_id == User.id)
        .where(User.organization_id == org_id, User.role == "vendor")
        .order_by(User.created_at.desc()).limit(10)
    )
    recent_vendors = [
        {"id": u.id, "name": u.name, "email": u.email,
         "company_name": company_name or u.name,
         "status": u.verification_status,
         "verification_status": u.verification_status,
         "document_verify_status": u.document_verify_status,
         "created_at": u.created_at.isoformat() if u.created_at else None}
        for u, company_name in recent_vendors_q.all()
    ]

    return {
        "total_users":      total_all_users,
        "total_vendors":    total_users,
        "verified_vendors": verified,
        "pending_vendors":  pending,
        "rejected_vendors": rejected,
        "total_products":   total_products,
        "total_categories": total_categories,
        "recent_users":     recent_users,
        "recent_vendors":   recent_vendors,
    }


# ── User management ───────────────────────────────────────────

async def list_users(
    db: AsyncSession,
    org_id: str,
    role: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[User], int]:
    filters = [User.organization_id == org_id]
    if role:
        filters.append(User.role == role)

    total_result = await db.execute(
        select(func.count()).select_from(User).where(*filters)
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(User)
        .where(*filters)
        .order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return result.scalars().all(), total


async def get_user(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")
    return user


async def update_user(db: AsyncSession, user_id: str, payload: UserUpdate) -> User:
    user = await get_user(db, user_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user_status(
    db: AsyncSession, user_id: str, payload: UserStatusUpdate
) -> User:
    user = await get_user(db, user_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def create_admin_user(db: AsyncSession, payload: UserCreate) -> User:
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise Conflict("Email already registered")
    user = User(
        organization_id=payload.organization_id,
        name=payload.name,
        email=payload.email,
        mobile=payload.mobile,
        password_hash=hash_password(payload.password),
        role="admin",
        verification_status="verified",
        document_verify_status="verified",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
