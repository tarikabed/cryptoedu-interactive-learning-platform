// src/components/AddFriend.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseAPI'

export default function AddFriend({ onFriendAdded }) {
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingAdd, setLoadingAdd] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user:', error.message)
      }
      if (user) setCurrentUser(user)
    }
    getCurrentUser()
  }, [])

  const handleSearch = async () => {
    setLoadingSearch(true)
    setStatusMessage('')
    setSearchResult(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', searchEmail.trim())
      .single()

    if (error || !data) {
      setSearchResult(null)
      setStatusMessage('User not found.')
    } else {
      setSearchResult(data)
    }
    setLoadingSearch(false)
  }

  const handleAddFriend = async () => {
    if (!currentUser || !searchResult || currentUser.id === searchResult.id) {
      setStatusMessage("Can't add yourself.")
      return
    }
  
    setLoadingAdd(true)
    setStatusMessage('Sending friend request...')
  
    const { data: existing, error: existingError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('friend_id', searchResult.id)
      .maybeSingle()
  
    if (existingError) {
      setStatusMessage('Error checking existing friends.')
      setLoadingAdd(false)
      return
    }
  
    if (existing) {
      if (existing.status === 'pending') {
        setStatusMessage('Friend request already sent. Waiting for acceptance.')
      } else if (existing.status === 'accepted') {
        setStatusMessage('Already added as a friend.')
      } else if (existing.status === 'rejected') {
        // UPDATE the rejected row back to pending
        const { error: updateError } = await supabase
          .from('friends')
          .update({ status: 'pending' })
          .eq('user_id', currentUser.id)
          .eq('friend_id', searchResult.id)
  
        if (updateError) {
          setStatusMessage('Failed to resend friend request.')
        } else {
          setStatusMessage('Friend request resent!')
          if (onFriendAdded) onFriendAdded()
        }
      } else {
        setStatusMessage(`Friend status: ${existing.status}`)
      }
  
      setLoadingAdd(false)
      return
    }
  
    // No existing friend request, safe to insert
    const { error } = await supabase
      .from('friends')
      .insert([{ 
        user_id: currentUser.id, 
        friend_id: searchResult.id,
        status: 'pending' 
      }])
  
    if (error) {
      setStatusMessage('Failed to send friend request.')
    } else {
      setStatusMessage('Friend request sent!')
      setSearchResult(null)
      setSearchEmail('')
      if (onFriendAdded) onFriendAdded()
    }
    setLoadingAdd(false)
  }
  
  

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage])

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-medium mb-2">Add a Friend</h2>
      <div className="flex gap-2">
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Search by email"
          className="border p-2 rounded flex-grow"
          disabled={loadingSearch || loadingAdd}
        />
        <button
          onClick={handleSearch}
          disabled={loadingSearch || !searchEmail.trim()}
          className={`px-4 py-2 rounded ${loadingSearch ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {loadingSearch ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResult && (
        <div className="mt-4 p-2 border rounded flex justify-between items-center">
          <span>
            {searchResult.full_name} ({searchResult.email})
          </span>
          <button
            onClick={handleAddFriend}
            disabled={loadingAdd}
            className="text-green-600 hover:underline"
          >
            {loadingAdd ? 'Sending...' : 'Add Friend'}
          </button>
        </div>
      )}

      {statusMessage && (
        <p className="mt-2 text-sm text-gray-700">{statusMessage}</p>
      )}
    </div>
  )
}
