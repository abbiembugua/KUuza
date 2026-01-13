from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ListingViewSet, 
    PickupLocationViewSet, 
    AISuggestionView,
    ImageUploadView  # Add this import
)

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'pickup-locations', PickupLocationViewSet, basename='pickup-location')

urlpatterns = [
    path('', include(router.urls)),
    
    # Image upload endpoint
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
    
    # AI suggestions endpoint
    path('ai/suggestions/', AISuggestionView.as_view(), name='ai-suggestions'),
    
    # Custom listing endpoints
    path('listings/my-listings/', 
         ListingViewSet.as_view({'get': 'my_listings'}), 
         name='my-listings'),
    path('listings/drafts/', 
         ListingViewSet.as_view({'get': 'drafts'}), 
         name='draft-listings'),
    path('listings/<uuid:pk>/publish/', 
         ListingViewSet.as_view({'post': 'publish'}), 
         name='publish-listing'),
    path('listings/<uuid:pk>/mark-sold/', 
         ListingViewSet.as_view({'post': 'mark_sold'}), 
         name='mark-sold'),
]