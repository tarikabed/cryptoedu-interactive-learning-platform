import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseAPI';
import { useTheme } from '../components/ThemeContext';
import { AuthContext } from '../AuthContext';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isInstantLogin, setIsInstantLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { colors } = useTheme();
  const { user, loading: authLoading } = useContext(AuthContext);

  // Check if we should show signup form based on URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signup') === 'true') {
      setIsLoginMode(false);
    }
  }, [location]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Only redirect if we have confirmed there is a valid user session
      if (user && !authLoading) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate('/home');
        }
      }
    };
    
    checkAndRedirect();
  }, [user, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data?.user) {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };  const handleInstantLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Email is required');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      });

      if (error) throw error;
        alert('Instant login link has been sent to your email.');
      setIsInstantLogin(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Username is required');
      setLoading(false);
      return;
    }

    try {
      // First check if username is already taken
      const { data: existingUsername } = await supabase
        .from('user_usernames')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Sign up the user
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signupError) throw signupError;

      // Create username entry
      if (signupData?.user) {
        const { error: usernameError } = await supabase
          .from('user_usernames')
          .insert([{
            user_id: signupData.user.id,
            username: username.trim()
          }]);

        if (usernameError) throw usernameError;        // Initialize user_stats with all necessary fields
        const { error: statsError } = await supabase
          .from('user_stats')
          .insert([{
            user_id: signupData.user.id,
            cryptobux_balance: 100000.00,
            streak_count: 0,
            total_xp: 0,
            last_login_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (statsError) throw statsError;
      }

      setIsLoginMode(true);
      alert('Signup successful! Please check your email to verify your account.');
    } catch (err) {
      if (!err.message.includes('schema cache')){
        setErrorMsg(err.message);
      } else {
        setIsLoginMode(true);
        alert('Signup successful! Please check your email to verify your account.')
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    marginBottom: '1rem',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: colors.text,
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    backdropFilter: 'blur(10px)',
    '&:focus': {
      borderColor: colors.primary,
      boxShadow: `0 0 0 2px ${colors.primary}30`
    }
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: colors.primary,
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backgroundImage: 'linear-gradient(135deg, #B1FEDD 0%, #8ce6c3 100%)',
    boxShadow: '0 4px 12px rgba(177, 254, 221, 0.3)',
    marginBottom: '1rem',
    opacity: loading ? 0.7 : 1,
    transform: loading ? 'scale(0.98)' : 'scale(1)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: `linear-gradient(135deg, ${colors.background} 0%, #1a1a2e 100%)`,
      position: 'relative',
      overflow: 'hidden',
      margin: 0
    }}>
      {/* Blur circles for background effect */}
      <div style={{
        position: 'absolute',
        width: '40vh',
        height: '40vh',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(177, 254, 221, 0.1) 0%, rgba(177, 254, 221, 0) 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-80%, -80%)',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '50vh',
        height: '50vh',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(177, 254, 221, 0.1) 0%, rgba(177, 254, 221, 0) 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-20%, -20%)',
        filter: 'blur(60px)',
        zIndex: 0
      }} />

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        padding: '2.5rem',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeIn 0.5s ease-out',
        margin: '0 auto'
      }}>        <h2 style={{
          color: colors.text,
          fontSize: '2.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'        }}>
          {isInstantLogin ? 'Instant Login' : (isLoginMode ? 'Welcome Back' : 'Create Account')}
        </h2>{errorMsg && (
          <div style={{
            color: '#ef4444',
            marginBottom: '1.5rem',
            textAlign: 'center',
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            {errorMsg}
          </div>
        )}
          {isInstantLogin && (
          <div style={{
            color: colors.textMuted,
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.95rem'
          }}>
            Enter your email address and we'll send you a link to instantly sign in to your account.
          </div>
        )}

        {!isLoginMode && (
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username" 
            required
            style={inputStyle}
          />        )}        <input 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email" 
          required
          style={inputStyle}
        />
          {!isInstantLogin && (
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            placeholder="Password" 
            required
            style={inputStyle}
          />
        )}        <button 
          onClick={isInstantLogin ? handleInstantLogin : (isLoginMode ? handleLogin : handleSignup)}
          disabled={loading}
          style={buttonStyle}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = loading ? 'scale(0.98)' : 'scale(1)'}
        >          {loading ? (            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span className="loading-spinner"></span>
              {isInstantLogin ? 'Sending...' : (isLoginMode ? 'Logging in...' : 'Signing up...')}
            </span>
          ) : (
            isInstantLogin ? 'Send Login Link' : (isLoginMode ? 'Login' : 'Sign Up')
          )}</button>
            {isLoginMode && !isInstantLogin && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <button
              onClick={() => setIsLoginMode(false)}
              style={{
                color: '#B1FEDD',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(177, 254, 221, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Create an account
            </button>            <button
              onClick={() => setIsInstantLogin(true)}
              style={{
                color: '#B1FEDD',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(177, 254, 221, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Instant Login
            </button>
          </div>
        )}        <div style={{
          display: 'flex',
          justifyContent: 'center',
          color: colors.textMuted,
          fontSize: '0.95rem',
          marginTop: '1rem'
        }}>
          {!isLoginMode && (
            <button
              onClick={() => setIsLoginMode(true)}
              style={{
                color: '#B1FEDD',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(177, 254, 221, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Sign in instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
