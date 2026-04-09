# Master data = document types.
# This module re-exports the document_types router under /master
# for legacy route compatibility with the old PHP system.
from app.api.v1.admin.documents import router  # noqa: F401
