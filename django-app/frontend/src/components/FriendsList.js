import { useEffect, useState } from 'react'
import { supabase } from '../supabaseAPI'

export default function FriendsList({ refreshTrigger }) {
  const [friends, setFriends] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true)

      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) {
        console.error('getSession error:', sessErr)
        setIsLoading(false)
        return
      }
      const userId = session?.user?.id
      if (!userId) {
        setIsLoading(false)
        return
      }

      const { data: friendRows, error: friendErr } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted')

      if (friendErr) {
        console.error('fetchFriends error:', friendErr)
        setIsLoading(false)
        return
      }

      if (!friendRows || friendRows.length === 0) {
        setFriends([])
        setIsLoading(false)
        return
      }

      const friendIds = [...new Set(friendRows.map(r => r.friend_id))]

      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', friendIds)

      if (profilesErr) {
        console.error('profiles fetch error:', profilesErr)
      } else {
        setFriends(profiles)
      }
      setIsLoading(false)
    }

    fetchFriends()
  }, [refreshTrigger])

  const handleRemoveFriend = async (friendId) => {
    const { data: { session }, error: sessErr } = await supabase.auth.getSession()
    if (sessErr) {
      console.error('Session error:', sessErr)
      return
    }
    const userId = session?.user?.id
    if (!userId) return

    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)

    if (error) {
      console.error('Failed to remove friend:', error)
    } else {
      setFriends(prev => prev.filter(friend => friend.id !== friendId))
    }
  }

  if (isLoading) return <p>Loading friends...</p>

  return (
    <ul className="space-y-2">
      {friends.length === 0 ? (
        <li className="text-gray-500">You have no friends yet.</li>
      ) : (
        friends.map((f) => (
          <li key={f.id} className="flex items-center gap-4 p-2 bg-white rounded shadow">
            
            <div className="flex flex-1 items-center justify-between">
              <span className="font-medium">{f.full_name || f.email || 'Unnamed Friend'}</span>
              <button
                onClick={() => handleRemoveFriend(f.id)}
                className="text-red-600 hover:underline text-sm ml-4"
              >
                Remove
              </button>
            </div>
          </li>
        ))
      )}
    </ul>
  )
}
