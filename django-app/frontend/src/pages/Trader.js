import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";

import TraderPanel from "../components/TraderPanel";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

function Trader() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/trading/bitcoin/")
        .then(response => response.json())
        .then(data => setData(data))
        .catch(error => console.error("Error fetching data:", error));
    }, [])

    if (data == null) {
        return (<h1>Loading...</h1>)
    }

    const labels = data.map(item => new Date(item[0]));
    const prices = data.map(item => item[1]);
    const labelsFormatted = labels.map(date => date.toLocaleDateString());

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
        labels,
        datasets: [
            {
                label: "Bitcoin price",
                data: prices,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.2)",  // Area under the line color
                fill: true,

            }
        ]
    }

    return (
        <div>
            <h1>Price:</h1>
            <Line data={chartData} options={{responsive: true}} />
            <TraderPanel />
        </div>
    )
}

export default Trader;
