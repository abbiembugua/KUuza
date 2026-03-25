from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .Serializers import CartSerializer, CartItemSerializer
from listings.models import Listing


def get_or_create_cart(user):
    """Get or create the user's cart."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    """
    GET  /api/cart/      — retrieve the current user's full cart
    DELETE /api/cart/    — clear all items from the cart
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart       = get_or_create_cart(request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'status': 'cart cleared'}, status=status.HTTP_200_OK)


class CartAddView(APIView):
    """
    POST /api/cart/add/
    Body: { listing_id: uuid, quantity: int (optional, default 1) }

    Adds a listing to the cart. If it is already in the cart,
    increments the quantity instead of creating a duplicate.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        listing_id = request.data.get('listing_id')
        quantity   = int(request.data.get('quantity', 1))

        if not listing_id:
            return Response(
                {'error': 'listing_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing = get_object_or_404(Listing, id=listing_id)
        cart    = get_or_create_cart(request.user)

        # Validate via serializer
        serializer = CartItemSerializer(
            data={'listing': listing.id, 'quantity': quantity},
            context={'request': request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Add or update
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            listing=listing,
            defaults={'quantity': quantity}
        )
        if not created:
            # Already in cart — increment quantity
            new_qty = cart_item.quantity + quantity
            if listing.quantity and new_qty > listing.quantity:
                return Response(
                    {'error': f'Only {listing.quantity} available in stock.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_qty
            cart_item.save(update_fields=['quantity'])

        return Response(
            CartItemSerializer(cart_item, context={'request': request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class CartItemView(APIView):
    """
    PATCH  /api/cart/items/{item_id}/   — update quantity of a cart item
    DELETE /api/cart/items/{item_id}/   — remove a single item from the cart
    """
    permission_classes = [IsAuthenticated]

    def _get_item(self, request, item_id):
        cart = get_or_create_cart(request.user)
        return get_object_or_404(CartItem, id=item_id, cart=cart)

    def patch(self, request, item_id):
        item     = self._get_item(request, item_id)
        quantity = request.data.get('quantity')

        if quantity is None:
            return Response(
                {'error': 'quantity is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        quantity = int(quantity)
        if quantity < 1:
            return Response(
                {'error': 'Quantity must be at least 1. To remove, use DELETE.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing = item.listing
        if listing.quantity and quantity > listing.quantity:
            return Response(
                {'error': f'Only {listing.quantity} available in stock.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.quantity = quantity
        item.save(update_fields=['quantity'])
        return Response(
            CartItemSerializer(item, context={'request': request}).data
        )

    def delete(self, request, item_id):
        item = self._get_item(request, item_id)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartCheckAvailabilityView(APIView):
    """
    GET /api/cart/check_availability/
    Checks each item in the cart and flags any that are sold or unavailable.
    Called before showing the checkout button so buyers know what they cannot purchase.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart      = get_or_create_cart(request.user)
        items     = cart.items.select_related('listing').all()
        unavailable = []

        for item in items:
            if not item.is_available:
                unavailable.append({
                    'cart_item_id': str(item.id),
                    'listing_id':   str(item.listing.id),
                    'title':        item.listing.title,
                    'reason':       'sold' if item.listing.status == 'sold' else 'unavailable',
                })

        return Response({
            'all_available': len(unavailable) == 0,
            'unavailable':   unavailable,
        })