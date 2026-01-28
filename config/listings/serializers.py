from rest_framework import serializers
from .models import Listing, ListingImage

class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image']

class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'seller', 'title', 'category', 'description', 'price',
            'negotiable', 'quantity', 'condition', 'area_of_operation',
            'contact_preference', 'whatsapp_number', 'is_draft', 'images', 'created_at'
        ]
        read_only_fields = ['seller', 'created_at']
