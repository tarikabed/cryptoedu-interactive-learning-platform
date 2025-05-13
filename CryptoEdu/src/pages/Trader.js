import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";
import { getCoinPrices, getCoinGraphData } from "../services/coinGeckoAPI";
import TraderPanel from "../components/TraderPanel";
import { supabase } from '../supabaseAPI';
import { TrendingUp, ChevronLeft, Wallet, BarChart3, Clock, AlertTriangle } from 'lucide-react';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

function Trader() {
    const [coinList, setCoinList] = useState([]);
    const [coin, setCoin] = useState(null);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [bidPrice, setBidPrice] = useState(null);
    const [askPrice, setAskPrice] = useState(null);
    const [yAxisScale, setYAxisScale] = useState({ min: 0, max: 100000 });
    const [timeframe, setTimeframe] = useState('1'); // Default to 24 hours (1 day)
    
    // Timeframe options
    const timeframeOptions = [
        { label: '24h', value: '1', tooltip: '24 Hours' },
        { label: '1W', value: '7', tooltip: '1 Week' },
        { label: '1M', value: '30', tooltip: '1 Month' },
        { label: '1Y', value: '365', tooltip: '1 Year' }
    ];

    const updateBidAskPrices = (currentPrice) => {
        const spread = currentPrice * 0.001;
        setBidPrice(currentPrice - spread);
        setAskPrice(currentPrice + spread);
    };

    useEffect(() => {
        const fetchCoinPrices = async () => {
            try {
                const prices = await getCoinPrices();
                setCoinList(prices);
            } catch (err) {
                setError("Failed to fetch coin prices");
            }
        };
        fetchCoinPrices();
    }, []);

    useEffect(() => {
        if (!coinList.length) return;

        const updateMarketPrices = async () => {
            for (const coin of coinList) {
                // Silently handle any errors in market price updates
                await supabase
                    .from('market_prices')
                    .upsert({
                        coin_symbol: coin.name.toLowerCase(),
                        coin_name: coin.name,
                        current_price: coin.current_price,
                        bid_price: coin.current_price * 0.999,
                        ask_price: coin.current_price * 1.001,
                        last_updated: new Date()
                    }, {
                        onConflict: 'coin_symbol'
                    });
            }
        };

        updateMarketPrices();
    }, [coinList]);

    const updateYAxisScale = (prices) => {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1; // Add 10% padding

        setYAxisScale({
            min: Math.max(0, minPrice - padding),
            max: maxPrice + padding
        });
    };

    useEffect(() => {
        if (!coin) return;

        const fetchGraphData = async () => {
            try {
                const prices = await getCoinGraphData(coin, timeframe);
                setData(prices);
                updateYAxisScale(prices.map(p => p[1]));

                if (prices && prices.length > 0) {
                    const currentPrice = prices[prices.length - 1][1];
                    updateBidAskPrices(currentPrice);
                }
            } catch (err) {
                setError("Failed to fetch graph data");
            }
        };
        fetchGraphData();
    }, [coin, timeframe]);

    if (error) {
        return <div style={{ padding: "2rem", color: "#ef4444" }}>{error}</div>;
    }

    if (coin && data == null) {
        return <div style={{ 
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "calc(100vh - 104px)",
            color: "white"
        }}>
            <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(59, 130, 246, 0.3)",
                borderTop: "3px solid #3b82f6",
                borderRadius: "50%",
                marginBottom: "1rem",
                animation: "spin 1s linear infinite",
            }}></div>
            <h2>Loading market data...</h2>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>;
    }

    if (!coin) {
        return (
            <div style={{ 
                padding: "2rem",
                maxWidth: "1200px",
                margin: "0 auto",
            }}>
                {/* Header section with title */}
                <div style={{
                    marginBottom: "2rem",
                }}>
                    <h1 style={{ 
                        fontSize: "2.5rem", 
                        fontWeight: "700", 
                        background: "linear-gradient(to right, #4ade80, #3b82f6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        margin: "0 0 0.5rem 0"
                    }}>
                        Crypto Trader
                    </h1>
                    <p style={{ 
                        color: "#94a3b8", 
                        fontSize: "1.1rem",
                        maxWidth: "600px",
                        margin: 0
                    }}>
                        Practice trading with virtual currency in real-time market conditions
                    </p>
                </div>

                {/* Featured info card */}
                <div style={{
                    background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(74, 222, 128, 0.1))",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    marginBottom: "2rem",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div>
                        <h2 style={{ 
                            color: "white", 
                            fontSize: "1.3rem",
                            fontWeight: "600",
                            margin: "0 0 0.5rem 0",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}>
                            <TrendingUp size={20} color="#3b82f6" /> Start Your Trading Journey
                        </h2>
                        <p style={{ color: "#94a3b8", margin: 0 }}>
                            Select a cryptocurrency below to view real-time charts and practice risk-free trading
                        </p>
                    </div>
                </div>

                {/* Risk Warning Banner */}
                <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "16px",
                    padding: "1.25rem",
                    marginBottom: "2rem",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem"
                }}>
                    <div style={{
                        background: "rgba(239, 68, 68, 0.2)",
                        borderRadius: "50%",
                        minWidth: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <AlertTriangle size={24} color="#ef4444" />
                    </div>
                    <div>
                        <h3 style={{ 
                            color: "#ef4444", 
                            margin: "0 0 0.5rem 0",
                            fontSize: "1rem",
                            fontWeight: "600" 
                        }}>
                            Educational Purpose Only - Risk Warning
                        </h3>
                        <p style={{ 
                            color: "#cbd5e0", 
                            margin: 0,
                            fontSize: "0.9rem",
                            lineHeight: "1.5" 
                        }}>
                            This is a simulated trading environment designed for educational purposes only. Cryptocurrency investments involve substantial risk and can lead to loss of capital. Always conduct thorough research and consider consulting with a financial advisor before making real investment decisions.
                        </p>
                    </div>
                </div>

                <h2 style={{ 
                    color: "white", 
                    fontSize: "1.4rem", 
                    marginBottom: "1.5rem",
                    fontWeight: "600"
                }}>
                    Available Markets
                </h2>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1.5rem",
                }}>
                    {coinList.map((c, index) => (
                        <div
                            key={index}
                            onClick={() => setCoin(c.name.toLowerCase())}
                            style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "16px",
                                padding: "1.5rem",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                position: "relative",
                                overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-5px)";
                                e.currentTarget.style.boxShadow = "0 12px 25px rgba(0, 0, 0, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
                            }}
                        >
                            {/* Background gradient accent */}
                            <div style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: "120px",
                                height: "120px",
                                borderRadius: "0 0 0 100%",
                                background: c.price_change_percentage_24h >= 0 
                                    ? "linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(74, 222, 128, 0.1))"
                                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))",
                                zIndex: 0
                            }} />
                            
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "1rem",
                                position: "relative",
                                zIndex: 1
                            }}>
                                <div style={{ 
                                    background: c.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444",
                                    borderRadius: "14px",
                                    width: "50px",
                                    height: "50px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: "1rem",
                                    boxShadow: c.price_change_percentage_24h >= 0 
                                        ? "0 4px 12px rgba(16, 185, 129, 0.4)" 
                                        : "0 4px 12px rgba(239, 68, 68, 0.4)"
                                }}>
                                    {c.price_change_percentage_24h >= 0 
                                        ? <TrendingUp size={28} color="#fff" />
                                        : <TrendingUp size={28} color="#fff" style={{ transform: 'rotate(180deg)' }} />
                                    }
                                </div>
                                
                                <h3 style={{ 
                                    margin: 0,
                                    fontSize: "1.2rem", 
                                    fontWeight: "600",
                                    color: "white"
                                }}>
                                    {c.name}
                                </h3>
                            </div>
                            
                            <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "1fr 1fr", 
                                gap: "0.75rem",
                                fontSize: "0.9rem",
                                marginBottom: "1rem",
                                position: "relative",
                                zIndex: 1
                            }}>
                                <div style={{ color: "#94a3b8" }}>Current Price:</div>
                                <div style={{ 
                                    color: "#fff", 
                                    textAlign: "right",
                                    fontWeight: "600" 
                                }}>
                                    ${c.current_price.toLocaleString()}
                                </div>
                                
                                <div style={{ color: "#94a3b8" }}>Market Cap:</div>
                                <div style={{ color: "#fff", textAlign: "right" }}>
                                    ${c.market_cap.toLocaleString()}
                                </div>
                                
                                <div style={{ color: "#94a3b8" }}>24h Change:</div>                                <div style={{ 
                                    color: c.price_change_percentage_24h >= 0 ? "#4ade80" : "#ef4444",
                                    textAlign: "right",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: "4px"
                                }}>
                                    {c.price_change_percentage_24h != null ? (
                                        <>
                                            {c.price_change_percentage_24h >= 0 ? "+" : ""}
                                            {c.price_change_percentage_24h.toFixed(2)}%
                                        </>
                                    ) : (
                                        "N/A"
                                    )}
                                </div>
                            </div>
                            
                            <div style={{
                                marginTop: "auto",
                                position: "relative",
                                zIndex: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "0.5rem",
                                background: "rgba(59, 130, 246, 0.1)",
                                borderRadius: "8px",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                                color: "#3b82f6",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                gap: "6px"
                            }}>
                                <BarChart3 size={16} />
                                View Details & Trade
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const labels = data.map(item => new Date(item[0]));
    const prices = data.map(item => item[1]);
    const labelsFormatted = labels.map(date =>
        date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    );

    const chartData = {
        labels: labelsFormatted,
        datasets: [
            {
                label: 'Price',
                data: prices,
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                borderWidth: 2
            }
        ]
    };    return (
        <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 380px', // Slightly reduced width of trading panel
            gap: '1.5rem',
            padding: '1.5rem',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '700px', // Minimum height to prevent squishing
            height: 'auto', // Changed to auto height
        }}>
            <div style={{ 
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 113px)', // Fixed height for the chart container
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background gradient accent */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "200px",
                    height: "200px",
                    borderRadius: "0 0 0 100%",
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(74, 222, 128, 0.05))",
                    zIndex: 0
                }} />
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <button
                        onClick={() => setCoin(null)}
                        style={{
                            padding: "0.75rem 1rem",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            color: "white",
                            fontSize: "0.875rem",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }}
                    >
                        <ChevronLeft size={16} /> Back to Market
                    </button>
                    <h1 style={{ 
                        fontSize: "1.5rem", 
                        fontWeight: "600",
                        background: "linear-gradient(to right, #4ade80, #3b82f6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        margin: 0
                    }}>
                        {coin.charAt(0).toUpperCase() + coin.slice(1)} Live Chart
                    </h1>
                </div>
                  <div style={{ 
                    flex: '1 1 auto',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '1rem', // Add space for price info strip
                    minHeight: '300px', // Ensure minimum height for chart
                    height: 'calc(100% - 170px)', // Calculate height minus header and footer sections
                }}>
                    <Line 
                        data={chartData} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false, // Allow the chart to fill the container
                            aspectRatio: undefined, // Remove aspect ratio constraint
                            animation: {
                                duration: 0
                            },
                            layout: {
                                padding: {
                                    top: 10,
                                    bottom: 10,
                                    left: 5,
                                    right: 5
                                }
                            },
                            scales: {
                                x: {
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        color: "#94a3b8",
                                        maxRotation: 0,
                                        autoSkip: true,
                                        maxTicksLimit: 6,
                                        font: {
                                            size: 12
                                        }
                                    },
                                    border: {
                                        display: false
                                    }
                                },
                                y: {
                                    grid: {
                                        color: "rgba(255, 255, 255, 0.05)",
                                        drawBorder: false,
                                        tickLength: 8
                                    },
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        color: "#94a3b8",
                                        callback: (value) => `$${value.toLocaleString()}`,
                                        font: {
                                            size: 12
                                        },
                                        padding: 10,
                                        maxTicksLimit: 8,
                                        align: 'end'
                                    },
                                    min: yAxisScale.min,
                                    max: yAxisScale.max,
                                    beginAtZero: false
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    titleColor: '#fff',
                                    bodyColor: '#fff',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    borderWidth: 1,
                                    padding: 12,
                                    displayColors: false,
                                    callbacks: {
                                        title: (tooltipItems) => {
                                            const date = new Date(labels[tooltipItems[0].dataIndex]);
                                            return date.toLocaleString(undefined, { 
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            });
                                        },
                                        label: (context) => `Price: $${context.parsed.y.toLocaleString()}`
                                    }
                                }
                            },
                            interaction: {
                                mode: 'index',
                                intersect: false
                            }
                        }}
                        style={{ 
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </div>
                
                {/* Timeframe selection */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1rem",
                    gap: "0.5rem",
                    zIndex: 1,
                    position: "relative"
                }}>
                    {timeframeOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setTimeframe(option.value)}
                            style={{
                                padding: "0.5rem 1rem",
                                background: timeframe === option.value ? "#3b82f6" : "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "0.875rem",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}
                            onMouseEnter={(e) => {
                                if (timeframe !== option.value) {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (timeframe !== option.value) {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }
                            }}
                        >
                            <Clock size={16} /> {option.label}
                        </button>
                    ))}
                </div>

                {/* Price info strip */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "auto", // Push to bottom
                    paddingTop: "1rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    zIndex: 1,
                    position: "relative",
                    padding: "0.75rem 0", // Added vertical padding
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "0.4rem" }}>CURRENT PRICE</div>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "1.2rem" }}>${data[data.length - 1][1].toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "0.4rem" }}>BID</div>
                        <div style={{ color: "#ef4444", fontWeight: "700", fontSize: "1.2rem" }}>${bidPrice.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "0.4rem" }}>ASK</div>
                        <div style={{ color: "#10b981", fontWeight: "700", fontSize: "1.2rem" }}>${askPrice.toLocaleString()}</div>
                    </div>
                </div>
            </div>            {/* Trading Panel */}
            <div style={{
                height: 'auto', // Changed to auto height
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'start' // Align to the top
            }}>
                <TraderPanel 
                    selectedCoin={coin}
                    currentPrice={data[data.length - 1][1]}
                    bidPrice={bidPrice}
                    askPrice={askPrice}
                />
            </div>
        </div>
    );
}

export default Trader;
