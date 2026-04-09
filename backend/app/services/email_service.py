from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import settings

_mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USER,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_HOST,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

_mailer = FastMail(_mail_config)


async def _send(to: str, subject: str, body: str) -> None:
    msg = MessageSchema(
        subject=subject,
        recipients=[to],
        body=body,
        subtype=MessageType.html,
    )
    await _mailer.send_message(msg)


# ── Templates (inline HTML — replace with Jinja2 files later) ─

def _base_template(heading: str, body_html: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#1d4ed8">{heading}</h2>
      {body_html}
      <hr style="margin:24px 0"/>
      <p style="color:#6b7280;font-size:12px">
        This is an automated message from {settings.MAIL_FROM_NAME}.
        Please do not reply to this email.
      </p>
    </div>
    """


# ── Public API ────────────────────────────────────────────────

async def send_account_activation(to: str, name: str) -> None:
    body = _base_template(
        "Account Approved",
        f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>Your vendor account has been <strong>approved</strong>.</p>
        <p>You can now log in to the Vendor Portal and complete your onboarding.</p>
        <a href="{settings.FRONTEND_URL}/login"
           style="display:inline-block;padding:10px 20px;background:#1d4ed8;
                  color:white;text-decoration:none;border-radius:4px">
          Login Now
        </a>
        """,
    )
    await _send(to, "Your Vendor Account Has Been Approved", body)


async def send_vendor_doc_approved(to: str, name: str) -> None:
    body = _base_template(
        "Documents Verified",
        f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>Your submitted documents have been <strong>verified</strong> successfully.</p>
        <p>Your account is now fully active.</p>
        """,
    )
    await _send(to, "Your Documents Have Been Verified", body)


async def send_vendor_doc_rejected(to: str, name: str, reason: str | None = None) -> None:
    reason_block = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    body = _base_template(
        "Documents Rejected",
        f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>Unfortunately, your submitted documents could <strong>not be verified</strong>.</p>
        {reason_block}
        <p>Please contact support if you have questions.</p>
        """,
    )
    await _send(to, "Action Required: Document Verification Failed", body)


async def send_vendor_doc_resubmit(to: str, name: str, reason: str | None = None) -> None:
    reason_block = f"<p><strong>Note from admin:</strong> {reason}</p>" if reason else ""
    body = _base_template(
        "Please Resubmit Your Documents",
        f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>We need you to <strong>resubmit</strong> your documents for verification.</p>
        {reason_block}
        <a href="{settings.FRONTEND_URL}/vendor/documents"
           style="display:inline-block;padding:10px 20px;background:#1d4ed8;
                  color:white;text-decoration:none;border-radius:4px">
          Upload Documents
        </a>
        """,
    )
    await _send(to, "Action Required: Resubmit Your Documents", body)


async def send_assistance_request_notification(
    to: str,
    vendor_name: str,
    vendor_email: str,
    vendor_phone: str,
    service: str,
    message: str,
) -> None:
    body = _base_template(
        "New Assistance Request",
        f"""
        <p>A vendor has submitted an assistance request via the Vendor Portal.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0">
          <tr><td style="padding:6px 12px;background:#fff1f2;font-weight:600;width:140px">Service</td>
              <td style="padding:6px 12px;border-bottom:1px solid #fecdd3">{service}</td></tr>
          <tr><td style="padding:6px 12px;background:#fff1f2;font-weight:600">Vendor Name</td>
              <td style="padding:6px 12px;border-bottom:1px solid #fecdd3">{vendor_name}</td></tr>
          <tr><td style="padding:6px 12px;background:#fff1f2;font-weight:600">Email</td>
              <td style="padding:6px 12px;border-bottom:1px solid #fecdd3">{vendor_email}</td></tr>
          <tr><td style="padding:6px 12px;background:#fff1f2;font-weight:600">Phone</td>
              <td style="padding:6px 12px;border-bottom:1px solid #fecdd3">{vendor_phone or "—"}</td></tr>
        </table>
        <p><strong>Message:</strong></p>
        <p style="background:#f9fafb;padding:12px;border-radius:8px;color:#374151">{message}</p>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">
          Please follow up with the vendor within 24 hours.
        </p>
        """,
    )
    await _send(to, f"Assistance Request: {service}", body)


async def send_password_reset(to: str, name: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    body = _base_template(
        "Reset Your Password",
        f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>We received a request to reset your password.
           This link expires in <strong>30 minutes</strong>.</p>
        <a href="{reset_url}"
           style="display:inline-block;padding:10px 20px;background:#1d4ed8;
                  color:white;text-decoration:none;border-radius:4px">
          Reset Password
        </a>
        <p>If you did not request this, you can safely ignore this email.</p>
        """,
    )
    await _send(to, "Password Reset Request", body)
