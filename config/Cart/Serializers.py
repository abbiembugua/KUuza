from rest_framework import serializers
from .models import Cart, CartItem
from listings.serializers import ListingSerializer


class CartItemSerializer(serializers.ModelSerializer):
    listing_detail = serializers.SerializerMethodField()
    is_available   = serializers.BooleanField(read_only=True)
    subtotal       = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, allow_null=True
    )

    class Meta:
        model  = CartItem
        fields = [
            'id', 'listing', 'listing_detail',
            'quantity', 'is_available', 'subtotal', 'added_at',
        ]
        read_only_fields = ['added_at', 'is_available', 'subtotal']

    def get_listing_detail(self, obj):
        """
        Return key listing fields needed by the cart frontend.
        Avoids importing the full ListingSerializer to keep payload lean.
        """
        listing = obj.listing
        request = self.context.get('request')

        # Cover image
        image_url = None
        first_img = listing.images.first()
        if first_img:
            image_url = (
                request.build_absolute_uri(first_img.image.url)
                if request else first_img.image.url
            )

        return {
            'id':            listing.id,
            'title':         listing.title,
            'price':         str(listing.price) if listing.price else None,
            'negotiable':    listing.negotiable,
            'condition':     listing.condition,
            'category':      listing.category,
            'listing_type':  listing.listing_type,
            'status':        listing.status,
            'area_of_operation': listing.area_of_operation,
            'image':         image_url,
            'seller': {
                'id':        str(listing.seller.id),
                'full_name': listing.seller.full_name,
            },
        }

    def validate_listing(self, listing):
        # Services cannot be added to cart
        if listing.listing_type == 'service':
            raise serializers.ValidationError(
                'Services cannot be added to the cart. '
                'Go to the listing page and click Book Now.'
            )
        if listing.status != 'active':
            raise serializers.ValidationError('This listing is no longer available.')
        if listing.is_draft:
            raise serializers.ValidationError('This listing is not yet published.')
        return listing

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate(self, data):
        request = self.context['request']
        listing = data.get('listing')

        # Cannot add your own listing to your cart
        if listing and listing.seller == request.user:
            raise serializers.ValidationError(
                'You cannot add your own listing to your cart.'
            )

        # Check quantity does not exceed available stock
        quantity = data.get('quantity', 1)
        if listing and listing.quantity and quantity > listing.quantity:
            raise serializers.ValidationError(
                f'Only {listing.quantity} available in stock.'
            )

        return data


class CartSerializer(serializers.ModelSerializer):
    items      = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    total      = serializers.SerializerMethodField()

    class Meta:
        model  = Cart
        fields = ['id', 'items', 'item_count', 'total', 'updated_at']

    def get_item_count(self, obj):
        return obj.items.count()

    def get_total(self, obj):
        total = sum(
            item.subtotal
            for item in obj.items.all()
            if item.subtotal is not None
        )
        return str(total) if total else None