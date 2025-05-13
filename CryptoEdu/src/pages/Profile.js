import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseAPI';
import { Trophy, Users, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import FriendsList from '../components/FriendsList';
import PendingFriendRequests from '../components/PendingFriendRequests';
import AddFriend from '../components/AddFriend';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [portfolio, setPortfolio] = useState({
    totalValue: 0,
    profitLoss: 0,
    cryptobuxBalance: 0,
    assets: []
  });

  // Function to fetch portfolio data
  const fetchPortfolioData = async (userId) => {
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId);

    if (portfolioError) {
      return;
    }

    const { data: statsData } = await supabase
      .from('user_stats')
      .select('cryptobux_balance')
      .eq('user_id', userId)
      .single();

    if (portfolioData && statsData) {
      let totalValue = 0;
      let totalRealizedPnl = 0;
      let totalUnrealizedPnl = 0;

      const { data: marketPrices } = await supabase
        .from('market_prices')
        .select('*');

      const pricesMap = marketPrices?.reduce((acc, curr) => {
        acc[curr.coin_symbol] = curr;
        return acc;
      }, {}) || {};

      const assets = portfolioData
        .filter(holding => holding.quantity > 0)
        .map(holding => {
          const currentPrice = pricesMap[holding.coin_symbol]?.current_price || 0;
          const marketValue = holding.quantity * currentPrice;
          const unrealizedPnl = (currentPrice - holding.average_buy_price) * holding.quantity;
          totalValue += marketValue;
          totalRealizedPnl += holding.realized_pnl;
          totalUnrealizedPnl += unrealizedPnl;

          return {
            name: holding.coin_symbol.toUpperCase(),
            amount: holding.quantity,
            value: marketValue,
            profitLoss: unrealizedPnl + holding.realized_pnl
          };
        });

      setPortfolio({
        totalValue: totalValue + statsData.cryptobux_balance,
        profitLoss: totalRealizedPnl + totalUnrealizedPnl,
        cryptobuxBalance: statsData.cryptobux_balance,
        assets
      });
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: usernameData } = await supabase
          .from('user_usernames')
          .select('username')
          .eq('user_id', user.id)
          .single();
        
        if (usernameData) {
          setProfile({
            username: usernameData.username,
            email: user.email
          });
        } else {
          setProfile({
            username: user.email.split('@')[0],
            email: user.email
          });
        }

        // Initial portfolio fetch
        await fetchPortfolioData(user.id);
        
        // Fetch achievements
        fetchAchievements(user.id);

        // Subscribe to portfolio changes
        const portfolioSubscription = supabase
          .channel('portfolio_changes')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'user_portfolios',
            filter: `user_id=eq.${user.id}`
          }, () => {
            fetchPortfolioData(user.id);
          })
          .subscribe();

        // Subscribe to user_stats changes for balance updates
        const statsSubscription = supabase
          .channel('stats_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_stats',
            filter: `user_id=eq.${user.id}`
          }, () => {
            fetchPortfolioData(user.id);
          })
          .subscribe();

        // Cleanup subscriptions
        return () => {
          portfolioSubscription.unsubscribe();
          statsSubscription.unsubscribe();
        };
      }
    };
    
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch achievements function
  const fetchAchievements = async (userId) => {
    try {
      setLoadingAchievements(true);
      
      // Get all available achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');
      
      if (achievementsError) {
        return;
      }
      
      // Get user's stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('streak_count, total_profit, trades_count, total_xp')
        .eq('user_id', userId)
        .single();
        
      if (statsError && statsError.code !== 'PGRST116') {
        return;
      }
      
      // User stats for calculating progress
      const userStatsData = stats || {
        streak_count: 0,
        total_profit: 0,
        trades_count: 0,
        total_xp: 0
      };
      
      // Get user's unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);
      
      if (userAchievementsError) {
        return;
      }
      
      // Map unlocked achievements
      const unlockedMap = {};
      userAchievements?.forEach(ua => {
        unlockedMap[ua.achievement_id] = {
          unlocked: true,
          unlocked_at: new Date(ua.unlocked_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          unlocked_relative: getRelativeTimeString(new Date(ua.unlocked_at))
        };
      });
      
      // Combine all achievement data with progress
      const combinedAchievements = allAchievements?.map(ach => {
        // If the achievement is already unlocked, set progress to 100%
        if (unlockedMap[ach.id]) {
          return {
            ...ach,
            ...unlockedMap[ach.id],
            progress: 100,
            currentValue: ach.requirement_value
          };
        }
        
        // Calculate progress percentage based on requirement type
        let progress = 0;
        let currentValue = 0;
        let targetValue = ach.requirement_value || 1; // Prevent division by zero
        
        switch(ach.requirement_type) {
          case 'trade_count':
            currentValue = Math.min(userStatsData.trades_count, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'streak_count':
            currentValue = Math.min(userStatsData.streak_count, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'profit':
            currentValue = Math.min(userStatsData.total_profit, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'xp':
            currentValue = Math.min(userStatsData.total_xp, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          default:
            progress = 0;
        }
        
        return {
          ...ach,
          ...unlockedMap[ach.id],
          progress: Math.min(100, Math.round(progress)), // Cap at 100%
          currentValue
        };
      });
      
      setAchievements(combinedAchievements || []);
    } catch (error) {
      // Error silently handled
    } finally {
      setLoadingAchievements(false);
    }
  };

  const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
    return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`;
  };

  // Re-fetch portfolio data every 30 seconds for price updates
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchPortfolioData(user.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);
  const Section = ({ title, icon: Icon, isExpanded, onToggle, children }) => (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      boxShadow: isExpanded ? '0 8px 20px rgba(0, 0, 0, 0.15)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isExpanded ? 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(74, 222, 128, 0.1))' : 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            background: isExpanded ? 'linear-gradient(135deg, #3b82f6, #10b981)' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <Icon size={20} color={isExpanded ? '#fff' : '#94a3b8'} />
          </div>
          <span style={{ 
            fontSize: '1.2rem',
            fontWeight: isExpanded ? '600' : '500',
            color: isExpanded ? 'white' : '#94a3b8',
            transition: 'all 0.3s ease'
          }}>
            {title}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isExpanded && (
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );
  const ProfileHeader = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      marginBottom: '2rem',
      padding: '2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient accent */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "200px",
        height: "200px",
        borderRadius: "0 0 0 100%",
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(74, 222, 128, 0.15))",
        opacity: 0.5,
        zIndex: 0
      }} />
      
      <div style={{
        width: '100px',
        height: '100px',
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        color: 'white',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        {profile?.username?.[0]?.toUpperCase()}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          background: 'linear-gradient(to right, #4ade80, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0'
        }}>
          {profile?.username || 'Loading...'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>{user?.email}</p>
      </div>
    </div>
  );
  const AchievementsSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {loadingAchievements ? (
        <div style={{ 
          textAlign: "center", 
          color: "#94a3b8", 
          padding: "3rem",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderRadius: "1rem"
        }}>
          Loading achievements...
        </div>
      ) : (
        achievements.map((ach) => {
          const isUnlocked = !!ach.unlocked || ach.progress >= 100;
          
          return (
            <div
              key={ach.id}
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '1rem',
                padding: '1.25rem',
                alignItems: 'center',
                opacity: isUnlocked ? 1 : 0.85,
                border: isUnlocked ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isUnlocked ? '0 4px 15px rgba(74, 222, 128, 0.15)' : 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = isUnlocked 
                  ? '0 8px 25px rgba(74, 222, 128, 0.2)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isUnlocked 
                  ? '0 4px 15px rgba(74, 222, 128, 0.15)' 
                  : 'none';
              }}
            >
              {/* Background gradient accent for completed achievements */}
              {isUnlocked && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "150px",
                  height: "150px",
                  borderRadius: "0 0 0 150px",
                  background: "linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(16, 185, 129, 0.05))",
                  opacity: 0.5,
                  zIndex: 0
                }} />
              )}

              {/* Achievement icon */}
              <div style={{ 
                fontSize: '2rem', 
                marginRight: '1.25rem',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: isUnlocked 
                  ? 'rgba(74, 222, 128, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isUnlocked ? '#4ade80' : '#94a3b8',
                position: 'relative',
                boxShadow: isUnlocked 
                  ? '0 4px 12px rgba(74, 222, 128, 0.2)'
                  : 'none',
                zIndex: 1
              }}>
                {ach.badge_icon}
              </div>

              {/* Achievement info */}
              <div style={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: isUnlocked 
                    ? '#4ade80' 
                    : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  marginBottom: '0.375rem'
                }}>
                  {ach.name}
                  {isUnlocked && (
                    <span style={{ 
                      background: 'linear-gradient(90deg, #4ade80, #10b981)',
                      color: '#111', 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '9999px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(74, 222, 128, 0.3)'
                    }}>
                      COMPLETED
                    </span>
                  )}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: isUnlocked ? '#94a3b8' : '#888',
                  lineHeight: '1.4'
                }}>
                  {ach.description}
                </div>
                
                {/* Progress bar for non-completed achievements */}
                {!isUnlocked && (
                  <>
                    <div style={{ 
                      marginTop: '0.75rem',
                      height: '6px',
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${ach.progress}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem', 
                      color: '#94a3b8', 
                      marginTop: '0.375rem' 
                    }}>
                      <div>
                        {ach.requirement_type === 'trade_count' && `${ach.currentValue}/${ach.requirement_value} trades`}
                        {ach.requirement_type === 'streak_count' && `${ach.currentValue}/${ach.requirement_value} days`}
                        {ach.requirement_type === 'profit' && `£${ach.currentValue.toLocaleString()}/${ach.requirement_value.toLocaleString()} profit`}
                        {ach.requirement_type === 'xp' && `${ach.currentValue}/${ach.requirement_value} XP`}
                      </div>
                      <div>{ach.progress}% complete</div>
                    </div>
                  </>
                )}
              </div>

              {/* Status indicator */}
              {isUnlocked && (
                <div style={{ 
                  marginLeft: '1rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    color: "#10b981",
                    fontWeight: "bold",
                    background: "linear-gradient(90deg, rgba(74, 222, 128, 0.15), rgba(16, 185, 129, 0.25))",
                    borderRadius: "9999px",
                    padding: "0.4rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Complete!
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
  const FriendsSection = () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        padding: '1.5rem',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient accent */}
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "150px",
          height: "150px",
          borderRadius: "0 0 0 150px",
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))",
          opacity: 0.5,
          zIndex: 0
        }} />
        
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: 'white',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
          paddingBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4v16m-8-8h16" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Add New Friend
        </h3>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AddFriend onFriendAdded={() => setRefreshTrigger(prev => !prev)} />
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 165, 0, 0.15)',
        padding: '1.5rem',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient accent */}
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "150px",
          height: "150px",
          borderRadius: "0 0 0 150px",
          background: "linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(239, 68, 68, 0.05))",
          opacity: 0.5,
          zIndex: 0
        }} />
        
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: 'white',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
          paddingBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'rgba(255, 165, 0, 0.2)',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14m-7-7v14" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Friend Requests
        </h3>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <PendingFriendRequests onResponded={() => setRefreshTrigger(prev => !prev)} />
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(74, 222, 128, 0.15)',
        padding: '1.5rem',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient accent */}
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "150px",
          height: "150px",
          borderRadius: "0 0 0 150px",
          background: "linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(16, 185, 129, 0.05))",
          opacity: 0.5,
          zIndex: 0
        }} />
        
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: 'white',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(74, 222, 128, 0.15)',
          paddingBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'rgba(74, 222, 128, 0.2)',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Your Friends
        </h3>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <FriendsList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
  const PortfolioSection = () => (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.15))',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            color: '#94a3b8', 
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05rem'
          }}>Total Value</div>
          <div style={{ 
            color: 'white', 
            fontSize: '1.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ 
              background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ${portfolio.totalValue.toLocaleString()}
            </span>
          </div>
          
          {/* Icon */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5h-2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm0 2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2zM5 5h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H5z" fill="#60a5fa"/>
            </svg>
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(126, 34, 206, 0.15))',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            color: '#94a3b8', 
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05rem'
          }}>CryptoBux Balance</div>
          <div style={{ 
            color: 'white', 
            fontSize: '1.75rem',
            fontWeight: '700',
            background: 'linear-gradient(to right, #a855f7, #7e22ce)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ${portfolio.cryptobuxBalance.toLocaleString()}
          </div>
          
          {/* Icon */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V2m0 6a4 4 0 100 8 4 4 0 000-8zm0 8v6" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <div style={{
          background: portfolio.profitLoss >= 0
            ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(16, 185, 129, 0.15))'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(185, 28, 28, 0.15))',
          padding: '1.25rem',
          borderRadius: '16px',
          border: portfolio.profitLoss >= 0
            ? '1px solid rgba(74, 222, 128, 0.2)'
            : '1px solid rgba(239, 68, 68, 0.2)',
          boxShadow: portfolio.profitLoss >= 0
            ? '0 4px 15px rgba(74, 222, 128, 0.1)'
            : '0 4px 15px rgba(239, 68, 68, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            color: '#94a3b8', 
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05rem'
          }}>Total P/L</div>
          <div style={{ 
            fontSize: '1.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: portfolio.profitLoss >= 0
              ? 'linear-gradient(to right, #4ade80, #10b981)'
              : 'linear-gradient(to right, #ef4444, #b91c1c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {portfolio.profitLoss >= 0 ? '+' : ''}${portfolio.profitLoss.toLocaleString()}
          </div>
          
          {/* Icon */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: portfolio.profitLoss >= 0
              ? 'rgba(74, 222, 128, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke={portfolio.profitLoss >= 0 ? "#4ade80" : "#ef4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke={portfolio.profitLoss >= 0 ? "#4ade80" : "#ef4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ 
          color: 'white', 
          fontSize: '1.25rem', 
          marginBottom: '1.25rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 8v16m0-16H8.5m7.5 0h5.5m-13 4H16v12H8.5V12m-5-4V4h5a4 4 0 0 0 0-8H5v8H2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Your Assets
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {portfolio.assets.length === 0 ? (
            <div style={{ 
              color: '#94a3b8', 
              textAlign: 'center', 
              padding: '3rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{
                margin: '0 auto 1rem',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v8m0 0v1m0-1h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontWeight: '600', color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                No Assets Found
              </div>
              You don't have any assets yet. Start trading to build your portfolio!
            </div>
          ) : (
            portfolio.assets.map((asset, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div style={{ 
                    color: 'white', 
                    marginBottom: '0.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '500'
                  }}>
                    {asset.name}
                  </div>
                  <div style={{ 
                    color: '#94a3b8', 
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem' 
                  }}>
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      color: '#60a5fa'
                    }}>
                      {asset.amount.toFixed(8)}
                    </span>
                    tokens
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: 'white', 
                    marginBottom: '0.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '600' 
                  }}>
                    ${asset.value.toLocaleString()}
                  </div>
                  <div style={{ 
                    color: asset.profitLoss >= 0 ? '#4ade80' : '#ef4444',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    justifyContent: 'flex-end',
                    fontWeight: '500'
                  }}>
                    {asset.profitLoss >= 0 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 15l-6-6-6 6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6 6 6-6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {asset.profitLoss >= 0 ? '+' : ''}{asset.profitLoss.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '900px', 
      margin: '0 auto' 
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
      }}>
        <div>
          <h1 style={{ 
            fontSize: "2.5rem", 
            fontWeight: "700", 
            background: "linear-gradient(to right, #4ade80, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 0.5rem 0"
          }}>
            User Profile
          </h1>
          <p style={{ 
            color: "#94a3b8", 
            fontSize: "1.1rem",
            maxWidth: "600px",
            margin: 0
          }}>
            Manage your profile, achievements, friends and portfolio
          </p>
        </div>
      </div>
      
      <ProfileHeader />

      <Section
        title="Achievements"
        icon={Trophy}
        isExpanded={expandedSection === 'achievements'}
        onToggle={() => setExpandedSection(expandedSection === 'achievements' ? null : 'achievements')}
      >
        <AchievementsSection />
      </Section>

      <Section
        title="Friends"
        icon={Users}
        isExpanded={expandedSection === 'friends'}
        onToggle={() => setExpandedSection(expandedSection === 'friends' ? null : 'friends')}
      >
        <FriendsSection />
      </Section>

      <Section
        title="Portfolio"
        icon={Wallet}
        isExpanded={expandedSection === 'portfolio'}
        onToggle={() => setExpandedSection(expandedSection === 'portfolio' ? null : 'portfolio')}
      >
        <PortfolioSection />
      </Section>
    </div>
  );
}