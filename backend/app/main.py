import logging
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.response import error

logger = logging.getLogger("uvicorn.error")

# ── Ensure all models are loaded before routers ──────────────
import app.db.init_models  # noqa: F401

# ── Router imports (added as each module is built) ────────────
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.vendor import router as vendor_router

app = FastAPI(
    title="Vendor Portal API",
    version="1.0.0",
    docs_url="/api/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/api/redoc" if settings.APP_ENV == "development" else None,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ──────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s\n%s",
        request.method, request.url,
        traceback.format_exc(),
    )
    origin = request.headers.get("origin", "")
    allowed = settings.allowed_origins_list
    headers = {}
    if origin in allowed:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    msg = str(exc) if settings.APP_ENV == "development" else "Internal server error"
    return JSONResponse(
        status_code=500,
        content=error(msg).model_dump(),
        headers=headers,
    )

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router,   prefix="/api/v1/auth",   tags=["Auth"])
app.include_router(admin_router,  prefix="/api/v1/admin",  tags=["Admin"])
app.include_router(vendor_router, prefix="/api/v1/vendor", tags=["Vendor"])

# ── Static files (uploaded images / documents) ───────────────
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ── Health check ─────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health():
    return {"success": True, "message": "OK"}
