const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const getCoinPrices = async () => {
    const url = `${COINGECKO_API_URL}/coins/markets`;
    const params = new URLSearchParams({
        ids: 'bitcoin,ethereum,tether,ripple,binancecoin,solana,usd-coin,tron,dogecoin',
        vs_currency: 'usd',
    });

    try {
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        return data.map(coin => ({
            name: coin.name,
            current_price: coin.current_price,
            market_cap: coin.market_cap,
            price_change_percentage_24h: coin.price_change_percentage_24h,
            high_24h: coin.high_24h,
            low_24h: coin.low_24h,
            ath: coin.ath,
        }));
    } catch (error) {
        // Removed redundant console.error
        throw error;
    }
};

export const getCoinGraphData = async (coinId, days = '365') => {
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart`;
    const params = new URLSearchParams({
        vs_currency: 'usd',
        days: days,
    });

    try {
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.prices;
    } catch (error) {
        // Removed redundant console.error
        throw error;
    }
};