from django.urls import path
from .views import coin_prices, coin_graph

urlpatterns = [
    path('trading/', coin_prices, name='coin_prices'),
    path('trading/<str:coin_id>/', coin_graph, name='coin_graph'),
]
