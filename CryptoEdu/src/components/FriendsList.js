import { useEffect, useState } from 'react'
import { supabase } from '../supabaseAPI'
import { UserX, User, UserPlus } from 'lucide-react'
import FriendProfile from './FriendProfile'

export default function FriendsList({ refreshTrigger }) {
  const [friends, setFriends] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true)

      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error('Session error:', sessionErr);
        setIsLoading(false);
        return;
      }

      const userId = session?.user?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Get relationships where user is the sender
      const { data: sentFriendships, error: sentErr } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      // Get relationships where user is the receiver
      const { data: receivedFriendships, error: receivedErr } = await supabase
        .from('friends')
        .select('user_id')
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (sentErr) {
        console.error('Error fetching sent friendships:', sentErr);
      }

      if (receivedErr) {
        console.error('Error fetching received friendships:', receivedErr);
      }

      // Combine both types of friendships
      const friendIds = [];
      
      if (sentFriendships && sentFriendships.length > 0) {
        friendIds.push(...sentFriendships.map(row => row.friend_id));
      }
      
      if (receivedFriendships && receivedFriendships.length > 0) {
        friendIds.push(...receivedFriendships.map(row => row.user_id));
      }
      
      // Remove duplicates
      const uniqueFriendIds = [...new Set(friendIds)];
      
      if (uniqueFriendIds.length === 0) {
        setIsLoading(false);
        setFriends([]);
        return;
      }

      // Get usernames for all friends
      const { data: usernamesData, error: usernamesErr } = await supabase
        .from('user_usernames')
        .select('user_id, username')
        .in('user_id', uniqueFriendIds);

      if (usernamesErr) {
        console.error('Usernames fetch error:', usernamesErr);
      } else {
        setFriends(usernamesData.map(user => ({
          id: user.user_id,
          username: user.username
        })));
      }
      setIsLoading(false);
    };

    fetchFriends();
  }, [refreshTrigger]);

  const handleRemoveFriend = async (friendId) => {
    const { data: { session }, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) {
      console.error('Session error:', sessErr);
      return;
    }
    const userId = session?.user?.id;
    if (!userId) return;

    // Delete friendship where user is sender
    const { error } = await supabase
      .from('friends')
      .delete()
      .match({ user_id: userId, friend_id: friendId });

    if (error) {
      console.error('Error deleting friendship:', error);
      return;
    }

    // Delete friendship where user is receiver
    const { error: reverseErr } = await supabase
      .from('friends')
      .delete()
      .match({ user_id: friendId, friend_id: userId });

    if (reverseErr) {
      console.error('Error deleting reverse friendship:', reverseErr);
      return;
    }

    // Update the UI
    setFriends(friends.filter(f => f.id !== friendId));
    
    // If the removed friend was selected, clear the selection
    if (selectedFriend && selectedFriend.id === friendId) {
      setSelectedFriend(null);
    }
  };

  // Handle view profile click
  const handleViewProfile = (friend) => {
    setSelectedFriend(friend);
  };

  // If a friend is selected, show their profile
  if (selectedFriend) {
    return (
      <FriendProfile 
        friendId={selectedFriend.id}
        username={selectedFriend.username}
        onBack={() => setSelectedFriend(null)}
      />
    );
  }

  return (
    <div>
      {isLoading ? (
        <div style={{ color: "#94a3b8", textAlign: "center", padding: "1rem" }}>Loading friends...</div>
      ) : friends.length === 0 ? (
        <div style={{ 
          color: "#94a3b8", 
          textAlign: "center", 
          padding: "2rem 1rem",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderRadius: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}>
          <UserPlus size={32} style={{ color: "#94a3b8", opacity: 0.5 }} />
          <div>No friends found</div>
          <div style={{ fontSize: "0.9rem", maxWidth: "300px" }}>
            Find friends by sending them friend requests in the Friend Requests section
          </div>
        </div>
      ) : (
        friends.map(f => (
          <div
            key={f.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderRadius: "12px",
              marginBottom: "0.75rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.1rem",
                fontWeight: "500"
              }}>
                {f.username ? f.username[0].toUpperCase() : "?"}
              </div>
              <div>
                <div style={{ 
                  color: "white", 
                  fontWeight: "500",
                  fontSize: "0.95rem"
                }}>
                  {f.username || "Unknown User"}
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "0.5rem"
            }}>
              <button
                onClick={() => handleViewProfile(f)}
                style={{
                  padding: "0.5rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#3b82f6",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                }}
              >
                <User size={16} />
                View Profile
              </button>
              <button
                onClick={() => handleRemoveFriend(f.id)}
                style={{
                  padding: "0.5rem",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                }}
              >
                <UserX size={16} />
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
