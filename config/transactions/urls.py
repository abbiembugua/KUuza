from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls
