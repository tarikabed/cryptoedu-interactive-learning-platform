import { useEffect, useState } from 'react'
import { supabase } from '../supabaseAPI'

export default function PendingFriendRequests({ onResponded }) {
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
    
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found:', userError)
        setIsLoading(false)
        return
      }
    
      // Fetch incoming requests
      const { data: incomingData } = await supabase
        .from('friends')
        .select('user_id, status, profiles:user_id(id, full_name, email)')
        .eq('friend_id', user.id)
        .eq('status', 'pending')
    
      // Fetch outgoing requests
      const { data: outgoingData } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
    
      setIncomingRequests(incomingData || [])
      setOutgoingRequests(outgoingData || [])
      setIsLoading(false)
    }
  
    fetchData()
  }, [onResponded])

  const handleAccept = async (senderUserId) => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user) {
      console.error('User session error:', error)
      return
    }
  
    const myUserId = user.id
  
    // 1. Update the incoming request to accepted
    const { error: updateError } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .match({ user_id: senderUserId, friend_id: myUserId })
  
    if (updateError) {
      console.error('Failed to accept friend request:', updateError)
      return
    }
  
    // 2. Check if reverse relationship already exists
    const { data: existingReverse, error: fetchError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', myUserId)
      .eq('friend_id', senderUserId)
      .maybeSingle()
  
    if (fetchError) {
      console.error('Error checking reverse friendship:', fetchError)
      return
    }
  
    if (existingReverse) {
      if (existingReverse.status === 'rejected') {
        // 3. If rejected, update to accepted
        const { error: reverseUpdateError } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .match({ user_id: myUserId, friend_id: senderUserId })
  
        if (reverseUpdateError) {
          console.error('Failed to update reverse friendship:', reverseUpdateError)
          return
        }
      }
      // (if already accepted, nothing to do)
    } else {
      // 4. No reverse row exists, insert one
      const { error: insertError } = await supabase
        .from('friends')
        .insert([{ user_id: myUserId, friend_id: senderUserId, status: 'accepted' }])
  
      if (insertError) {
        console.error('Failed to insert reverse friendship:', insertError)
        return
      }
    }
  
    if (onResponded) onResponded()
  }
  
  

  const handleReject = async (senderUserId) => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user) {
      console.error('User session error:', error)
      return
    }

    const myUserId = user.id

    const { error: rejectError } = await supabase
      .from('friends')
      .update({ status: 'rejected' })
      .match({ user_id: senderUserId, friend_id: myUserId })

    if (rejectError) {
      console.error('Failed to reject request:', rejectError)
      return
    }

    if (onResponded) onResponded()
  }

  const handleCancel = async (receiverUserId) => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user) {
      console.error('User session error:', error)
      return
    }

    const myUserId = user.id

    const { error: cancelError } = await supabase
      .from('friends')
      .delete()
      .match({ user_id: myUserId, friend_id: receiverUserId })

    if (cancelError) {
      console.error('Failed to cancel request:', cancelError)
      return
    }

    if (onResponded) onResponded()
  }

  if (isLoading) return <p>Loading requests...</p>

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Incoming Requests</h3>
        {incomingRequests.length === 0 ? (
          <p className="text-gray-500">No incoming requests</p>
        ) : (
          <ul className="space-y-2">
  {incomingRequests.map((req) => (
    <li key={req.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span>
        Request from {req.profiles?.full_name || req.profiles?.email || 'Unknown User'}
      </span>
      <div className="space-x-2">
        <button
          onClick={() => handleAccept(req.user_id)}
          className="text-green-600 hover:underline text-sm"
        >
          Accept
        </button>
        <button
          onClick={() => handleReject(req.user_id)}
          className="text-red-600 hover:underline text-sm"
        >
          Reject
        </button>
      </div>
    </li>
  ))}
</ul>

        )}
      </div>

      <div>
        <h3 className="font-medium mb-2">Outgoing Requests</h3>
        {outgoingRequests.length === 0 ? (
          <p className="text-gray-500">No outgoing requests</p>
        ) : (
          <ul className="space-y-2">
            {outgoingRequests.map((req) => (
              <li key={req.friend_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>Request to {req.friend_id}</span>
                <button
                  onClick={() => handleCancel(req.friend_id)}
                  className="text-gray-600 hover:underline text-sm"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
