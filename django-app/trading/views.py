#from django.shortcuts import render will be used when rendering HTML templates later on
from django.http import JsonResponse
import requests

# Create your views here.

#Show all trending coins as a list
def coin_prices(request):
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        'ids' : 'bitcoin, ethereum, tether, ripple, binancecoin, solana, usd-coin, tron, dogecoin',
        'vs_currency' : 'usd',
    }
    response = requests.get(url, params=params)

    #Error checking with response status implemented
    if response.status_code != 200:
        return JsonResponse("Error occurred!")
    
    data = response.json()
    new_data = []

    for coin in data:
        new_data.append({
            "name": coin["name"],
            "current_price": coin["current_price"],
            "market_cap": coin["market_cap"],
            "price_change_percentage_24h": coin["price_change_percentage_24h"],
            "high_24h": coin["high_24h"],
            "low_24h": coin["low_24h"],
            "ath": coin["ath"],
        })

    return JsonResponse({"coins": new_data})

def coin_graph(request, coin_id):
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        'vs_currency': 'usd',
        'days': '365',
        }
    response = requests.get(url, params=params)
    #Error checking with response status implemented
    if response.status_code != 200:
        return JsonResponse("Error occurred!")
    data = response.json()
    
    prices = []
    for price in data['prices']:
        #price[0] is time, price[1] is price at that time
        prices.append([price[0], price[1]])
    
    return JsonResponse(prices, safe=False)