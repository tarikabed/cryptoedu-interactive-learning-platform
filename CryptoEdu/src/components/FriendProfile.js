import { useState, useEffect } from 'react';
import { supabase } from '../supabaseAPI';
import {
  User,
  Award,
  BarChart2,
  BookOpen,
  ChevronLeft,
  DollarSign,
  Briefcase,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';

export default function FriendProfile({ friendId, username, onBack }) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    portfolio: {
      totalValue: 0,
      profitLoss: 0,
      cryptobuxBalance: 0,
      assets: []
    },
    stats: {
      level: 1,
      totalXp: 0,
      tradesCount: 0,
      streakCount: 0,
      totalProfit: 0,
      quizProgress: 0,
      courseProgress: 0,
    },
    achievements: [],
  });

  useEffect(() => {
    const fetchFriendData = async () => {
      setLoading(true);
      try {
        // Fetch user stats
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', friendId)
          .single();

        if (statsError) {
          console.error('Error fetching user stats:', statsError);
        }

        // Fetch portfolio data
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('user_portfolios')
          .select('*')
          .eq('user_id', friendId);

        if (portfolioError) {
          console.error('Error fetching portfolio data:', portfolioError);
        }

        // Fetch user's achievements
        const { data: userAchievements, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', friendId);

        if (userAchievementsError) {
          console.error('Error fetching user achievements:', userAchievementsError);
        }

        // Fetch achievement details
        const achievementIds = userAchievements ? userAchievements.map(a => a.achievement_id) : [];
        let achievementDetails = [];
        
        if (achievementIds.length > 0) {
          const { data: achievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .in('id', achievementIds);

          if (achievementsError) {
            console.error('Error fetching achievements:', achievementsError);
          } else {
            achievementDetails = achievements;
          }
        }

        // Fetch quiz progress
        const { data: quizProgress, error: quizProgressError } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', friendId);

        if (quizProgressError) {
          console.error('Error fetching quiz progress:', quizProgressError);
        }

        // Fetch market prices for portfolio valuation
        const { data: marketPrices } = await supabase
          .from('market_prices')
          .select('*');

        const pricesMap = marketPrices?.reduce((acc, curr) => {
          acc[curr.symbol] = curr.price;
          return acc;
        }, {}) || {};

        // Calculate portfolio total value
        let totalValue = 0;
        let totalUnrealizedPnl = 0;

        const assets = portfolioData
          ?.filter(holding => holding.quantity > 0)
          .map(holding => {
            const currentPrice = pricesMap[holding.coin_symbol] || 0;
            const marketValue = holding.quantity * currentPrice;
            const costBasis = holding.quantity * holding.average_buy_price;
            const unrealizedPnl = marketValue - costBasis;
            
            totalValue += marketValue;
            totalUnrealizedPnl += unrealizedPnl;
            
            return {
              symbol: holding.coin_symbol,
              quantity: holding.quantity,
              averagePrice: holding.average_buy_price,
              currentPrice,
              marketValue,
              unrealizedPnl,
              percentChange: costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0
            };
          }) || [];

        // Update state with all fetched data
        setProfileData({
          portfolio: {
            totalValue: totalValue + (stats?.cryptobux_balance || 0),
            profitLoss: (stats?.total_profit || 0) + totalUnrealizedPnl,
            cryptobuxBalance: stats?.cryptobux_balance || 0,
            assets: assets
          },          stats: {
            level: Math.floor((stats?.total_xp || 0) / 200) + 1,
            totalXp: stats?.total_xp || 0,
            tradesCount: stats?.trades_count || 0,
            streakCount: stats?.streak_count || 0,
            totalProfit: stats?.total_profit || 0,
            quizProgress: quizProgress?.filter(q => q.completed).length || 0,
            courseProgress: stats?.course_progress || 0
          },
          achievements: achievementDetails.map(a => {
            const userAchievement = userAchievements.find(ua => ua.achievement_id === a.id);
            return {
              ...a,
              unlocked: true,
              unlocked_at: userAchievement ? userAchievement.unlocked_at : null
            };
          })
        });
      } catch (error) {
        console.error('Error fetching friend data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (friendId) {
      fetchFriendData();
    }
  }, [friendId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 2
    }).format(value);
  };

  const StatCard = ({ icon: Icon, title, value, color, gradient }) => (
    <div style={{
      background: gradient || 'rgba(255, 255, 255, 0.05)',
      padding: '1.25rem',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      border: `1px solid ${color || 'rgba(255, 255, 255, 0.1)'}`,
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.15)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Background gradient accent */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "150px",
        height: "150px",
        borderRadius: "0 0 0 150px",
        opacity: 0.15,
        background: gradient || 'rgba(255, 255, 255, 0.05)',
        zIndex: 0
      }} />
      
      {/* Icon in styled container */}
      <div style={{ 
        background: `${color}25` || 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <Icon size={22} color={color || 'white'} />
      </div>
      
      {/* Value with white text */}
      <div style={{ 
        fontSize: '1.75rem', 
        fontWeight: '700', 
        color: 'white',
        marginBottom: '0.25rem',
        position: 'relative',
        zIndex: 1
      }}>
        {value}
      </div>
      
      {/* Title */}
      <div style={{ 
        fontSize: '0.9rem', 
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05rem',
        position: 'relative',
        zIndex: 1
      }}>
        {title}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header with back button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#3b82f6',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'white',
          margin: 0
        }}>
          {username}'s Profile
        </h2>
      </div>

      {loading ? (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          color: '#94a3b8',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          Loading profile data...
        </div>
      ) : (
        <>
          {/* Stats Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
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

            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              zIndex: 1,
              color: 'white'
            }}>
              <User size={18} color="#4ade80" />
              Overview
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              position: 'relative',
              zIndex: 1
            }}>
              <StatCard
                icon={GraduationCap}
                title="Level"
                value={profileData.stats.level}
                color="#FFD700"
                gradient="linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 182, 0, 0.15))"
              />
              <StatCard
                icon={TrendingUp}
                title="Profit/Loss"
                value={formatCurrency(profileData.portfolio.profitLoss || 0)}
                color={profileData.portfolio.profitLoss >= 0 ? "#4ade80" : "#ef4444"}
                gradient={profileData.portfolio.profitLoss >= 0 
                  ? "linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(16, 185, 129, 0.15))"
                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.15))"}
              />
              <StatCard
                icon={DollarSign}
                title="Portfolio Value"
                value={formatCurrency(profileData.portfolio.totalValue || 0)}
                color="#3b82f6"
                gradient="linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.15))"
              />
              <StatCard
                icon={Award}
                title="Achievements"
                value={`${profileData.achievements.length}`}
                color="#A78BFA"
                gradient="linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.15))"
              />
            </div>
          </div>

          {/* Trading Stats */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              zIndex: 1,
              color: 'white'
            }}>
              <BarChart2 size={18} color="#ef4444" />
              Trading Stats
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <StatCard
                icon={Briefcase}
                title="Total Trades"
                value={profileData.stats.tradesCount}
                color="#FF6B6B"
                gradient="linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 84, 84, 0.15))"
              />
              <StatCard
                icon={TrendingUp}
                title="Total Profit"
                value={formatCurrency(profileData.stats.totalProfit || 0)}
                color={profileData.stats.totalProfit >= 0 ? "#4ade80" : "#ef4444"}
                gradient={profileData.stats.totalProfit >= 0 
                  ? "linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(16, 185, 129, 0.15))"
                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.15))"}
              />
            </div>
          </div>

          {/* Learning Progress */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              zIndex: 1,
              color: 'white'
            }}>
              <BookOpen size={18} color="#A78BFA" />
              Learning Progress
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <StatCard
                icon={GraduationCap}
                title="XP Points"
                value={profileData.stats.totalXp.toLocaleString()}
                color="#FFD700"
                gradient="linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 182, 0, 0.15))"
              />
              <StatCard
                icon={BookOpen}
                title="Course Progress"
                value={`${profileData.stats.courseProgress}%`}
                color="#A78BFA"
                gradient="linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.15))"
              />
            </div>
          </div>

          {/* Achievements Section */}
          {profileData.achievements.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1.5rem',
              borderRadius: '1rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
                zIndex: 1,
                color: 'white'
              }}>
                <Award size={18} color="#4ade80" />
                Achievements
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
                position: 'relative',
                zIndex: 1
              }}>
                {profileData.achievements.slice(0, 4).map(ach => (
                  <div
                    key={ach.id}
                    style={{
                      display: 'flex',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      alignItems: 'center',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      boxShadow: '0 4px 15px rgba(74, 222, 128, 0.15)',
                      position: 'relative',
                      overflow: 'hidden',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.5rem', 
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(74, 222, 128, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4ade80',
                      boxShadow: '0 4px 12px rgba(74, 222, 128, 0.2)'
                    }}>
                      {ach.badge_icon || '🏆'}
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: '#4ade80',
                        marginBottom: '0.25rem'
                      }}>
                        {ach.name || 'Achievement'}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#94a3b8',
                        lineHeight: '1.4'
                      }}>
                        {ach.description || 'Achievement description'}
                      </div>
                    </div>
                  </div>
                ))}
                {profileData.achievements.length > 4 && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    textAlign: 'center'
                  }}>
                    <Award size={24} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                    <div style={{ fontSize: '0.95rem' }}>
                      +{profileData.achievements.length - 4} more achievements
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portfolio Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              zIndex: 1,
              color: 'white'
            }}>
              <Briefcase size={18} color="#3b82f6" />
              Portfolio
            </h3>
            
            {profileData.portfolio.assets.length > 0 ? (
              <div style={{
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>Coin</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>Avg. Price</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>Value</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.portfolio.assets.map((asset, index) => (
                      <tr 
                        key={asset.symbol}
                        style={{ 
                          borderBottom: index < profileData.portfolio.assets.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', color: 'white', fontWeight: '500' }}>{asset.symbol}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}>
                          {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}>
                          {formatCurrency(asset.averagePrice)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}>
                          {formatCurrency(asset.marketValue)}
                        </td>
                        <td style={{ 
                          padding: '0.75rem 1rem', 
                          textAlign: 'right',
                          color: asset.unrealizedPnl >= 0 ? '#4ade80' : '#ef4444',
                          fontWeight: '500'
                        }}>
                          {formatCurrency(asset.unrealizedPnl)} 
                          <span style={{ fontSize: '0.8rem', marginLeft: '0.25rem', opacity: 0.8 }}>
                            ({asset.percentChange >= 0 ? '+' : ''}{asset.percentChange.toFixed(2)}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'white', fontWeight: '500' }}>CryptoBUX</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}></td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}></td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}>
                        {formatCurrency(profileData.portfolio.cryptobuxBalance)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#94a3b8',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '0.5rem'
              }}>
                No assets in portfolio
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
