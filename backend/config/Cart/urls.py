from django.urls import path
from .views import CartView, CartAddView, CartItemView, CartCheckAvailabilityView

urlpatterns = [
    path('cart/',                          CartView.as_view(),                 name='cart'),
    path('cart/add/',                      CartAddView.as_view(),              name='cart-add'),
    path('cart/items/<uuid:item_id>/',     CartItemView.as_view(),             name='cart-item'),
    path('cart/check_availability/',       CartCheckAvailabilityView.as_view(), name='cart-check'),
]