# listings/serializers.py

from rest_framework import serializers
from django.db.models import Avg
from .models import Listing, ListingImage
from reviews.models import Review   # ← add this import


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'display_order']


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(
        source='seller.full_name', read_only=True
    )
    contact_value = serializers.CharField(write_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'seller', 'seller_name',
            'listing_type', 'status',
            'title', 'category', 'description',
            'price', 'negotiable',
            'condition', 'quantity',
            'usage_count',
            'area_of_operation',
            'contact_preference',
            'contact_value',
            'is_draft', 'ai_assisted', 'views_count',
            'images', 'created_at', 'updated_at',
            'average_rating', 'total_reviews',
        ]
        read_only_fields = [
            'seller', 'seller_name', 'usage_count',
            'views_count', 'created_at', 'updated_at',
            'average_rating', 'total_reviews',
        ]

    def get_average_rating(self, obj):                                        # ← fixed
        result = Review.objects.filter(reviewee=obj.seller).aggregate(avg=Avg('score'))
        avg = result['avg']
        return round(float(avg), 1) if avg is not None else 0

    def get_total_reviews(self, obj):                                         # ← fixed
        return Review.objects.filter(reviewee=obj.seller).count()

    def validate(self, data):
        listing_type  = data.get('listing_type', 'good')
        condition     = data.get('condition', '')
        negotiable    = data.get('negotiable', False)
        price         = data.get('price')
        contact_pref  = data.get('contact_preference', 'email')
        contact_value = data.get('contact_value', '').strip()

        if listing_type == 'good' and not condition:
            raise serializers.ValidationError(
                {'condition': 'Condition is required for goods.'}
            )
        if listing_type == 'service':
            data['condition'] = ''
        if not negotiable and not price:
            raise serializers.ValidationError(
                {'price': 'Enter a price or mark as negotiable.'}
            )
        if not contact_value:
            raise serializers.ValidationError(
                {'contact_value': 'Please provide your email address or WhatsApp number.'}
            )
        if contact_pref == 'whatsapp' and not contact_value.startswith(('07', '01', '+254')):
            raise serializers.ValidationError(
                {'contact_value': 'Enter a valid Kenyan number e.g. 0712345678 or +254712345678.'}
            )
        return data


class ListingDetailSerializer(ListingSerializer):
    class Meta(ListingSerializer.Meta):
        pass


class ContactRevealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ['contact_preference', 'contact_value']