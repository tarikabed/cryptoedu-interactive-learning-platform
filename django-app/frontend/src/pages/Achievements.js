import React, {useState} from "react";
import {mockAchievements} from "../data/mockAchievements";
import MockLeaderboard from "../data/MOCK_DATA.json"


const Achievements = () => {
  const [sortOrder] = useState("desc");

  const getSortedLeaderboard = (key) => {
    const parseProfit = (val) =>
      parseFloat(val.replace("£", "").replace(",", ""));
  
    return [...MockLeaderboard].sort((a, b) => {
      const aVal = key === "profit" ? parseProfit(a[key]) : a[key];
      const bVal = key === "profit" ? parseProfit(b[key]) : b[key];
  
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  };
  
  return (
    <div style={{ padding: "2rem" }}>
      {/* Title */}
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Your Achievements</h1>
      <p style={{ marginBottom: "1.5rem", color: "#555" }}>Track your progress and milestones.</p>

        {/* Achievements list */}
        <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "2rem", color: "#555" }}>
          Earneds Achievements: {mockAchievements.length}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          {mockAchievements.map((ach) => (
            <div
              key={ach.id}
              style={{
                display: "flex",
                backgroundColor: "#1b1f2b",
                borderRadius: "0.5rem",
                padding: "1rem",
                alignItems: "center",
                color: "#ccc",
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: "2rem", marginRight: "1rem" }}>
                {ach.badge_icon}
              </div>

              {/* Text Info */}
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#fff" }}>
                  {ach.name}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#999" }}>
                  {ach.description}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "0.25rem" }}>
                </div>
              </div>

              {/* Unlock Time */}
              <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#888" }}>
                <div>Unlocked {ach.unlocked_at || "16 Jun @ 12:36pm"}</div>
                <div style={{ color: "#666" }}>{ach.unlocked_relative || "yesterday"}</div>
              </div>
            </div>
          ))}
        </div>


      {/* Leaderboard */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "2rem", fontWeight: "bold" }}>Leaderboard</h2>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
        {["profit", "xp", "streak", "trades"].map((key) => {
          const sorted = getSortedLeaderboard(key);
          return (
            <div
              key={key}
              style={{
                backgroundColor: "#1b1f2b",
                borderRadius: "0.5rem",
                padding: "1rem",
                flex: "1",
                minWidth: "250px",
                color: "#fff",
              }}
            >
              <h3 style={{ fontSize: "1.2rem", textAlign: "center", marginBottom: "0.5rem" }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </h3>

              {/* 1st Place */}
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: "2rem" }}>🏆</div>
                <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{sorted[0]?.user || "—"}</div>
                <div style={{ color: "#ccc" }}>{sorted[0]?.[key]}</div>
              </div>
              <div style={{maxHeight: "350px",overflowY: "auto",scrollbarWidth: "thin",scrollbarColor: "#444 transparent",}}>

              {/* 2nd and 3rd */}
              {[1, 2].map((rank) => (
                <div
                  key={rank}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem",
                    borderTop: "1px solid #333",
                    borderBottom: "1px solid #333",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{rank === 1 ? "🥈" : "🥉"}</span>
                  <span>{sorted[rank]?.user || "—"}</span>
                  <span>{sorted[rank]?.[key] || "—"}</span>
                </div>
              ))}

              {/* 4th – 15th */}
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {sorted.slice(3, 15).map((entry, idx) => (
                  <div
                    key={entry.user + idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.5rem",
                      borderBottom: "1px solid #222",
                      color: "#aaa",
                    }}
                  >
                    <span>{idx + 4}</span>
                    <span>{entry.user}</span>
                    <span>{entry[key]}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default Achievements;

