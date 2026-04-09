from fastapi import APIRouter

from app.api.v1.vendor import dashboard, meta, profile, documents, products, service_provider, orders, chatbot, notifications

router = APIRouter()
router.include_router(meta.router,               prefix="")
router.include_router(dashboard.router,          prefix="/dashboard")
router.include_router(profile.router,            prefix="/profile")
router.include_router(documents.router,          prefix="/documents")
router.include_router(products.router,           prefix="/products")
router.include_router(service_provider.router,   prefix="/service-provider")
router.include_router(orders.router,             prefix="")
router.include_router(chatbot.router,            prefix="/chatbot")
router.include_router(notifications.router,      prefix="/notifications")
