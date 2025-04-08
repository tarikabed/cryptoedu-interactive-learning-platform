import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";

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

    const labels = data.map(item => new Date(item[0]).toLocaleDateString());  // Format the timestamp into a readable date
    const prices = data.map(item => item[1]);  // Extract the price values

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
        </div>
    )
}

export default Trader;
