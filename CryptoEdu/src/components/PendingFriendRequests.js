import { useEffect, useState } from 'react';
import { supabase } from '../supabaseAPI';
import { Check, X, AlertCircle, Clock } from 'lucide-react';

export default function PendingFriendRequests({ onResponded }) {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
    
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        const { data: incomingData, error: incomingError } = await supabase
          .from('friends')
          .select('*')
          .eq('friend_id', user.id)
          .eq('status', 'pending');
          
        if (incomingError) {
          setIsLoading(false);
          return;
        }
        
        const { data: outgoingData, error: outgoingError } = await supabase
          .from('friends')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending');
          
        if (outgoingError) {
          setIsLoading(false);
          return;
        }
        
        const userIdsToFetch = new Set();
        
        if (incomingData) {
          incomingData.forEach(req => userIdsToFetch.add(req.user_id));
        }
        
        if (outgoingData) {
          outgoingData.forEach(req => userIdsToFetch.add(req.friend_id));
        }
        
        const userIds = Array.from(userIdsToFetch);
        
        if (userIds.length === 0) {
          setIncomingRequests([]);
          setOutgoingRequests([]);
          setIsLoading(false);
          return;
        }
        
        const { data: usernames, error: usernamesError } = await supabase
          .from('user_usernames')
          .select('user_id, username')
          .in('user_id', userIds);
          
        const usernameMap = {};
        if (usernames) {
          usernames.forEach(user => {
            usernameMap[user.user_id] = user.username;
          });
        }
        
        const incomingWithUsernames = incomingData 
          ? incomingData.map(request => ({
              ...request,
              senderUsername: usernameMap[request.user_id] || 'Unknown User'
            }))
          : [];
          
        const outgoingWithUsernames = outgoingData
          ? outgoingData.map(request => ({
              ...request,
              recipientUsername: usernameMap[request.friend_id] || 'Unknown User'
            }))
          : [];
        
        setIncomingRequests(incomingWithUsernames);
        setOutgoingRequests(outgoingWithUsernames);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
    
    const friendsChannel = supabase
      .channel('friends-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friends'
        }, 
        payload => {
          fetchData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [onResponded]);

  const handleAccept = async (senderUserId) => {
    try {
      setIsLoading(true);
      // eslint-disable-next-line no-unused-vars
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
    
      const myUserId = user.id;
      
      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .match({ user_id: senderUserId, friend_id: myUserId });
    
      if (updateError) {
        setIsLoading(false);
        return;
      }
    
      const { data: existingReverse, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', myUserId)
        .eq('friend_id', senderUserId)
        .maybeSingle();
    
      if (fetchError) {
        setIsLoading(false);
        return;
      }
    
      if (existingReverse) {
        const { error: reverseUpdateError } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .match({ user_id: myUserId, friend_id: senderUserId });
    
        if (reverseUpdateError) {
          setIsLoading(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('friends')
          .insert({ user_id: myUserId, friend_id: senderUserId, status: 'accepted' });
    
        if (insertError) {
          setIsLoading(false);
          return;
        }
      }

      setIncomingRequests(prev => prev.filter(req => req.user_id !== senderUserId));
      
      if (onResponded) onResponded();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (senderUserId) => {
    try {
      setIsLoading(true);
      // eslint-disable-next-line no-unused-vars
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
  
      const myUserId = user.id;
  
      const { error: rejectError } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .match({ user_id: senderUserId, friend_id: myUserId });
  
      if (rejectError) {
        setIsLoading(false);
        return;
      }
      
      const { data: outgoingRequest, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', myUserId)
        .eq('friend_id', senderUserId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching outgoing request:', fetchError);
      } else if (outgoingRequest && outgoingRequest.status === 'pending') {
        const { error: updateError } = await supabase
          .from('friends')
          .update({ status: 'rejected' })
          .match({ user_id: myUserId, friend_id: senderUserId });
          
        if (updateError) {
          console.error('Error updating friend status:', updateError);
        }
      }
  
      setIncomingRequests(prev => prev.filter(req => req.user_id !== senderUserId));
      
      if (onResponded) onResponded();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOutgoing = async (recipientUserId) => {
    try {
      setIsLoading(true);
      // eslint-disable-next-line no-unused-vars
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
  
      const myUserId = user.id;
  
      const { error: cancelError } = await supabase
        .from('friends')
        .delete()
        .match({ user_id: myUserId, friend_id: recipientUserId });
  
      if (cancelError) {
        setIsLoading(false);
        return;
      }
      
      setOutgoingRequests(prev => prev.filter(req => req.friend_id !== recipientUserId));
      
      if (onResponded) onResponded();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div style={{ 
      padding: '1rem',
      color: '#94a3b8',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      Loading requests...
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h4 style={{ 
          fontSize: "0.9rem", 
          color: "#94a3b8", 
          marginBottom: "0.5rem", 
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          Incoming Requests
        </h4>
        
        {incomingRequests.length === 0 ? (
          <div style={{ 
            padding: '1rem',
            color: '#94a3b8',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            No incoming friend requests
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {incomingRequests.map((req) => (
              <div
                key={req.user_id}
                style={{
                  padding: "1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
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
                    {req.senderUsername ? req.senderUsername[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "500", fontSize: "0.95rem" }}>
                      {req.senderUsername}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleAccept(req.user_id)}
                    style={{
                      padding: "0.5rem",
                      backgroundColor: "rgba(74, 222, 128, 0.1)",
                      color: "#4ade80",
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
                      e.currentTarget.style.backgroundColor = "rgba(74, 222, 128, 0.2)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "rgba(74, 222, 128, 0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Check size={16} />
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.user_id)}
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
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h4 style={{ 
          fontSize: "0.9rem", 
          color: "#94a3b8", 
          marginBottom: "0.5rem", 
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          Outgoing Requests
        </h4>
        
        {outgoingRequests.length === 0 ? (
          <div style={{ 
            padding: '1rem',
            color: '#94a3b8',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            No outgoing friend requests
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {outgoingRequests.map((req) => (
              <div
                key={req.friend_id}
                style={{
                  padding: "1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
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
                    backgroundColor: "#64748b",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.1rem",
                    fontWeight: "500"
                  }}>
                    {req.recipientUsername ? req.recipientUsername[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "500", fontSize: "0.95rem" }}>
                      {req.recipientUsername}
                    </div>
                    <div style={{ 
                      color: "#94a3b8", 
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      marginTop: "0.25rem"
                    }}>
                      <Clock size={14} />
                      Pending
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelOutgoing(req.friend_id)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "rgba(148, 163, 184, 0.1)",
                    color: "#94a3b8",
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
                    e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
