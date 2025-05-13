// src/pages/Friends.jsx
import React, { useState } from "react";
import FriendsList from "../components/FriendsList";
import PendingFriendRequests from "../components/PendingFriendRequests";
import AllUsersList from "../components/AllUsersList";
import { Users, UserPlus, UsersRound } from "lucide-react";

export default function Friends() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          background: "linear-gradient(to right, #4ade80, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem"
        }}>Friends</h1>
        
        <p style={{ 
          color: "#94a3b8", 
          fontSize: "1.1rem",
          maxWidth: "600px",
          marginBottom: "2rem"
        }}>
          Connect with other users, see their profiles and track their progress
        </p>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 2fr", 
          gap: "2rem",
          marginBottom: "2rem" 
        }}>
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Background gradient accent */}
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "150px",
              height: "150px",
              borderRadius: "0 0 0 100%",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.05))",
              opacity: 0.5,
              zIndex: 0
            }} />
            
            <h2 style={{ 
              fontSize: "1.25rem", 
              marginBottom: "1.25rem",
              color: "white",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              position: "relative",
              zIndex: 1
            }}>
              <div style={{ 
                background: "rgba(239, 68, 68, 0.2)",
                borderRadius: "10px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <UserPlus size={18} color="#ef4444" />
              </div>
              Friend Requests
            </h2>
            <PendingFriendRequests onResponded={() => setRefreshTrigger(prev => !prev)} />
          </div>
  
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Background gradient accent */}
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "200px",
              height: "200px",
              borderRadius: "0 0 0 100%",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(74, 222, 128, 0.15))",
              opacity: 0.5,
              zIndex: 0
            }} />
            
            <h2 style={{ 
              fontSize: "1.25rem", 
              marginBottom: "1.25rem",
              color: "white",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              position: "relative",
              zIndex: 1
            }}>
              <div style={{ 
                background: "rgba(59, 130, 246, 0.2)",
                borderRadius: "10px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Users size={18} color="#3b82f6" />
              </div>
              Your Friends
            </h2>
            <FriendsList refreshTrigger={refreshTrigger} />
          </div>
        </div>
  
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          padding: "1.5rem",
          borderRadius: "1rem",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Background gradient accent */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "150px",
            height: "150px",
            borderRadius: "0 0 0 100%",
            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(139, 92, 246, 0.05))",
            opacity: 0.5,
            zIndex: 0
          }} />
          
          <h2 style={{ 
            fontSize: "1.25rem", 
            marginBottom: "1.25rem",
            color: "white",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            position: "relative",
            zIndex: 1
          }}>
            <div style={{ 
              background: "rgba(167, 139, 250, 0.2)",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <UsersRound size={18} color="#a78bfa" />
            </div>
            All Users
          </h2>
          <AllUsersList />
        </div>
      </div>
    </div>
  );
}