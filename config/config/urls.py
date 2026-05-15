"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static  # <-- Add 'include' here

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/listings/', include('listings.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('transactions.urls')),  # ← add this
    path('api/', include('Cart.urls')),
    path('api/', include('reports.urls')),
    path('api/admin-panel/', include('admin_api.urls')),
    path('api/', include('questions.urls')),
    path('api/', include('notifications.urls')),



] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

