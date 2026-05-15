import random
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def _otp_boxes(otp):
    """Render each OTP digit in its own styled box."""
    boxes = ''.join(
        f'<td style="width:48px;height:56px;background:#ffffff;border:2px solid #a7f3d0;'
        f'border-radius:10px;text-align:center;vertical-align:middle;'
        f'font-size:28px;font-weight:700;color:#059669;font-family:monospace;'
        f'{"margin-right:8px;" if i < 5 else ""}">{digit}</td>'
        f'{"<td style=\"width:8px;\"></td>" if i < 5 else ""}'
        for i, digit in enumerate(otp)
    )
    return f'<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>{boxes}</tr></table>'


def _base_template(title, preheader, content_html):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:20px;overflow:hidden;
                      box-shadow:0 4px 32px rgba(0,0,0,0.08);max-width:560px;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);
                        padding:36px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:32px;font-weight:800;
                         letter-spacing:-1px;line-height:1;">KUuza</p>
              <p style="margin:6px 0 0;color:#a7f3d0;font-size:11px;
                         font-weight:600;letter-spacing:0.2em;
                         text-transform:uppercase;">Campus Marketplace · Kenyatta University</p>
            </td>
          </tr>

          <!-- ── Content ── -->
          <tr>
            <td style="padding:40px 40px 32px;">
              {content_html}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f5f5f4;border-top:1px solid #e7e5e4;
                        padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#a8a29e;font-size:12px;line-height:1.6;">
                © 2026 KUuza · Kenyatta University Campus Marketplace<br>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_verification_email(user):
    otp = str(random.randint(100000, 999999))
    expiry = timezone.now() + timedelta(minutes=10)

    user.email_verification_otp = otp
    user.email_verification_expiry = expiry
    user.save(update_fields=['email_verification_otp', 'email_verification_expiry'])

    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        Verify your email address
      </h2>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{user.first_name}</strong>, welcome to KUuza!<br>
        Enter the code below to activate your account.
        This code expires in <strong style="color:#059669;">10 minutes</strong>.
      </p>

      <!-- OTP display -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#ecfdf5;border:2px solid #a7f3d0;border-radius:14px;
                      padding:28px 20px;text-align:center;">
            <p style="margin:0 0 16px;color:#047857;font-size:11px;font-weight:700;
                       letter-spacing:0.18em;text-transform:uppercase;">
              Your verification code
            </p>
            {_otp_boxes(otp)}
          </td>
        </tr>
      </table>

      <!-- Instructions -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td style="background:#fafaf9;border-left:4px solid #10b981;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0;color:#57534e;font-size:13px;line-height:1.6;">
              Go to the KUuza app and enter this 6-digit code on the verification page.
              If you did not create a KUuza account, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {user.first_name},\n\n"
        f"Your KUuza verification code is: {otp}\n\n"
        f"It expires in 10 minutes.\n\n"
        f"If you did not create a KUuza account, ignore this email."
    )

    send_mail(
        subject="Your KUuza verification code",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=_base_template(
            title="Verify your KUuza email",
            preheader=f"Your verification code is {otp} — expires in 10 minutes.",
            content_html=content,
        ),
        fail_silently=False,
    )


def send_purchase_email(seller, buyer_name, listing_title, scheduled_date, payment_method):
    payment_labels = {
        'mpesa':             'M-Pesa',
        'cash_on_pickup':    'Cash on Pickup',
        'pay_after_service': 'Pay After Service',
    }
    payment_label = payment_labels.get(payment_method, payment_method)
    date_str = scheduled_date.strftime('%A, %d %B %Y') if scheduled_date else '—'

    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        You have a new order!
      </h2>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{seller.first_name}</strong>,<br>
        <strong>{buyer_name}</strong> has placed an order for your listing
        <strong>"{listing_title}"</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#ecfdf5;border:2px solid #a7f3d0;border-radius:14px;padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #d1fae5;">
                  <span style="color:#6b7280;font-size:13px;">Buyer</span>
                </td>
                <td style="padding:6px 0;border-bottom:1px solid #d1fae5;text-align:right;">
                  <strong style="color:#1c1917;font-size:13px;">{buyer_name}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #d1fae5;">
                  <span style="color:#6b7280;font-size:13px;">Item</span>
                </td>
                <td style="padding:6px 0;border-bottom:1px solid #d1fae5;text-align:right;">
                  <strong style="color:#1c1917;font-size:13px;">{listing_title}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #d1fae5;">
                  <span style="color:#6b7280;font-size:13px;">Scheduled date</span>
                </td>
                <td style="padding:6px 0;border-bottom:1px solid #d1fae5;text-align:right;">
                  <strong style="color:#1c1917;font-size:13px;">{date_str}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#6b7280;font-size:13px;">Payment</span>
                </td>
                <td style="padding:6px 0;text-align:right;">
                  <strong style="color:#059669;font-size:13px;">{payment_label}</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td style="background:#fafaf9;border-left:4px solid #10b981;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0;color:#57534e;font-size:13px;line-height:1.6;">
              Open the KUuza app to view the full order details, coordinate pickup, and mark it as delivered once done.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {seller.first_name},\n\n"
        f"{buyer_name} placed an order for \"{listing_title}\".\n"
        f"Scheduled: {date_str}\nPayment: {payment_label}\n\n"
        f"Open KUuza to view the full order and coordinate pickup."
    )

    send_mail(
        subject=f"New order for \"{listing_title}\"",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[seller.email],
        html_message=_base_template(
            title="New Order — KUuza",
            preheader=f"{buyer_name} just ordered \"{listing_title}\". Open KUuza to coordinate.",
            content_html=content,
        ),
        fail_silently=True,
    )


def send_dispute_escalation_email(seller, buyer_name, listing_title):
    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        Dispute escalated — admin review pending
      </h2>
      <p style="margin:0 0 20px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{seller.first_name}</strong>,<br>
        The 72-hour resolution window for the dispute raised by
        <strong>{buyer_name}</strong> on <strong>"{listing_title}"</strong>
        has passed without resolution.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#fef2f2;border-left:4px solid #ef4444;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0 0 8px;color:#b91c1c;font-size:13px;font-weight:700;">
              What happens next
            </p>
            <p style="margin:0;color:#78716c;font-size:13px;line-height:1.6;">
              KUuza admin will now review this dispute. Depending on the outcome,
              action may be taken on your account. We strongly encourage you to
              reach out to {buyer_name} and resolve this as soon as possible.
              Contact us at <a href="mailto:hello.kuuza@gmail.com" style="color:#059669;">hello.kuuza@gmail.com</a>
              if you have questions.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {seller.first_name},\n\n"
        f"The 72-hour window for resolving the dispute by {buyer_name} on "
        f"\"{listing_title}\" has passed. KUuza admin will now review this case.\n\n"
        f"Contact us at hello.kuuza@gmail.com if you have questions."
    )

    send_mail(
        subject=f"Dispute escalated — \"{listing_title}\"",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[seller.email],
        html_message=_base_template(
            title="Dispute Escalated — Admin Review",
            preheader="The 72-hour dispute window has passed. Admin will now review.",
            content_html=content,
        ),
        fail_silently=True,
    )


def send_dispute_raised_email(seller, buyer_name, listing_title):
    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        A buyer has raised a dispute
      </h2>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{seller.first_name}</strong>,<br>
        <strong>{buyer_name}</strong> has raised a dispute on your transaction for
        <strong>"{listing_title}"</strong>.
        KUuza admin has been notified and will review the case.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#fef2f2;border-left:4px solid #ef4444;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0 0 8px;color:#b91c1c;font-size:13px;font-weight:700;">
              What you should do now
            </p>
            <ol style="margin:0;padding-left:18px;color:#78716c;font-size:13px;line-height:1.8;">
              <li>Open the KUuza app and find this transaction in your Sales.</li>
              <li>Contact {buyer_name} directly to understand the complaint.</li>
              <li>Offer a remedy — replacement, refund, or another arrangement.</li>
              <li>Once resolved, ask {buyer_name} to close the dispute on their end.</li>
            </ol>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td style="background:#fafaf9;border-left:4px solid #f59e0b;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0;color:#78716c;font-size:13px;line-height:1.6;">
              If the dispute is not resolved, KUuza may take further action.
              Contact us at <a href="mailto:hello.kuuza@gmail.com" style="color:#059669;">hello.kuuza@gmail.com</a>
              if you have questions.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {seller.first_name},\n\n"
        f"{buyer_name} has raised a dispute on your transaction for \"{listing_title}\".\n\n"
        f"What to do:\n"
        f"1. Open KUuza and find this transaction in your Sales.\n"
        f"2. Contact {buyer_name} directly to understand the complaint.\n"
        f"3. Offer a remedy — replacement, refund, or another arrangement.\n"
        f"4. Ask {buyer_name} to close the dispute once resolved.\n\n"
        f"Questions? Contact us at hello.kuuza@gmail.com."
    )

    send_mail(
        subject=f"Dispute raised on your transaction — {listing_title}",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[seller.email],
        html_message=_base_template(
            title="Dispute Raised — Action Required",
            preheader=f"{buyer_name} raised a dispute on \"{listing_title}\". Please respond promptly.",
            content_html=content,
        ),
        fail_silently=True,
    )


def send_account_suspended_email(user):
    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        Your account has been suspended
      </h2>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{user.first_name}</strong>,<br>
        Your KUuza account has been suspended by a platform administrator.
        While suspended, you will not be able to log in or access the marketplace.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#fef2f2;border-left:4px solid #ef4444;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0;color:#78716c;font-size:13px;line-height:1.6;">
              If you believe this was a mistake, please contact our support team at
              <a href="mailto:hello.kuuza@gmail.com" style="color:#059669;">hello.kuuza@gmail.com</a>
              with your account email address and a brief explanation.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {user.first_name},\n\n"
        f"Your KUuza account has been suspended by a platform administrator.\n"
        f"While suspended, you will not be able to log in or access the marketplace.\n\n"
        f"If you believe this was a mistake, contact us at hello.kuuza@gmail.com."
    )

    send_mail(
        subject="Your KUuza account has been suspended",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=_base_template(
            title="KUuza Account Suspended",
            preheader="Your KUuza account has been suspended. Contact support if this is a mistake.",
            content_html=content,
        ),
        fail_silently=True,
    )


def send_account_reactivated_email(user):
    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        Your account has been reactivated
      </h2>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{user.first_name}</strong>,<br>
        Good news — your KUuza account has been reactivated.
        You can now log in and continue using the marketplace.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#ecfdf5;border-left:4px solid #10b981;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0;color:#57534e;font-size:13px;line-height:1.6;">
              If you have any questions, feel free to contact us at
              <a href="mailto:hello.kuuza@gmail.com" style="color:#059669;">hello.kuuza@gmail.com</a>.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {user.first_name},\n\n"
        f"Your KUuza account has been reactivated. You can now log in and use the platform.\n\n"
        f"If you have questions, contact us at hello.kuuza@gmail.com."
    )

    send_mail(
        subject="Your KUuza account has been reactivated",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=_base_template(
            title="KUuza Account Reactivated",
            preheader="Your KUuza account is active again — log in to continue.",
            content_html=content,
        ),
        fail_silently=True,
    )


def send_password_reset_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?uid={uid}&token={token}"

    content = f"""
      <h2 style="margin:0 0 8px;color:#1c1917;font-size:22px;font-weight:700;">
        Reset your password
      </h2>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.7;">
        Hi <strong>{user.first_name}</strong>,<br>
        We received a request to reset your KUuza password.
        Click the button below to choose a new one.
      </p>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <a href="{reset_url}"
               style="display:inline-block;background:#059669;color:#ffffff;
                       text-decoration:none;font-size:15px;font-weight:700;
                       padding:14px 36px;border-radius:50px;
                       letter-spacing:0.02em;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <!-- Fallback URL -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#fafaf9;border:1px solid #e7e5e4;
                      border-radius:10px;padding:14px 16px;">
            <p style="margin:0 0 4px;color:#a8a29e;font-size:11px;
                       font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
              Or copy this link into your browser
            </p>
            <p style="margin:0;color:#059669;font-size:12px;word-break:break-all;
                       line-height:1.5;">{reset_url}</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td style="background:#fef3c7;border-left:4px solid #f59e0b;
                      border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0;color:#78716c;font-size:13px;line-height:1.6;">
              This link expires after use. If you did not request a password reset,
              please ignore this email — your account is safe.
            </p>
          </td>
        </tr>
      </table>
    """

    plain = (
        f"Hi {user.first_name},\n\n"
        f"Click the link below to reset your KUuza password:\n{reset_url}\n\n"
        f"If you did not request this, ignore this email."
    )

    send_mail(
        subject="Reset your KUuza password",
        message=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=_base_template(
            title="Reset your KUuza password",
            preheader="Reset your KUuza password — link expires after use.",
            content_html=content,
        ),
        fail_silently=False,
    )
