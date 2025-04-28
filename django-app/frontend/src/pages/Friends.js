// src/pages/Friends.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseAPI'
import Navbar from '../components/Navbar'
import AddFriend from '../components/AddFriend'
import FriendsList from '../components/FriendsList'
import AllUsersList from '../components/AllUsersList'
import PendingFriendRequests from '../components/PendingFriendRequests'

// src/pages/Friends.jsx
// ... (previous imports remain the same)

export default function Friends() {
  const navigate = useNavigate()
  const [refreshTrigger, setRefreshTrigger] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error fetching session:', error)
        return
      }

      if (!session) {
        navigate('/login')
      }
    }

    fetchSession()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">Friends</h1>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Add Friend</h2>
            <AddFriend onFriendAdded={() => setRefreshTrigger(prev => !prev)} />
          </div>
  
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Friend Requests</h2>
            <PendingFriendRequests onResponded={() => setRefreshTrigger(prev => !prev)} />
          </div>
  
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-medium mb-4">Your Friends</h2>
            <FriendsList refreshTrigger={refreshTrigger} />
          </div>
  
          {/* NEW - All Users List */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-medium mb-4">All Users</h2>
            <AllUsersList />
          </div>
        </div>
      </div>
    </div>
  )
  
}