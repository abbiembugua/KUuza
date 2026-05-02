from django.urls import path
from .views import (
    AdminDashboardView,
    AdminListingsView,
    AdminListingDetailView,
    AdminUsersView,
    AdminUserActionView,
    AdminReportsView,
    AdminReportActionView,
    AdminSellersView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('listings/', AdminListingsView.as_view(), name='admin-listings'),
    path('listings/<uuid:pk>/', AdminListingDetailView.as_view(), name='admin-listing-detail'),
    path('users/', AdminUsersView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/<str:action>/', AdminUserActionView.as_view(), name='admin-user-action'),
    path('reports/', AdminReportsView.as_view(), name='admin-reports'),
    path('reports/<uuid:pk>/<str:action>/', AdminReportActionView.as_view(), name='admin-report-action'),
    path('sellers/', AdminSellersView.as_view(), name='admin-sellers'),
]
