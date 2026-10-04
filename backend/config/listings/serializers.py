import re
from rest_framework import serializers
from django.db.models import Avg
from .models import Listing, ListingImage
from reviews.models import Review

_KE_PHONE_RE = re.compile(r'^(\+254|254|0)[17]\d{8}$')
_EMAIL_RE    = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ListingImage
        fields = ['id', 'image', 'display_order']


class ListingSerializer(serializers.ModelSerializer):
    images                 = ListingImageSerializer(many=True, read_only=True)
    seller_name            = serializers.CharField(source='seller.full_name', read_only=True)
    seller_profile_picture = serializers.SerializerMethodField()
    contact_value = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
    )
    average_rating = serializers.SerializerMethodField()
    total_reviews  = serializers.SerializerMethodField()

    # Stock fields (goods only — services will return None / False)
    quantity_remaining = serializers.SerializerMethodField()
    is_out_of_stock    = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'seller', 'seller_name', 'seller_profile_picture',
            'listing_type', 'status',
            'title', 'category', 'description',
            'price',
            'condition', 'quantity',
            'usage_count',
            'area_of_operation',
            'contact_preference',
            'contact_value',
            'is_draft', 'ai_assisted', 'views_count',
            'images', 'created_at', 'updated_at',
            'average_rating', 'total_reviews',
            # Stock awareness
            'quantity_remaining',
            'is_out_of_stock',
        ]
        read_only_fields = [
            'seller', 'seller_name', 'seller_profile_picture', 'usage_count',
            'views_count', 'created_at', 'updated_at',
            'average_rating', 'total_reviews',
            'quantity_remaining', 'is_out_of_stock',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user == instance.seller:
            data['contact_value'] = instance.contact_value
        return data

    def get_seller_profile_picture(self, obj):
        if not (obj.seller and obj.seller.profile_picture):
            return None
        request = self.context.get('request')
        url = obj.seller.profile_picture.url
        return request.build_absolute_uri(url) if request else url

    def get_average_rating(self, obj):
        result = Review.objects.filter(reviewee=obj.seller).aggregate(avg=Avg('score'))
        avg    = result['avg']
        return round(float(avg), 1) if avg is not None else 0

    def get_total_reviews(self, obj):
        return Review.objects.filter(reviewee=obj.seller).count()

    def get_quantity_remaining(self, obj):
        """
        Returns remaining stock for goods.
        Returns None for services (they don't have finite stock).
        """
        if obj.listing_type == 'good':
            return max(obj.quantity, 0)  # clamp — never expose negatives
        return None

    def get_is_out_of_stock(self, obj):
        """
        True only for goods with zero remaining stock.
        Always False for services.
        """
        if obj.listing_type == 'good':
            return obj.quantity <= 0
        return False

    def validate(self, data):
        """
        Validates listing data for both create (POST) and partial update (PATCH).
        For PATCH requests, self.instance holds the existing DB record, so any
        field not included in the payload falls back to the instance's current
        value instead of failing validation.
        """
        instance = self.instance  # None on create, Listing object on update

        # ── Resolve effective values (payload → instance fallback → default) ──
        listing_type = data.get(
            'listing_type',
            getattr(instance, 'listing_type', 'good')
        )
        condition = data.get(
            'condition',
            getattr(instance, 'condition', '')
        )
        price = data.get(
            'price',
            getattr(instance, 'price', None)
        )
        contact_pref = data.get(
            'contact_preference',
            getattr(instance, 'contact_preference', 'email')
        )
        contact_value = data.get(
            'contact_value',
            getattr(instance, 'contact_value', '')
        )
        if isinstance(contact_value, str):
            contact_value = contact_value.strip()

        # ── Condition: required for goods, cleared for services ──────────────
        if listing_type == 'good' and not condition:
            raise serializers.ValidationError(
                {'condition': 'Condition is required for goods.'}
            )
        if listing_type == 'service':
            data['condition'] = ''

        # ── Price: always required ───────────────────────────────────────────
        if not price:
            raise serializers.ValidationError(
                {'price': 'A price is required.'}
            )

        # ── Contact value: always required ───────────────────────────────────
        if not contact_value:
            raise serializers.ValidationError(
                {'contact_value': 'Please provide your email address or WhatsApp number.'}
            )

        # ── Format validation based on contact preference ─────────────────────
        if contact_pref == 'email':
            if not _EMAIL_RE.match(contact_value):
                raise serializers.ValidationError(
                    {'contact_value': 'Enter a valid email address.'}
                )
        elif contact_pref == 'whatsapp':
            if not _KE_PHONE_RE.match(contact_value):
                raise serializers.ValidationError(
                    {'contact_value': 'Enter a valid Kenyan number e.g. 0712345678 or +254712345678.'}
                )

        return data


class ListingDetailSerializer(ListingSerializer):
    class Meta(ListingSerializer.Meta):
        pass


class ContactRevealSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Listing
        fields = ['contact_preference', 'contact_value']