import re

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import require_vendor

router = APIRouter()

# ── System prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are a helpful AI assistant for the Jigisha International Vendor Portal.
You assist vendors with questions ONLY related to:
- Vendor registration, onboarding, and profile setup
- Document upload, types, and verification status
- Product listing, catalogue management, pricing, and inventory
- Order management, fulfilment, and status tracking
- RFQ (Request for Quotation) — submitting quotes, deadlines, and responses
- Logistics, shipment tracking, carriers, and delivery timelines
- Returns, refund requests, and rejection reasons
- Payments, invoices, due dates, settlement cycles, and TDS
- Loans and trade credit financing options
- Support ticket creation and resolution
- GST compliance, TDS certificates, and regulatory documentation
- Commission structure, settlement rules, and commercial policies
- Vendor loyalty rewards and subscription plans

If a user asks something outside these topics, politely say:
"I can only help with Jigisha Vendor Portal topics. Please contact our support team for other queries."

Keep answers concise, clear, and professional. Use bullet points for lists."""

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# ── Built-in vendor portal knowledge base (rule-based fallback) ─
KB: list[tuple[list[str], str]] = [
    (
        ["register", "sign up", "signup", "create account", "onboard", "get started"],
        "**Getting started on the Vendor Portal:**\n\n"
        "• Visit the portal and click **Register as Vendor**\n"
        "• Fill in your business details (name, GSTIN, PAN, address)\n"
        "• Upload required documents (PAN Card, GST Certificate, Bank details)\n"
        "• Submit for verification — takes 3–5 business days\n"
        "• You'll receive an email once your account is approved\n\n"
        "💡 Tip: Keep your documents ready in PDF/JPG format before starting.",
    ),
    (
        ["document", "upload", "verification", "verify", "kyc", "pan", "gst", "certificate"],
        "**Document Upload & Verification:**\n\n"
        "• Go to **My Documents** in the sidebar\n"
        "• Required: PAN Card, GST Certificate, Bank Account details, Company Registration\n"
        "• Accepted formats: PDF, JPG, PNG (max 10 MB each)\n"
        "• Verification takes 3–5 business days after all documents are submitted\n"
        "• Status shows: Pending → Verified or Rejected (with reason)\n\n"
        "If rejected, you can resubmit with corrected documents.",
    ),
    (
        ["product", "catalogue", "listing", "sku", "add product", "inventory", "price", "stock"],
        "**Managing Your Product Catalogue:**\n\n"
        "• Go to **Manage Catalogue** in the sidebar\n"
        "• Click **Add Product** to list a new item\n"
        "• Fill in: product name, category, description, price, HSN code, and images\n"
        "• For bulk upload, use the CSV template from the catalogue page\n"
        "• Products go live after admin approval (usually within 24 hours)\n\n"
        "You can edit or deactivate products anytime from the catalogue list.",
    ),
    (
        ["order", "orders", "fulfilment", "fulfill", "dispatch", "processing", "delivered", "shipped"],
        "**Managing Orders:**\n\n"
        "• View all orders under **Manage Orders** in the sidebar\n"
        "• Order statuses: Processing → Shipped → Delivered → Completed\n"
        "• Once an order is placed, pack and dispatch within 2 business days\n"
        "• Update shipment tracking from the order detail page\n"
        "• Completed orders trigger payment processing on the next Friday cycle\n\n"
        "For order disputes, raise a return/refund request from the order detail.",
    ),
    (
        ["rfq", "quotation", "quote", "bid", "tender", "request for quotation"],
        "**RFQ (Request for Quotation):**\n\n"
        "• View open RFQs under **Manage RFQs** in the sidebar\n"
        "• Each RFQ has a deadline — submit your quote before it expires\n"
        "• Include unit price, delivery timeline, and any terms in your quote\n"
        "• Buyer reviews all quotes and selects the best offer\n"
        "• If selected, the RFQ converts into a purchase order automatically\n\n"
        "Expired RFQs cannot be quoted — check regularly for new ones.",
    ),
    (
        ["logistics", "shipment", "shipping", "carrier", "track", "delivery", "courier"],
        "**Logistics & Shipments:**\n\n"
        "• View all shipments under **Manage Logistics** in the sidebar\n"
        "• Supported carriers: Delhivery, Blue Dart, DTDC, Ecom Express\n"
        "• Enter the AWB/tracking number when dispatching an order\n"
        "• Customers are notified automatically when tracking is updated\n"
        "• For lost or delayed shipments, raise a support ticket\n\n"
        "Delivery SLA: Metro — 3 days, Tier-2 — 5 days, Rest — 7 days.",
    ),
    (
        ["return", "refund", "reject", "return request", "return policy"],
        "**Returns & Refunds:**\n\n"
        "• Go to **Manage Returns** in the sidebar\n"
        "• Returns can be raised within 7 days of delivery\n"
        "• Valid reasons: damaged goods, wrong item, quality issues\n"
        "• Submit photos and description when raising a return\n"
        "• Our team reviews within 5 business days\n"
        "• Approved refunds are adjusted in the next payment cycle\n\n"
        "You can track return status (Pending / Approved / Rejected) in real time.",
    ),
    (
        ["payment", "invoice", "settle", "settlement", "due", "payout", "paid", "pending payment", "tds"],
        "**Payments & Settlements:**\n\n"
        "• Payments are processed every **Friday** for the previous week's delivered orders\n"
        "• Funds credited to your registered bank account within 2–3 business days\n"
        "• View all transactions under **Manage Payments** in the sidebar\n"
        "• TDS (1% for business, 5% for individuals) is deducted per CBDT rules\n"
        "• Download invoices and payment statements from the Payments page\n\n"
        "For payment disputes, contact support@jigisha.com.",
    ),
    (
        ["loan", "credit", "finance", "borrow", "funding", "working capital", "apply loan"],
        "**Loans & Trade Credit:**\n\n"
        "• Apply for a loan under **Manage Loans** in the sidebar\n"
        "• Available loan types: Working Capital, Inventory Finance, Trade Credit\n"
        "• Eligibility: 6+ months on the portal with verified documents\n"
        "• Submit amount, tenure, and purpose — team reviews within 3 days\n"
        "• Interest rates start from 12% p.a. based on your credit profile\n\n"
        "Loans are disbursed directly to your registered bank account.",
    ),
    (
        ["support", "ticket", "complaint", "help ticket", "raise ticket", "issue"],
        "**Raising a Support Ticket:**\n\n"
        "• Go to **Support Requests** in the sidebar\n"
        "• Click **New Request** and fill in the issue details\n"
        "• Categories: Technical, Payment, Order, Product, Account, Other\n"
        "• Priority: Low / Medium / High / Urgent\n"
        "• You'll receive ticket ID and email confirmation\n"
        "• Track resolution status under Support Requests\n\n"
        "SLA: Urgent — 4 hrs, High — 24 hrs, Medium — 48 hrs, Low — 5 days.",
    ),
    (
        ["loyalty", "reward", "points", "tier", "bronze", "silver", "gold", "platinum", "redeem"],
        "**Loyalty Rewards Programme:**\n\n"
        "• Earn points for every completed order and on-time delivery\n"
        "• **Tiers:** Bronze (0–999 pts) → Silver (1,000–4,999) → Gold (5,000–19,999) → Platinum (20,000+)\n"
        "• Redeem points for: commission discounts, priority listing, free logistics, dedicated manager\n"
        "• View balance and redeem under **Loyalty Rewards** in the sidebar\n\n"
        "Points are credited automatically after order completion.",
    ),
    (
        ["commission", "commercial", "fee", "rate", "margin", "policy"],
        "**Commission & Commercial Policy:**\n\n"
        "• Jigisha charges a platform commission of 5–15% based on product category\n"
        "• View your category-wise commission rates under **Manage Commercials**\n"
        "• Commission is deducted before payment settlement\n"
        "• Annual contracts may qualify for lower negotiated rates\n\n"
        "Contact your account manager or raise a support ticket to discuss custom rates.",
    ),
    (
        ["profile", "update profile", "edit profile", "business details", "address", "contact"],
        "**Managing Your Profile:**\n\n"
        "• Go to **My Profile** in the sidebar\n"
        "• Update: business name, address, contact details, bank information\n"
        "• Profile photo and logo can be uploaded in JPG/PNG format\n"
        "• Bank account changes require re-verification\n"
        "• Keep your GSTIN and PAN details accurate to avoid payment holds\n\n"
        "Changes to critical fields (GST, PAN, bank) require admin approval.",
    ),
    (
        ["password", "reset password", "forgot password", "change password", "login"],
        "**Account & Password:**\n\n"
        "• To reset your password, click **Forgot Password** on the login page\n"
        "• A reset link will be sent to your registered email (valid for 30 minutes)\n"
        "• To change your password after login, go to Profile → Change Password\n"
        "• If your account is locked, contact support at info@jigisha.com\n\n"
        "For security, use a strong password with 8+ characters, numbers, and symbols.",
    ),
    (
        ["contact", "phone", "email", "reach", "call", "speak"],
        "**Contact Jigisha Support:**\n\n"
        "• 📞 **Phone:** +91 63593 65247 (Mon–Sat, 9AM–6PM)\n"
        "• 📧 **Email:** info@jigisha.com (response within 24 hours)\n"
        "• 💬 **Live Chat:** Available on the Assistance Service page\n"
        "• 🎫 **Support Ticket:** Raise one under Support Requests in the sidebar\n\n"
        "For urgent issues, calling or raising a High/Urgent ticket is recommended.",
    ),
    (
        ["hi", "hello", "hey", "good morning", "good afternoon", "namaste"],
        "Hello! 👋 I'm the Jigisha Vendor Portal assistant.\n\n"
        "I can help you with:\n"
        "• Product listing & catalogue management\n"
        "• Orders, shipments & returns\n"
        "• Payments, invoices & loans\n"
        "• Documents & verification\n"
        "• RFQs, support tickets & loyalty rewards\n\n"
        "What would you like help with today?",
    ),
    (
        ["thank", "thanks", "thank you", "helpful", "great"],
        "You're welcome! 😊 If you have any more questions about the Vendor Portal, feel free to ask. I'm here to help!",
    ),
]

OUT_OF_SCOPE_KEYWORDS = [
    "cricket", "movie", "recipe", "weather", "news", "politics", "stock market",
    "football", "song", "joke", "capital of", "history", "math", "write a poem",
    "who is", "what is the meaning of life",
]


def _rule_based_reply(message: str) -> str | None:
    """Return a KB answer if message matches, or None to fall through to AI."""
    lower = message.lower().strip()

    # Reject clearly out-of-scope questions
    if any(kw in lower for kw in OUT_OF_SCOPE_KEYWORDS):
        return (
            "I can only help with Jigisha Vendor Portal topics. "
            "Please contact our support team at info@jigisha.com for other queries."
        )

    # Match against KB entries (score = number of matched keywords)
    best_score = 0
    best_answer = None
    for keywords, answer in KB:
        score = sum(1 for kw in keywords if kw in lower)
        if score > best_score:
            best_score = score
            best_answer = answer

    if best_score > 0:
        return best_answer

    # Generic fallback
    return (
        "I'm not sure I understood your question. I can help with topics like:\n\n"
        "• Product listing & orders\n"
        "• Payments & invoices\n"
        "• Documents & verification\n"
        "• RFQs, returns & logistics\n"
        "• Loans & loyalty rewards\n\n"
        "Could you rephrase your question or choose one of the topics above?"
    )


# ── Schemas ───────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


# ── Route ─────────────────────────────────────────────────────

@router.post("/chat")
async def vendor_chat(request: ChatRequest, vendor=Depends(require_vendor)):
    # Try Gemini AI first if key is configured
    if settings.GEMINI_API_KEY:
        try:
            contents = []
            for msg in request.history[-10:]:
                contents.append({"role": msg.role, "parts": [{"text": msg.text}]})
            contents.append({"role": "user", "parts": [{"text": request.message}]})

            payload = {
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.6,
                    "maxOutputTokens": 600,
                    "topP": 0.9,
                },
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    GEMINI_URL,
                    params={"key": settings.GEMINI_API_KEY},
                    json=payload,
                )

            if resp.status_code == 200:
                data = resp.json()
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"reply": reply, "ok": True, "source": "ai"}

        except Exception:
            pass  # Fall through to rule-based

    # Rule-based fallback — always works
    reply = _rule_based_reply(request.message)
    return {"reply": reply, "ok": True, "source": "kb"}
