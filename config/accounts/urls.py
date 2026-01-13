# accounts/urls.py
from django.urls import path
from .views import RegisterView, MeView,LogoutView
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),  # This is the JWT login endpoint
    path('me/', MeView.as_view()),
    path("logout/", LogoutView.as_view(), name="logout"),


]