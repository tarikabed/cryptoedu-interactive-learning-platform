// src/components/AddFriend.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseAPI'
import { Search, UserPlus, AlertCircle } from 'lucide-react'

export default function AddFriend({ onFriendAdded }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSendingRequest, setIsSendingRequest] = useState(false)

  // Fetch the current user and all usernames on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        
        // Get all usernames except the current user
        const { data: usernamesData, error } = await supabase
          .from('user_usernames')
          .select('user_id, username')
          .neq('user_id', user.id);
          
        if (error) {
          console.error('Error fetching usernames:', error);
        } else if (usernamesData) {
          setAllUsers(usernamesData);
          setFilteredUsers(usernamesData);
        }
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, []);
  
  // Filter users as the search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);
  
  // Handle user selection from dropdown
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.username);
    setShowDropdown(false);
  };
  
  // Send friend request
  const handleAddFriend = async () => {
    if (!selectedUser) {
      setStatusMessage('Please select a user first');
      return;
    }
    
    setIsSendingRequest(true);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('You must be logged in');
      }
      
      // First check if there's already a pending request
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('friend_id', selectedUser.user_id)
        .maybeSingle();
      
      // Skip if already a request
      if (existingRequest) {
        throw new Error('Friend request already sent');
      }
      
      // Send the friend request
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: currentUser.id,
          friend_id: selectedUser.user_id,
          status: 'pending'
        });
      
      if (error) {
        throw new Error('Failed to send request');
      }
      
      setStatusMessage('Friend request sent!');
      setSelectedUser(null);
      setSearchTerm('');
      if (onFriendAdded) onFriendAdded();
    } catch (error) {
      console.error('Error sending friend request:', error);
      setStatusMessage(error.message || 'Failed to send request');
    } finally {
      setIsSendingRequest(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        if (statusMessage.includes('sent')) {
          setStatusMessage('');
        }
      }, 3000);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <div className="search-container" style={{
        position: 'relative',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.5rem 1rem',
        }}>
          <Search size={18} style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by username..."
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              width: '100%',
              padding: '0.5rem 0',
              fontSize: '0.95rem',
              outline: 'none'
            }}
            disabled={isSendingRequest}
          />
        </div>
        
        {showDropdown && filteredUsers.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '0.5rem',
            zIndex: 10,
            backdropFilter: 'blur(10px)'
          }}>
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                onClick={() => handleUserSelect(user)}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ color: 'white', fontWeight: '500' }}>
                  {user.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '500'
            }}>
              {selectedUser.username[0].toUpperCase()}
            </div>
            <span style={{ color: 'white' }}>{selectedUser.username}</span>
          </div>
          
          <button
            onClick={handleAddFriend}
            disabled={isSendingRequest}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: isSendingRequest ? 'rgba(74, 222, 128, 0.5)' : 'rgba(74, 222, 128, 0.1)',
              color: '#4ade80',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isSendingRequest ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={16} />
            {isSendingRequest ? 'Sending...' : 'Add Friend'}
          </button>
        </div>
      )}

      {statusMessage && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          {statusMessage}
        </div>
      )}
      
      {isLoading && (
        <div style={{
          padding: '0.75rem',
          color: '#94a3b8',
          textAlign: 'center'
        }}>
          Loading users...
        </div>
      )}
    </>
  );
}
