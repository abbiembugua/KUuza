from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingImageSerializer
import os
import json
from django.conf import settings


# Import Gemini instead of OpenAI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not installed. Run: pip install google-generativeai")


class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().order_by('-created_at')
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Override to filter by current user for my-listings endpoint
        user = self.request.user

        # Check if this is a request for user's own listings
        if self.action == 'my_listings':
            return Listing.objects.filter(seller=user).order_by('-created_at')

        # For regular listing operations, return all listings
        # (or filter based on other criteria)
        return Listing.objects.all().order_by('-created_at')

    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """
        Get current user's listings
        """
        # This will use the get_queryset method which filters by current user
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        listing = self.get_object()
        files = request.FILES.getlist('images')
        for f in files:
            ListingImage.objects.create(listing=listing, image=f)
        return Response({'status': 'images uploaded'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def refine_item(self, request):
        """
        Calls Gemini AI to refine listing
        """
        print("=== Refine Item Request ===")
        print(f"Request data: {request.data}")

        if not GEMINI_AVAILABLE:
            return Response({
                "error": "Gemini AI not available"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        gemini_api_key = settings.GEMINI_API_KEY
        if not gemini_api_key:
            print("ERROR: GEMINI_API_KEY not found in environment")
            return Response({
                "error": "Gemini API key not configured"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Configure Gemini
        genai.configure(api_key=gemini_api_key)

        category = request.data.get('category', '')
        title = request.data.get('title', '')
        description = request.data.get('description', '')

        prompt = f"""
        You are an AI assistant for online marketplace listings in Kenya.
        You will receive:
        - Title: {title}
        - Category: {category}
        - Description: {description}

        Your task:
        1. Suggest a concise, attractive, buyer-friendly title (max 60 characters).
        2. Suggest a fair price range in KES (Kenyan Shillings), considering the item category and description.
        3. Suggest a refined, buyer-friendly description (max 150 words).

        Format your response as JSON only:
        {{
          "refinedTitle": "<refined title here>",
          "suggestedPrice": "<price in KES>",
          "refinedDescription": "<buyer-friendly description here>"
        }}

        Return only the JSON, no additional text.
        """

        try:
            # Initialize Gemini model (using gemini-1.5-pro)
            model = genai.GenerativeModel('gemini-2.5-flash')

            # Generate response
            response = model.generate_content(prompt)

            # Extract text from response
            content = response.text.strip()

            # Clean the response - remove markdown code blocks if present
            content = content.replace('```json', '').replace('```', '').strip()

            # Convert JSON string to dict
            data = json.loads(content)
            print(f"Gemini response: {content}")

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}. Response content: {content}")
            # Fallback response if JSON parsing fails
            data = {
                "refinedTitle": title,
                "suggestedPrice": "Contact for price",
                "refinedDescription": description,
                "note": "AI suggestion failed to parse, using original input"
            }
        except Exception as e:
            print(f"ERROR in refine_item: {str(e)}")
            import traceback
            traceback.print_exc()

            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(data)
