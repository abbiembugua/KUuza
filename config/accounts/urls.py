# accounts/urls.py
from django.urls import path
from .views import (
    ForgotPasswordView,
    LoginView,
    MeView,
    LogoutView,
    RegisterView,
    ResendVerificationView,
    ResetPasswordView,
    SellerVerifyView,
    VerifyEmailView,
    VerifyEmailOTPView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view()),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify-email-otp'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('seller/verify/', SellerVerifyView.as_view(), name='seller-verify'),
]
