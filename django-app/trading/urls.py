from django.urls import path
from .views import btc_price, btc_graph

urlpatterns = [
    path('trading/', btc_price, name='btc_price'),
    path('trading/<str:coin_id>/', btc_graph, name='btc_graph'),
]
