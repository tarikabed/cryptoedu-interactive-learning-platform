// src/components/AllUsersList.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseAPI'

export default function AllUsersList() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email', { ascending: true })

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data)
      }
    }

    loadUsers()
  }, [])

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-medium mb-2">All Users</h2>
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded"
          >
            <div>
              <span className="font-semibold">{u.full_name || '—'}</span>
              <span className="ml-2 text-sm text-gray-600">{u.email}</span>
            </div>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => navigator.clipboard.writeText(u.id)}
            >
              Copy ID
            </button>
          </li>
        ))}
        {users.length === 0 && <li className="text-gray-500">No users found</li>}
      </ul>
    </div>
  )
}
