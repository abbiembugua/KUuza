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

        Full filter reference:
          Status & visibility
            ?status=active|sold|deactivated
            ?is_draft=true|false

          Type & category
            ?listing_type=good|service
            ?category=books|electronics|fashion|furniture|food_beverages|beauty|other

          Condition (goods only)
            ?condition=new|like_new|used|fair

          Pricing
            ?min_price=100
            ?max_price=5000
            ?negotiable=true|false

          Date range (find that listing from 8 years ago)
            ?created_after=2016-01-01
            ?created_before=2016-12-31
            ?updated_after=2024-01-01
            ?updated_before=2024-12-31

          Contact
            ?contact_preference=email|whatsapp

          Inventory
            ?min_quantity=1      (goods: units still in stock)
            ?max_quantity=10
            ?min_usage=0         (services: times used)
            ?max_usage=50

          Engagement
            ?min_views=0
            ?max_views=1000
            ?ai_assisted=true|false
            ?has_images=true|false

          Search & ordering (handled by DRF filter backends)
            ?search=calculus
            ?ordering=-created_at|created_at|price|-price|views_count|-views_count
        """
        p = request.query_params
        queryset = self.get_queryset()

        # ── Status & visibility ───────────────────────────────────────────────
        status_filter = p.get('status')
        is_draft      = p.get('is_draft')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if is_draft is not None:
            queryset = queryset.filter(is_draft=is_draft.lower() == 'true')

        # ── Type & category ───────────────────────────────────────────────────
        listing_type = p.get('listing_type')
        category     = p.get('category')
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)
        if category:
            queryset = queryset.filter(category=category)

        # ── Condition ─────────────────────────────────────────────────────────
        condition = p.get('condition')
        if condition:
            queryset = queryset.filter(condition=condition)

        # ── Pricing ───────────────────────────────────────────────────────────
        min_price  = p.get('min_price')
        max_price  = p.get('max_price')
        negotiable = p.get('negotiable')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if negotiable is not None:
            queryset = queryset.filter(negotiable=negotiable.lower() == 'true')

        # ── Date range ────────────────────────────────────────────────────────
        created_after   = p.get('created_after')
        created_before  = p.get('created_before')
        updated_after   = p.get('updated_after')
        updated_before  = p.get('updated_before')
        if created_after:
            queryset = queryset.filter(created_at__date__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__date__lte=created_before)
        if updated_after:
            queryset = queryset.filter(updated_at__date__gte=updated_after)
        if updated_before:
            queryset = queryset.filter(updated_at__date__lte=updated_before)

        # ── Contact preference ────────────────────────────────────────────────
        contact_preference = p.get('contact_preference')
        if contact_preference:
            queryset = queryset.filter(contact_preference=contact_preference)

        # ── Inventory ─────────────────────────────────────────────────────────
        min_quantity = p.get('min_quantity')
        max_quantity = p.get('max_quantity')
        min_usage    = p.get('min_usage')
        max_usage    = p.get('max_usage')
        if min_quantity:
            queryset = queryset.filter(quantity__gte=min_quantity)
        if max_quantity:
            queryset = queryset.filter(quantity__lte=max_quantity)
        if min_usage:
            queryset = queryset.filter(usage_count__gte=min_usage)
        if max_usage:
            queryset = queryset.filter(usage_count__lte=max_usage)

        # ── Engagement ────────────────────────────────────────────────────────
        min_views    = p.get('min_views')
        max_views    = p.get('max_views')
        ai_assisted  = p.get('ai_assisted')
        has_images   = p.get('has_images')
        if min_views:
            queryset = queryset.filter(views_count__gte=min_views)
        if max_views:
            queryset = queryset.filter(views_count__lte=max_views)
        if ai_assisted is not None:
            queryset = queryset.filter(ai_assisted=ai_assisted.lower() == 'true')
        if has_images is not None:
            if has_images.lower() == 'true':
                queryset = queryset.filter(images__isnull=False).distinct()
            else:
                queryset = queryset.filter(images__isnull=True)

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

    # ── Booked slots ──────────────────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def booked_slots(self, request, pk=None):
        """
        GET /api/listings/{id}/booked_slots/
        Returns dates (and times where stored) that already have pending
        transactions so the checkout calendar can grey them out.
        """
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response({'booked_slots': []})

        from transactions.models import Transaction
        txns = Transaction.objects.filter(
            listing=listing,
            status='pending',
        ).values('scheduled_date', 'scheduled_time') if hasattr(Transaction, 'scheduled_time') else \
        Transaction.objects.filter(
            listing=listing,
            status='pending',
        ).values('scheduled_date')

        slots = []
        for t in txns:
            slots.append({
                'date': str(t['scheduled_date']),
                'time': t.get('scheduled_time'),
            })

        return Response({'booked_slots': slots})

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
        # Fetch directly — get_object() uses get_queryset() which excludes sold/deactivated
        # listings from buyers' view, causing 404 immediately after purchase.
        try:
            listing = Listing.objects.select_related('seller').get(pk=pk)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Seller can always see their own contact info
        if listing.seller == request.user:
            return Response({
                'contact_preference': listing.contact_preference,
                'contact_value':      listing.contact_value,
            })

        # Buyers: require an active transaction for this listing
        from transactions.models import Transaction
        has_transaction = Transaction.objects.filter(
            listing=listing,
            buyer=request.user,
            status__in=['completed', 'auto_completed', 'pending'],
        ).exists()

        if not has_transaction:
            return Response(
                {'error': 'Contact details are only available after a transaction is created.'},
                status=status.HTTP_403_FORBIDDEN,
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

        import time

        # Try primary model twice, then fall back to a lighter model
        attempts = [
            ('gemini-2.5-flash',     0),
            ('gemini-2.5-flash',     2),
            ('gemini-2.0-flash-lite', 4),
        ]

        data = None
        for model_name, delay in attempts:
            if delay:
                time.sleep(delay)
            try:
                client = genai.Client(api_key=gemini_api_key)
                response = client.models.generate_content(model=model_name, contents=prompt)
                content = response.text.strip().replace('```json', '').replace('```', '').strip()
                data = json.loads(content)
                print(f"✅ Gemini ({model_name}) parsed: {data}")
                break
            except json.JSONDecodeError:
                # Model responded but JSON was malformed — return original input
                data = {
                    'refinedTitle':       title,
                    'suggestedPrice':     '',
                    'refinedDescription': description,
                }
                break
            except Exception as e:
                err_str = str(e)
                is_overloaded = any(k in err_str for k in ('503', 'UNAVAILABLE', 'high demand', 'overloaded'))
                print(f"⚠️  Gemini ({model_name}) error: {err_str}")
                if not is_overloaded:
                    # Non-transient error — no point retrying
                    return Response(
                        {'error': 'AI refinement failed. Please try again.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                # Transient — loop to next attempt

        if data is None:
            return Response(
                {'error': 'The AI assistant is currently busy. Please wait a moment and try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(data)
