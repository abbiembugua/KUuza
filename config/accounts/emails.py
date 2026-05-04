# accounts/emails.py
import random
import secrets
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

def generate_verification_token():
    return secrets.token_urlsafe(32)

def send_verification_email(user):
    token = generate_verification_token()
    otp = str(random.randint(100000, 999999))
    expiry = timezone.now() + timedelta(hours=24)

    user.email_verification_token = token
    user.email_verification_otp = otp
    user.email_verification_expiry = expiry
    user.save(update_fields=['email_verification_token', 'email_verification_otp', 'email_verification_expiry'])

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    send_mail(
        subject="Verify your KUuza email",
        message=(
            f"Hi {user.full_name},\n\n"
            f"Verify your KUuza account using either option below:\n\n"
            f"Option 1 — Click the link:\n{verify_url}\n\n"
            f"Option 2 — Enter this 6-digit code on the verification page:\n\n"
            f"    {otp}\n\n"
            f"Both options expire in 24 hours.\n\n"
            f"If you did not create an account, you can ignore this email."
            f"Best regards,\n"
            f"KUuza Team\n"


        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?uid={uid}&token={token}"

    send_mail(
        subject="Reset your KUuza password",
        message=(
            f"Hi {user.full_name},\n\n"
            f"Click the link below to reset your password:\n{reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
