// src/components/AllUsersList.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseAPI';

export default function AllUsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      
      try {
        // Get current user for comparison
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Fetch all users from user_usernames table
        const { data: usernames, error: usernamesError } = await supabase
          .from('user_usernames')
          .select('user_id, username')
          .order('username', { ascending: true });
        
        if (usernamesError) {
          console.error('Error fetching usernames:', usernamesError);
          setLoading(false);
          return;
        }
        
        if (!usernames || usernames.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch additional user info if needed (this is optional)
        // You could add more queries here to get additional user data
        
        const userList = usernames.map(user => ({
          id: user.user_id,
          username: user.username,
          isCurrentUser: user.user_id === currentUser?.id
        }));
        
        setUsers(userList);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <div>
      {loading ? (
        <div style={{ color: "#94a3b8", padding: "1rem", textAlign: "center" }}>
          Loading users...
        </div>
      ) : (
        <ul style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "0.5rem",
          maxHeight: "16rem",
          overflowY: "auto"
        }}>
          {users.map((u) => (
            <li
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem",
                backgroundColor: u.isCurrentUser ? "rgba(59, 130, 246, 0.1)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: "0.5rem",
                border: u.isCurrentUser ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <div>
                <span style={{ color: "white", fontWeight: 500 }}>{u.username || '—'}</span>
                {u.isCurrentUser && (
                  <span style={{ 
                    marginLeft: "0.5rem", 
                    color: "#3b82f6", 
                    fontSize: "0.75rem",
                    padding: "0.1rem 0.4rem",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "0.25rem"
                  }}>
                    You
                  </span>
                )}
              </div>
              <button
                style={{
                  color: "#3b82f6",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
                onClick={() => navigator.clipboard.writeText(u.id)}
                onMouseEnter={e => e.target.style.textDecoration = "underline"}
                onMouseLeave={e => e.target.style.textDecoration = "none"}
              >
                Copy ID
              </button>
            </li>
          ))}
          {users.length === 0 && <li style={{ color: "#94a3b8" }}>No users found</li>}
        </ul>
      )}
    </div>
  );
}
