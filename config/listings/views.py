import os
import base64
import google.generativeai as genai
from django.conf import settings
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Listing, PickupLocation
from django.core.files.storage import default_storage

from .serializers import (
    ListingSerializer, 
    ListingCreateSerializer,
    PickupLocationSerializer,
    AISuggestionSerializer
)
import requests
from PIL import Image
import io
import json

# Configure Gemini AI
genai.configure(api_key=settings.GEMINI_API_KEY)

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser, FormParser]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ListingCreateSerializer
        return ListingSerializer
    
    def get_queryset(self):
        queryset = Listing.objects.select_related('seller').prefetch_related('pickup_locations')
        
        # Apply filters
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )
        
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # For regular users: show their listings + active public listings
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(seller=self.request.user) | 
                Q(status='active', is_available=True)
            ).exclude(seller=self.request.user, status='draft')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """Get current user's listings"""
        listings = Listing.objects.filter(seller=request.user)
        serializer = self.get_serializer(listings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def drafts(self, request):
        """Get user's draft listings"""
        listings = Listing.objects.filter(seller=request.user, status='draft')
        serializer = self.get_serializer(listings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a draft listing"""
        listing = self.get_object()
        if listing.seller != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if listing.status != 'draft':
            return Response(
                {'error': 'Only draft listings can be published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        listing.status = 'active'
        listing.save()
        
        serializer = self.get_serializer(listing)
        return Response({
            'message': 'Listing published successfully',
            'listing': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_sold(self, request, pk=None):
        """Mark listing as sold"""
        listing = self.get_object()
        if listing.seller != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        listing.status = 'sold'
        listing.is_available = False
        listing.save()
        
        serializer = self.get_serializer(listing)
        return Response({
            'message': 'Listing marked as sold',
            'listing': serializer.data
        })

class AISuggestionView(APIView):
    """View for AI-powered suggestions"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = AISuggestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            title = data.get('title', 'An item')
            category = data['category']
            current_description = data.get('current_description', '')
            image_urls = data.get('image_urls', [])
            
            # Build prompt for Gemini
            prompt = f"""
            You're helping a student create a marketplace listing for their campus.
            
            ITEM: {title}
            CATEGORY: {category}
            CURRENT DESCRIPTION: {current_description if current_description else "No description yet"}
            
            Please provide:
            
            1. MARKETING DESCRIPTION (2-3 paragraphs):
               - Describe the item's condition and features
               - Make it appealing to college students
               - Include campus-relevant context
               - Be friendly and approachable
            
            2. PRICE SUGGESTION (in Kenyan Shillings - KES):
               - Consider campus market prices
               - Factor in item condition and demand
               - Provide price range if uncertain
            
            3. KEY SELLING POINTS (bullet points):
               - 3-5 points highlighting why students would want this
            
            Format your response as JSON:
            {{
                "description": "Your generated description here",
                "suggested_price": 1500.00,
                "price_reasoning": "Your price justification here",
                "key_points": ["Point 1", "Point 2", "Point 3"],
                "tags": ["tag1", "tag2", "tag3"]
            }}
            """
            
            # Initialize Gemini model
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # If images are provided, use the first one
            response_content = None
            if image_urls:
                try:
                    # Download first image
                    img_response = requests.get(image_urls[0], timeout=10)
                    img_response.raise_for_status()
                    image = Image.open(io.BytesIO(img_response.content))
                    
                    # Generate with image
                    response = model.generate_content([prompt, image])
                    response_content = response.text
                except Exception as img_error:
                    # Fallback to text-only if image fails
                    print(f"Image processing failed: {img_error}")
                    response = model.generate_content(prompt)
                    response_content = response.text
            else:
                # Text-only generation
                response = model.generate_content(prompt)
                response_content = response.text
            
            # Extract JSON from response
            try:
                # Find JSON in response (might have markdown or other text)
                json_start = response_content.find('{')
                json_end = response_content.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = response_content[json_start:json_end]
                    ai_response = json.loads(json_str)
                else:
                    # If no JSON found, return raw response
                    ai_response = {
                        'description': response_content,
                        'suggested_price': None,
                        'price_reasoning': 'Unable to parse price from AI response',
                        'key_points': [],
                        'tags': []
                    }
            except json.JSONDecodeError:
                # If JSON parsing fails, return raw response
                ai_response = {
                    'description': response_content,
                    'suggested_price': None,
                    'price_reasoning': 'Unable to parse price from AI response',
                    'key_points': [],
                    'tags': []
                }
            
            return Response({
                'success': True,
                'data': ai_response,
                'ai_generated': True
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to generate AI suggestions'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# Add this import at the top if not already there

# Add this class after your AISuggestionView
class ImageUploadView(APIView):
    """View for uploading listing images"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if image_file.size > max_size:
            return Response(
                {'error': 'File too large. Maximum size is 5MB.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate unique filename
            ext = os.path.splitext(image_file.name)[1]
            filename = f"{uuid.uuid4()}{ext}"
            
            # Save file
            file_path = default_storage.save(
                f'listings/{filename}', 
                image_file
            )
            
            # Get full URL
            file_url = request.build_absolute_uri(settings.MEDIA_URL + file_path)
            
            return Response({
                'url': file_url,
                'filename': filename,
                'size': image_file.size
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Failed to upload image',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PickupLocationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for pickup locations"""
    queryset = PickupLocation.objects.filter(is_active=True)
    serializer_class = PickupLocationSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [AllowAny()]