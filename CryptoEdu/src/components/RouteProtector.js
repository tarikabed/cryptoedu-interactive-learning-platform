import {useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import {supabase} from '../supabaseAPI';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get both user and session
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Only set user if we have both valid user and session
        if (user && session?.user?.id === user.id) {
          setUser(user);
        } else {
          // If no valid session, sign out to clean up any stale state
          await supabase.auth.signOut();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a2e'
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
