import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";

import TraderPanel from "../components/TraderPanel";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

function Trader() {
    const [coinList, setCoinList] = useState([]);
    const [coin, setCoin] = useState(null)
    const [data, setData] = useState(null);

    // Fetch list of coins
    useEffect(() => {
        fetch("http://127.0.0.1:8000/trading/")
            .then(response => response.json())
            .then(data => setCoinList(data.coins))
            .catch(error => console.error("Error fetching coin list:", error));
    }, [])

    // Fetch chart data when coin is selected
    useEffect(() => {
        if (!coin) {
            return;
        }

        fetch(`http://127.0.0.1:8000/trading/${coin}/`)
            .then(response => response.json())
            .then(data => setData(data))
            .catch(error => console.error("Error fetching chart data:", error));
    }, [coin])

    // While loading chart data
    if (coin && data == null) {
        return (<h1>Loading...</h1>)
    }

    // Show coin list (if no coin selected)
    if (!coin) {
        return (
            <div style={{ padding: "2rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
                    Select a Coin 📊
                </h1>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "1.5rem",
                    }}
                >
                    {coinList.map((c, index) => (
                        <div
                            key={index}
                            onClick={() => setCoin(c.name.toLowerCase())}
                            style={{
                                backgroundColor: "#f9f9f9",
                                padding: "1.5rem",
                                borderRadius: "1rem",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.02)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{c.name}</h3>
                            <p><strong>Current Price:</strong> ${c.current_price.toLocaleString()}</p>
                            <p><strong>Market Cap:</strong> ${c.market_cap.toLocaleString()}</p>
                            <p><strong>24h Change:</strong> {c.price_change_percentage_24h?.toFixed(2)}%</p>
                            <p><strong>24h High:</strong> ${c.high_24h.toLocaleString()}</p>
                            <p><strong>24h Low:</strong> ${c.low_24h.toLocaleString()}</p>
                            <p><strong>All-Time High:</strong> ${c.ath.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Prepare chart
    const labels = data.map(item => new Date(item[0]));
    const prices = data.map(item => item[1]);
    const labelsFormatted = labels.map(date =>
        date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    );

    const beginningDate = new Date(1730000000 * 1000); // 27 October 2024

    let firstDateIndex = null;
    for (let i = 0; i < labels.length; i++) {
        if (labels[i] >= beginningDate) {
            firstDateIndex = i;
            break;
        }
    }

    // Make sure you check that index was found
    if (firstDateIndex !== null) {
        labels.splice(0, firstDateIndex);
        prices.splice(0, firstDateIndex);
        labelsFormatted.splice(0, firstDateIndex);
    }

    const chartData = {
        labels: labelsFormatted,
        datasets: [
            {
                label: `${coin} price`,
                data: prices,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.2)",  // Area under the line color
                fill: true,
                pointRadius: 0,
            }
        ]
    }

    // Display button and chart
    return (
        <div>
            <button
                onClick={() => setCoin(null)}
                style={{
                    marginBottom: "1rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    cursor: "pointer"
                }}
            >
                ← Back to Coin List
            </button>
            <h1>Price:</h1>
            <Line data={chartData} options={{ responsive: true }} />
            <TraderPanel />
        </div>
    )
}

export default Trader;
