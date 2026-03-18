from rest_framework import serializers
from .models import Transaction
from listings.serializers import ListingSerializer


class TransactionSerializer(serializers.ModelSerializer):
    buyer_name  = serializers.CharField(source='buyer.full_name',  read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)

    # Listing snapshot fields for display
    listing_title  = serializers.CharField(source='listing.title',              read_only=True)
    listing_image  = serializers.SerializerMethodField()
    listing_type   = serializers.CharField(source='listing.listing_type',       read_only=True)

    class Meta:
        model  = Transaction
        fields = [
            'id',
            'listing', 'listing_title', 'listing_image', 'listing_type',
            'buyer',  'buyer_name',
            'seller', 'seller_name',
            'interaction_type',
            'agreed_price',
            'payment_method',
            'status',
            'scheduled_date',
            'auto_complete_date',
            'inquiry_note',
            'mpesa_phone',
            'mpesa_receipt',
            'completed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'buyer', 'buyer_name',
            'seller', 'seller_name',
            'listing_title', 'listing_image', 'listing_type',
            'auto_complete_date',
            'mpesa_receipt',
            'completed_at',
            'created_at', 'updated_at',
        ]

    def get_listing_image(self, obj):
        if obj.listing and obj.listing.images.exists():
            request = self.context.get('request')
            image   = obj.listing.images.first()
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None

    def validate(self, data):
        listing = data.get('listing')
        request = self.context['request']

        if not listing:
            raise serializers.ValidationError({'listing': 'Listing is required.'})

        # Cannot buy your own listing
        if listing.seller == request.user:
            raise serializers.ValidationError(
                'You cannot purchase your own listing.'
            )

        # Cannot buy a sold or deactivated listing
        if listing.status != 'active':
            raise serializers.ValidationError(
                f'This listing is no longer available (status: {listing.status}).'
            )

        # Cannot buy a draft
        if listing.is_draft:
            raise serializers.ValidationError('This listing is not published yet.')

        # Validate payment method matches listing type
        listing_type   = listing.listing_type
        payment_method = data.get('payment_method', '')
        if listing_type == 'service' and payment_method == 'cash_on_pickup':
            raise serializers.ValidationError(
                {'payment_method': 'Use pay_after_service for services, not cash_on_pickup.'}
            )
        if listing_type == 'good' and payment_method == 'pay_after_service':
            raise serializers.ValidationError(
                {'payment_method': 'Use cash_on_pickup for goods, not pay_after_service.'}
            )

        return data

    def create(self, validated_data):
        listing = validated_data['listing']
        request = self.context['request']

        # Auto-fill seller from the listing
        validated_data['buyer']            = request.user
        validated_data['seller']           = listing.seller
        validated_data['agreed_price']     = validated_data.get('agreed_price') or listing.price
        validated_data['interaction_type'] = (
            'service_use' if listing.listing_type == 'service' else 'purchase'
        )

        return super().create(validated_data)