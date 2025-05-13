import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      background: 'linear-gradient(to bottom right, #1a1a1a, #2d3748)'
    }}>
      <img 
        src="/images/logo.png" 
        alt="CryptoEdu Logo" 
        style={{
          maxWidth: '400px',
          marginBottom: '1rem'
        }}
      />

      <p style={{
        fontSize: '1.5rem',
        maxWidth: '800px',
        marginBottom: '3rem',
        color: '#cbd5e0',
        lineHeight: '1.6'
      }}>
        We aim to teach young investors about cryptocurrency trading through interactive learning
        and risk-free simulation. Build your knowledge, practice trading, and understand the
        market - all without risking real money.
      </p>

      <div style={{
        display: 'flex',
        gap: '2rem'
      }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            borderRadius: '0.5rem',
            backgroundColor: '#B1FEDD',
            color: 'black',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            boxShadow: '0 4px 6px rgba(177, 254, 221, 0.25)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Login
        </button>

        <button
          onClick={() => navigate('/login?signup=true')}
          style={{
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
            color: 'white',
            border: '2px solid #B1FEDD',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            boxShadow: '0 4px 6px rgba(177, 254, 221, 0.1)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Sign Up
        </button>
      </div>

      <div style={{
        marginTop: '4rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
        maxWidth: '1000px'
      }}>
        <FeatureCard
          icon="🎓"
          title="Learn"
          description="Interactive courses and quizzes to build your knowledge"
        />
        <FeatureCard
          icon="💹"
          title="Practice"
          description="Risk-free trading with virtual currency"
        />
        <FeatureCard
          icon="🏆"
          title="Achieve"
          description="Earn badges and climb the leaderboard"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#cbd5e0' }}>{description}</p>
    </div>
  );
}