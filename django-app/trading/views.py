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

#Show specific coins' graph in the format [[milliseconds since 1970, coin price], ...]
def btc_graph(request, coin_id):
    #TODO bug fix: occasionally this function causes an error: KeyError at /trading/bitcoin/ 'prices'
    # is usually resolved by waiting 30 seconds so not a big priority to fix

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
