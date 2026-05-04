# accounts/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .models import User
from .serializers import ProfileUpdateSerializer, SellerVerificationSerializer, SignUpSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated
from .emails import send_password_reset_email, send_verification_email

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def _user_data(self, user):
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_email_verified": user.is_email_verified,
            "is_verified_seller": user.is_verified_seller,
            "student_id": user.student_id,
            "national_id": user.national_id,
            "mpesa_phone": user.mpesa_phone,
            "seller_terms_accepted": user.seller_terms_accepted,
            "course": user.course,
            "school": user.school,
            "department": user.department,
            "year_of_study": user.year_of_study,
        }

    def get(self, request):
        return Response(self._user_data(request.user))

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self._user_data(request.user))

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(generics.CreateAPIView):
    serializer_class = SignUpSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email
        try:
            send_verification_email(user)
        except Exception as e:
            # Don't fail registration if email fails — just log it
            print(f"Email send failed: {e}")

        return Response(
            {
                "message": "Account created. Please check your email to verify your account.",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "is_email_verified": user.is_email_verified,
                }
            },
            status=status.HTTP_201_CREATED
        )

class LoginView(APIView):
    """Custom login view that returns user data with tokens"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            if not user.is_email_verified and not user.is_staff:
                try:
                    send_verification_email(user)
                except Exception:
                    pass
                return Response(
                    {
                        'error': 'Your email is not verified. We just sent a 6-digit code to your email — enter it below or click the link in the email.',
                        'requires_verification': True,
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Get user data
            user_serializer = UserSerializer(user)
            
            return Response({
                'user': user_serializer.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

class UserDetailView(APIView):
    """Get current authenticated user details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class LogoutView(APIView):
    """Logout user (blacklist refresh token)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(
                {"message": "Successfully logged out"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token')

        if not token:
            return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_email_verified:
            return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)

        if user.email_verification_expiry and user.email_verification_expiry < timezone.now():
            return Response({"error": "Verification link has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.email_verification_token = None
        user.email_verification_otp = None
        user.email_verification_expiry = None
        user.save(update_fields=['is_email_verified', 'email_verification_token', 'email_verification_otp', 'email_verification_expiry'])

        return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)


class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        otp = (request.data.get('otp') or '').strip()

        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email or OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_email_verified:
            return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)

        if not user.email_verification_otp or user.email_verification_otp != otp:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if user.email_verification_expiry and user.email_verification_expiry < timezone.now():
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.email_verification_token = None
        user.email_verification_otp = None
        user.email_verification_expiry = None
        user.save(update_fields=['is_email_verified', 'email_verification_token', 'email_verification_otp', 'email_verification_expiry'])

        return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response({"message": "Email already verified."})
            send_verification_email(user)
            return Response({"message": "Verification email resent."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            try:
                send_password_reset_email(user)
            except Exception as exc:
                return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"message": "If an account exists for that email, a password reset link has been sent."},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not uid or not token:
            return Response({"error": "Reset link is invalid."}, status=status.HTTP_400_BAD_REQUEST)

        if not password or not confirm_password:
            return Response({"error": "Both password fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if password != confirm_password:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Reset link is invalid."}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({"error": "Reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(password, user=user)
        except Exception as exc:
            error_messages = getattr(exc, 'messages', None)
            return Response(
                {"error": error_messages[0] if error_messages else "Password is not valid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save(update_fields=['password'])

        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)


class SellerVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.is_verified_seller:
            return Response({"message": "Already verified.", "is_verified_seller": True})

        serializer = SellerVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        user.student_id = data['student_id']
        user.national_id = data['national_id']
        user.mpesa_phone = data['mpesa_phone']
        user.seller_terms_accepted = data['seller_terms_accepted']
        user.course = data['course']
        user.school = data['school']
        user.department = data['department']
        user.year_of_study = data['year_of_study']
        user.is_verified_seller = True
        user.save(update_fields=[
            'student_id', 'national_id', 'mpesa_phone', 'seller_terms_accepted',
            'course', 'school', 'department', 'year_of_study', 'is_verified_seller',
        ])

        return Response(
            {"message": "Seller verification complete.", "is_verified_seller": True},
            status=status.HTTP_200_OK,
        )
