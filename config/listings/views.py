from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingImageSerializer
import json
from django.conf import settings

# ── django-filter backend ────────────────────────────────────────────────────
try:
    from django_filters.rest_framework import DjangoFilterBackend
    FILTER_BACKEND_AVAILABLE = True
except ImportError:
    FILTER_BACKEND_AVAILABLE = False
    print("Warning: django-filter not installed. Run: pip install django-filter")

# ── Gemini ───────────────────────────────────────────────────────────────────
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-genai not installed. Run: pip install google-genai")


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    # ── Filtering, searching, ordering ──────────────────────────────────────
    filter_backends = [
        *(([DjangoFilterBackend] if FILTER_BACKEND_AVAILABLE else [])),
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    # Maps directly to URL query params
    # e.g. /api/listings/?listing_type=good&category=books&status=active
    filterset_fields = {
        'listing_type': ['exact'],
        'category':     ['exact'],
        'status':       ['exact'],
        'condition':    ['exact'],
        'is_draft':     ['exact'],
    }

    # /api/listings/?search=macbook
    search_fields = ['title', 'description']

    # /api/listings/?ordering=-created_at or ?ordering=price
    ordering_fields = ['created_at', 'price', 'views_count', 'usage_count']
    ordering = ['-created_at']

    # ── Queryset ─────────────────────────────────────────────────────────────
    def get_queryset(self):
        """
        - my_listings action: returns only the current user's listings
          (all statuses, including drafts) so the seller can manage them.
        - All other actions: returns active, non-draft listings to everyone,
          PLUS all of the current user's own listings so they can view/edit
          their own content regardless of status.
        """
        user = self.request.user
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if self.action == 'my_listings':
            queryset = (
                Listing.objects
                .filter(seller=user)
                .select_related('seller')
                .prefetch_related('images')
                .order_by('-created_at')
            )
            if min_price:
                queryset = queryset.filter(price__gte=min_price)
            if max_price:
                queryset = queryset.filter(price__lte=max_price)
            return queryset

        base_qs = Listing.objects.select_related('seller').prefetch_related('images')

        if user.is_authenticated:
            queryset = base_qs.filter(
                Q(status='active', is_draft=False) |  # visible to all buyers
                Q(seller=user)                         # seller sees all their own
            ).order_by('-created_at')
            if min_price:
                queryset = queryset.filter(price__gte=min_price)
            if max_price:
                queryset = queryset.filter(price__lte=max_price)
            return queryset

        # Unauthenticated: only active, published listings
        queryset = base_qs.filter(
            status='active',
            is_draft=False
        ).order_by('-created_at')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        return queryset

    # ── Create ───────────────────────────────────────────────────────────────
    def perform_create(self, serializer):
        """Attach the authenticated user as the seller on creation."""
        serializer.save(seller=self.request.user)

    # ── My listings ──────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_listings(self, request):
        """
        GET /api/listings/my_listings/
        Returns all listings belonging to the current user, including drafts
        and deactivated listings. Supports optional ?status= and ?is_draft=
        query params so the My Listings page can filter by tab.
        """
        queryset = self.get_queryset()

        # Allow tab filtering from the frontend
        # e.g. ?status=active, ?status=sold, ?is_draft=true
        status_filter = request.query_params.get('status')
        is_draft      = request.query_params.get('is_draft')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if is_draft is not None:
            queryset = queryset.filter(is_draft=is_draft.lower() == 'true')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # ── Image upload ─────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_images(self, request, pk=None):
        """
        POST /api/listings/{id}/upload_images/
        Accepts multipart/form-data with key 'images' (multiple files allowed).
        Only the listing's seller can upload images.
        """
        listing = self.get_object()

        # Ownership check
        if listing.seller != request.user:
            return Response(
                {'error': 'You can only upload images to your own listings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        files = request.FILES.getlist('images')
        if not files:
            return Response(
                {'error': 'No images provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce max 5 images per listing
        existing_count = listing.images.count()
        if existing_count + len(files) > 5:
            return Response(
                {'error': f'Maximum 5 images allowed. This listing already has {existing_count}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created = []
        for i, f in enumerate(files):
            img = ListingImage.objects.create(
                listing=listing,
                image=f,
                display_order=existing_count + i + 1
            )
            created.append({'id': img.id, 'display_order': img.display_order})

        return Response(
            {'status': 'images uploaded', 'uploaded': created},
            status=status.HTTP_200_OK
        )

    # ── Status management actions ─────────────────────────────────────────────
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def mark_sold(self, request, pk=None):
        """
        PATCH /api/listings/{id}/mark_sold/
        Manually marks a good as sold. Only the seller can do this.
        Not applicable to services (services stay active permanently).
        """
        listing = self.get_object()

        if listing.seller != request.user:
            return Response(
                {'error': 'You can only update your own listings.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if listing.listing_type == 'service':
            return Response(
                {'error': 'Services cannot be marked as sold. Use deactivate instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing.mark_sold()  # calls the model helper method
        return Response({'status': 'listing marked as sold'})

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def deactivate(self, request, pk=None):
        """
        PATCH /api/listings/{id}/deactivate/
        Hides the listing from buyers without deleting it.
        Works for both goods and services.
        """
        listing = self.get_object()

        if listing.seller != request.user:
            return Response(
                {'error': 'You can only update your own listings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        listing.status = 'deactivated'
        listing.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'listing deactivated'})

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def reactivate(self, request, pk=None):
        """
        PATCH /api/listings/{id}/reactivate/
        Sets a deactivated listing back to active.
        """
        listing = self.get_object()

        if listing.seller != request.user:
            return Response(
                {'error': 'You can only update your own listings.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if listing.status == 'sold':
            return Response(
                {'error': 'Sold listings cannot be reactivated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing.status = 'active'
        listing.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'listing reactivated'})

    # ── View tracking ─────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """
        POST /api/listings/{id}/increment_views/
        Called by the frontend when a user opens a listing detail page.
        Does not require authentication — anyone viewing increments the count.
        """
        listing = self.get_object()
        listing.views_count += 1
        listing.save(update_fields=['views_count'])
        return Response({'views_count': listing.views_count})

    # ── Contact reveal ────────────────────────────────────────────────────────
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def contact_details(self, request, pk=None):
        """
        GET /api/listings/{id}/contact_details/
        Returns the seller's contact_preference and contact_value.
        Only accessible to a buyer who has a confirmed transaction for
        this listing. The seller can always see their own contact details.
        """
        listing = self.get_object()

        # Seller can always see their own contact info
        if listing.seller == request.user:
            return Response({
                'contact_preference': listing.contact_preference,
                'contact_value':      listing.contact_value,
            })

        # For buyers: check a confirmed transaction exists
        # Adjust the import path to wherever your Transaction model lives
        try:
            from transactions.models import Transaction
            has_transaction = Transaction.objects.filter(
                listing=listing,
                buyer=request.user,
                status__in=['completed', 'pending']  # pending means checkout was created
            ).exists()
        except ImportError:
            # If transactions app not yet built, temporarily allow access
            # Remove this fallback once transactions are implemented
            has_transaction = True

        if not has_transaction:
            return Response(
                {'error': 'Contact details are only available after a transaction is created.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'contact_preference': listing.contact_preference,
            'contact_value':      listing.contact_value,
        })

    # ── AI refinement ─────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def refine_item(self, request):
        """
        POST /api/listings/refine_item/
        Calls Gemini to suggest a refined title, fair price, and
        improved description. Returns JSON — does NOT save anything.
        The frontend displays suggestions in a toast and only applies
        them if the user confirms.
        """
        print("=== Refine Item Request ===")
        print(f"Request data: {request.data}")

        if not GEMINI_AVAILABLE:
            return Response(
                {'error': 'Gemini AI not available. Run: pip install google-generativeai'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        gemini_api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not gemini_api_key:
            print("ERROR: GEMINI_API_KEY not found in settings")
            return Response(
                {'error': 'Gemini API key not configured on the server.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        category     = request.data.get('category', '')
        title        = request.data.get('title', '')
        description  = request.data.get('description', '')
        listing_type = request.data.get('listing_type', 'good')

        if not title or not category:
            return Response(
                {'error': 'Title and category are required for AI refinement.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Tailor the prompt based on whether this is a good or service
        type_context = (
            "a service offered by a university student (e.g. tutoring, design, hair, photography)"
            if listing_type == 'service'
            else "a physical item being sold by a university student"
        )

        prompt = f"""
You are an AI assistant helping university students write better marketplace listings in Kenya.

You will receive details about {type_context}:
- Title: {title}
- Category: {category}
- Description: {description}

Your task:
1. Suggest a concise, attractive, buyer-friendly title (max 60 characters).
2. Suggest a fair price in KES (Kenyan Shillings) as a single number, not a range.
   Consider that this is a student marketplace — prices should be reasonable.
3. Suggest a refined, buyer-friendly description (max 150 words) that is honest,
   clear, and highlights the key value to the buyer.

Format your response as JSON only, no additional text, no markdown:
{{
  "refinedTitle": "<refined title here>",
  "suggestedPrice": "<single number in KES, e.g. 500>",
  "refinedDescription": "<buyer-friendly description here>"
}}
"""

        content = ''
        try:
            client = genai.Client(api_key=gemini_api_key)
            response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            )
            # Strip markdown code blocks if Gemini wraps the JSON
            content = response.text.strip()
            content = content.replace('```json', '').replace('```', '').strip()

            data = json.loads(content)
            print(f"✅ Gemini response parsed: {data}")

        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}. Raw response: {content}")
            # Graceful fallback — return original input so frontend does not break
            data = {
                'refinedTitle':       title,
                'suggestedPrice':     '',
                'refinedDescription': description,
                'note':               'AI could not parse a structured response. Original input returned.'
            }

        except Exception as e:
            print(f"❌ Gemini error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(data)
