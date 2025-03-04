#from django.shortcuts import render will be used when rendering HTML templates later on
from django.http import JsonResponse
import requests

# Create your views here.

#Show all trending coins as a list
def btc_price(request):
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        'ids' : 'bitcoin',
        'vs_currencies' : 'usd',
    }
    response = requests.get(url, params=params)
    #Error checking with response status code to be implemented
    data = response.json()

    btc_price = data['bitcoin']['usd']
    return JsonResponse({"bitcoin_price": btc_price})

#Show specific coins' graph
def btc_graph(request, coin_id):
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        'vs_currency': 'usd',
        'days': '365',
        }
    response = requests.get(url, params=params)
    #Error checking with response status code to be implemented
    data = response.json()
    
    prices = []
    for price in data['prices']:
        #price[0] is time, price[1] is price at that time
        prices.append([price[0], price[1]])
    
    return JsonResponse(prices, safe=False)
    
#Live data to be implemented
