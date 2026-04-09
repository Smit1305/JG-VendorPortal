# Import all models here so Alembic autogenerate can discover them.
# ALL models must be imported before any mapper configuration happens.

from app.db.base import Base  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.token_blacklist import TokenBlacklist, RefreshToken  # noqa: F401
from app.models.document_type import DocumentType  # noqa: F401
from app.models.company_profile import CompanyProfile  # noqa: F401
from app.models.password_reset import PasswordResetToken  # noqa: F401
from app.models.category import Category  # noqa: F401
# Import all User-related models BEFORE User so relationships resolve
from app.models.vendor_profile import VendorProfile  # noqa: F401
from app.models.vendor_document import VendorDocument  # noqa: F401
from app.models.service_provider import ServiceProvider  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.user import User  # noqa: F401 — import last so all FK targets exist
from app.models.notification import Notification  # noqa: F401
from app.models.loan import LoanApplication        # noqa: F401
from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction, LoyaltyReward  # noqa: F401
from app.models.vendor_return import VendorReturn  # noqa: F401
from app.models.support_ticket import SupportTicket  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.rfq import RFQ  # noqa: F401
from app.models.shipment import Shipment  # noqa: F401
from app.models.payment import Payment  # noqa: F401
