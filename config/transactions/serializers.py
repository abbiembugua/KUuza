from rest_framework import serializers
from django.db import connection, transaction as db_transaction
from .models import Notification, Transaction
from listings.serializers import ListingSerializer
from listings.models import Listing


class TransactionSerializer(serializers.ModelSerializer):
    buyer_name  = serializers.CharField(source='buyer.full_name',  read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)

    # Listing snapshot fields for display
    listing_title = serializers.CharField(source='listing.title',        read_only=True)
    listing_image = serializers.SerializerMethodField()
    listing_type  = serializers.CharField(source='listing.listing_type', read_only=True)

    class Meta:
        model  = Transaction
        fields = [
            'id',
            'listing', 'listing_title', 'listing_image', 'listing_type',
            'buyer',  'buyer_name',
            'seller', 'seller_name',
            'interaction_type',
            'agreed_price',
            'quantity',
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

        # Validate requested quantity against available stock (goods only)
        quantity_requested = data.get('quantity', 1)
        if listing.listing_type == 'good':
            if quantity_requested < 1:
                raise serializers.ValidationError(
                    {'quantity': 'Quantity must be at least 1.'}
                )
            if quantity_requested > listing.quantity:
                raise serializers.ValidationError({
                    'quantity': (
                        f'Only {listing.quantity} unit(s) available. '
                        f'You requested {quantity_requested}.'
                    )
                })

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
        request          = self.context['request']
        listing_from_req = validated_data['listing']
        quantity_req     = validated_data.get('quantity', 1)

        with db_transaction.atomic():
            # Lock the listing row — any concurrent request blocks here until
            # this transaction commits, eliminating the read-then-write race.
            locked = Listing.objects.select_for_update().get(pk=listing_from_req.pk)

            # Re-validate under the lock with the freshest DB values
            if locked.status != 'active':
                raise serializers.ValidationError(
                    f'This listing is no longer available (status: {locked.status}).'
                )
            if locked.is_draft:
                raise serializers.ValidationError('This listing is not published yet.')
            if locked.listing_type == 'good' and quantity_req > locked.quantity:
                raise serializers.ValidationError({
                    'quantity': (
                        f'Only {locked.quantity} unit(s) left. '
                        f'You requested {quantity_req}.'
                    )
                })

            validated_data['listing']           = locked
            validated_data['buyer']             = request.user
            validated_data['seller']            = locked.seller
            validated_data['agreed_price']      = validated_data.get('agreed_price') or locked.price
            validated_data['interaction_type']  = (
                'service_use' if locked.listing_type == 'service' else 'purchase'
            )

            transaction = super().create(validated_data)

            if 'transactions_notification' in connection.introspection.table_names():
                Notification.objects.create(
                    recipient=transaction.seller,
                    actor=transaction.buyer,
                    transaction=transaction,
                    notification_type='purchase_created',
                    title='New purchase request',
                    body=f'{transaction.buyer.full_name} placed an order for {locked.title}.',
                )
                Notification.objects.create(
                    recipient=transaction.buyer,
                    actor=transaction.seller,
                    transaction=transaction,
                    notification_type='receipt_ready',
                    title='Receipt ready',
                    body=f'Your receipt for {locked.title} is ready to download.',
                )

        return transaction


class NotificationSerializer(serializers.ModelSerializer):
    actor_name     = serializers.CharField(source='actor.full_name', read_only=True)
    transaction_id = serializers.UUIDField(source='transaction.id',  read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id',
            'title',
            'body',
            'notification_type',
            'is_read',
            'created_at',
            'read_at',
            'actor_name',
            'transaction_id',
        ]