import {useState} from 'react';
import {supabase} from '../supabaseAPI';
import {useNavigate} from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const {error} = await supabase.auth.signInWithPassword({email, password});
      if (error) throw error;
      else {
        navigate('/');  //Redirect after successful login
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  //Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const {user, error} = await supabase.auth.signUp({email, password});
      if (error) throw error;
      console.log(user);
      setIsLoginMode(true);  //Switch to login after successful signup
      alert('Signup successful! Please check your email to verify.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>{isLoginMode ? 'Login':'Sign Up'}</h2>

      {/* Display error message if any */}
      {errorMsg && <p style={{color:'red'}}>{errorMsg}</p>}

      {/*Credentials*/}
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
        required
      /><br />

      <input 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        type="password" 
        placeholder="Password" 
        required
      /><br />

      {/*Submit button*/}
      <button 
        type="submit" 
        onClick={isLoginMode ? handleLogin : handleSignup} 
        disabled={loading}
      >
        {loading ? (isLoginMode ? 'Logging in...' : 'Signing up...') : (isLoginMode ? 'Login' : 'Sign Up')}
      </button>

      {/*isLoginMode flag for whether they're signing up or making new account*/}
      <p>
        {isLoginMode ? (
          <>
            Don't have an account? <button onClick={() => setIsLoginMode(false)}>Sign up</button>
          </>
        ) : (
          <>
            Already have an account? <button onClick={() => setIsLoginMode(true)}>Login</button>
          </>
        )}
      </p>
    </div>
  );
}
