import {useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import {supabase} from '../supabaseAPI';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {data: {user}} = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  return user ? children : <Navigate to = "/login" />;
}
