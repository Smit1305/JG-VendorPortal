from fastapi import APIRouter

from app.api.v1.admin import dashboard, users, vendors, categories, documents, company, profile, notifications

router = APIRouter()
router.include_router(dashboard.router,       prefix="/dashboard")
router.include_router(profile.router,         prefix="/profile")
router.include_router(users.router,           prefix="/users")
router.include_router(vendors.router,         prefix="/vendors")
router.include_router(categories.router,      prefix="/categories")
router.include_router(documents.router,       prefix="/document-types")
router.include_router(company.router,         prefix="/company")
router.include_router(notifications.router,   prefix="/notifications")
