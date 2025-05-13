import React, { useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseAPI';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, HelpCircle, BookOpen, AlertTriangle, Info } from 'lucide-react';

function TraderPanel({ selectedCoin, currentPrice, bidPrice, askPrice }) {
    const [transactionType, setTransactionType] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [balance, setBalance] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [isPortfolioExpanded, setIsPortfolioExpanded] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [showTaxInfo, setShowTaxInfo] = useState(false);
    const [showFeeInfo, setShowFeeInfo] = useState(false);
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Trading fee percentage
    const tradingFeePercentage = 0.25;
    
    // UK CGT annual tax-free allowance (for 2023/2024)
    const ukTaxFreeAllowance = 3000;
    // UK CGT rate for basic rate taxpayers
    const basicCGTRate = 10;
    // UK CGT rate for higher rate taxpayers
    const higherCGTRate = 20;    // Calculate trading fee and other values based on quantity and price
    const calculateTotalCost = () => {
        const basePrice = (transactionType === 'buy' ? askPrice : bidPrice) || 0;
        const baseAmount = basePrice * (parseFloat(quantity) || 0);
        const tradingFee = baseAmount * (tradingFeePercentage / 100);
        const subtotal = baseAmount;
        
        // Rough UK CGT calculation (simplified for educational purposes)
        let estimatedCGT = 0;
        if (transactionType === 'sell' && baseAmount > ukTaxFreeAllowance) {
            // This is just a simple example calculation
            estimatedCGT = (baseAmount - ukTaxFreeAllowance) * (higherCGTRate / 100);
        }
        
        return {
            baseAmount,
            tradingFee,
            subtotal,
            estimatedCGT: estimatedCGT > 0 ? estimatedCGT : 0,
            total: transactionType === 'buy' 
                ? baseAmount + tradingFee 
                : baseAmount - tradingFee
        };
    };

    // Format price with proper number formatting
    const formatPrice = (price) => {
        return price ? price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) : '0.00';
    };    useEffect(() => {
        if (!user) return;

        const fetchBalanceAndPortfolio = async () => {
            try {
                // Get balance from user_stats table where cryptobux_balance is stored
                const { data: userStatsData, error: userStatsError } = await supabase
                    .from('user_stats')
                    .select('cryptobux_balance')
                    .eq('user_id', user.id)
                    .single();

                if (userStatsError) {
                    console.error('Error fetching balance:', userStatsError);
                    return;
                }

                if (userStatsData) {
                    console.log('Balance data fetched:', userStatsData);
                    setBalance(userStatsData.cryptobux_balance);
                } else {
                    console.warn('No balance data found for user');
                }

                const { data: portfolioData, error: portfolioError } = await supabase
                    .from('user_portfolios')
                    .select('*')
                    .eq('user_id', user.id);

                if (portfolioError) {
                    console.error('Error fetching portfolio:', portfolioError);
                    return;
                }

                if (portfolioData) {
                    console.log('Portfolio data fetched:', portfolioData);
                    setPortfolio(portfolioData);
                } else {
                    console.warn('No portfolio data found for user');
                }
            } catch (err) {
                console.error('Error fetching balance and portfolio:', err);
            }
        };

        fetchBalanceAndPortfolio();
    }, [user]);    const handleTransaction = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const price = transactionType === 'buy' ? askPrice : bidPrice;
            const totalAmount = price * parseFloat(quantity);

            // Check if user has enough balance for buying
            if (transactionType === 'buy' && totalAmount > balance) {
                throw new Error('Insufficient CryptoBux balance');
            }

            // Start transaction
            const { error: trxError } = await supabase.rpc('execute_trade', {
                p_user_id: user.id,
                p_coin_symbol: selectedCoin.toLowerCase(),
                p_transaction_type: transactionType,
                p_quantity: parseFloat(quantity),
                p_price_per_coin: price,
                p_total_amount: totalAmount
            });

            if (trxError) throw trxError;

            // Refresh user stats to get updated balance
            const { data: userStatsData, error: userStatsError } = await supabase
                .from('user_stats')
                .select('cryptobux_balance')
                .eq('user_id', user.id)
                .single();

            if (userStatsError) {
                console.error('Error fetching updated balance:', userStatsError);
            } else if (userStatsData) {
                setBalance(userStatsData.cryptobux_balance);
            }

            // Refresh portfolio data
            const { data: portfolioData } = await supabase
                .from('user_portfolios')
                .select('*')
                .eq('user_id', user.id);

            if (portfolioData) {
                setPortfolio(portfolioData);
            }

            setSuccess(`Successfully ${transactionType === 'buy' ? 'bought' : 'sold'} ${quantity} ${selectedCoin}`);
            setQuantity('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle authentication states
    if (!loading && !user) {
        navigate('/login');
        return null;
    }

    if (loading) {
        return <div style={{ 
            padding: '2rem',
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            height: "100%"
        }}>
            <div style={{
                width: "30px",
                height: "30px",
                border: "3px solid rgba(59, 130, 246, 0.3)",
                borderTop: "3px solid #3b82f6",
                borderRadius: "50%",
                marginBottom: "1rem",
                animation: "spin 1s linear infinite",
            }}></div>
            Loading...
        </div>;
    }

    if (!selectedCoin) {
        return (
            <div style={{ 
                padding: '1.5rem',
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                height: "fit-content",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                textAlign: 'center'
            }}>
                <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "1rem"
                }}>Select a coin to start trading</h2>
                <p style={{ color: '#94a3b8' }}>
                    Choose a cryptocurrency from the available markets to view its chart and trade.
                </p>
            </div>
        );
    }

    const costDetails = calculateTotalCost();

    return (
        <div style={{ 
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "1.5rem",
            height: 'fit-content',
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background gradient accent */}
            <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "120px",
                height: "120px",
                borderRadius: "0 0 0 100%",
                background: "linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))",
                opacity: 0.6,
                zIndex: 0
            }} />
            
            {/* Balance Display */}
            <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ 
                            color: '#94a3b8', 
                            marginBottom: '0.25rem', 
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem' 
                        }}>
                            <Wallet size={16} /> Available CryptoBux
                        </div>                        <div style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: '600',
                            background: "linear-gradient(to right, #4ade80, #3b82f6)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent", 
                        }}>
                            ${balance !== null ? balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsPortfolioExpanded(!isPortfolioExpanded)}
                        style={{
                            padding: '0.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.75rem',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        {isPortfolioExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                {/* Expandable Portfolio Summary */}
                {isPortfolioExpanded && portfolio && (
                    <div style={{ 
                        marginTop: '1rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingTop: '1rem'
                    }}>
                        <div style={{ marginBottom: '0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            Portfolio Summary
                        </div>
                        {portfolio.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                No holdings yet. Start trading to build your portfolio!
                            </div>
                        ) : (
                            portfolio.map(holding => (
                                <div 
                                    key={holding.coin_symbol}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <div>
                                        <div style={{ color: 'white' }}>{holding.coin_symbol.toUpperCase()}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                            {holding.quantity} tokens
                                        </div>
                                    </div>                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'white' }}>
                                            ${(holding.quantity * holding.average_buy_price).toLocaleString()}
                                        </div>
                                        {/* PnL display removed to fix NaN issue */}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600',
                marginBottom: '1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                position: 'relative',
                zIndex: 1
            }}>
                <DollarSign size={20} />
                Trading Panel
            </h2>
            
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    transition: 'transform 0.2s ease',
                }}>                    <div style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Bid Price</div>
                    <div style={{ fontSize: '1.25rem', color: '#ef4444', fontWeight: '600' }}>
                        ${bidPrice != null ? bidPrice.toLocaleString() : '0.00'}
                    </div>
                </div>
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    transition: 'transform 0.2s ease',
                }}>                    <div style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Ask Price</div>
                    <div style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: '600' }}>
                        ${askPrice != null ? askPrice.toLocaleString() : '0.00'}
                    </div>
                </div>
            </div>

            <form onSubmit={handleTransaction}>
                <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        padding: '0.25rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <button
                            type="button"
                            onClick={() => setTransactionType('buy')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: transactionType === 'buy' ? 
                                    'linear-gradient(135deg, #10b981, #3b82f6)' : 'transparent',
                                color: transactionType === 'buy' ? 'white' : '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <TrendingUp size={16} /> Buy
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransactionType('sell')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: transactionType === 'sell' ? 
                                    'linear-gradient(135deg, #ef4444, #f97316)' : 'transparent',
                                color: transactionType === 'sell' ? 'white' : '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <TrendingDown size={16} /> Sell
                        </button>
                    </div>

                    <label style={{ display: 'block', marginBottom: '1.5rem' }}>
                        <div style={{ marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Quantity</div>
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            step="0.000001"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.75rem',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                            required
                        />
                    </label>

                    {/* Transaction Summary Panel */}
                    <div style={{ 
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(30, 30, 40, 0.5)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{ 
                            color: '#94a3b8', 
                            marginBottom: '1rem', 
                            fontSize: '0.9rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            paddingBottom: '0.5rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Info size={16} /> Transaction Summary
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Subtotal</span>
                            <span style={{ color: 'white', fontWeight: '500' }}>${formatPrice(costDetails.baseAmount)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Trading Fee ({tradingFeePercentage}%)</span>
                                <button 
                                    type="button"
                                    onClick={() => setShowFeeInfo(!showFeeInfo)}
                                    style={{ 
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        color: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <HelpCircle size={14} />
                                </button>
                            </div>
                            <span style={{ color: '#ef4444', fontWeight: '500' }}>${formatPrice(costDetails.tradingFee)}</span>
                        </div>
                        
                        {transactionType === 'sell' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Est. Capital Gains Tax</span>
                                    <button 
                                        type="button"
                                        onClick={() => setShowTaxInfo(!showTaxInfo)}
                                        style={{ 
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                            color: '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <HelpCircle size={14} />
                                    </button>
                                </div>
                                <span style={{ color: '#ef4444', fontWeight: '500' }}>${formatPrice(costDetails.estimatedCGT)}</span>
                            </div>
                        )}
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            marginTop: '1rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600' }}>Total</span>
                            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>
                                ${formatPrice(costDetails.total)}
                            </span>
                        </div>
                    </div>
                    
                    {/* Trading Fee Information */}
                    {showFeeInfo && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: 'rgba(30, 30, 40, 0.7)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={16} color="#3b82f6" />
                                <span style={{ color: '#3b82f6', fontWeight: '600' }}>Crypto Exchange Fees</span>
                            </div>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>
                                Cryptocurrency exchanges charge fees for each transaction. Fee structures vary across platforms but typically include:
                            </p>
                            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                                <li>Trading fees: {tradingFeePercentage}% of transaction value</li>
                                <li>Maker fees: For limit orders adding liquidity (typically lower)</li>
                                <li>Taker fees: For market orders taking liquidity (typically higher)</li>
                                <li>Deposit/withdrawal fees: Fixed or percentage-based</li>
                            </ul>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>
                                Fee rates often depend on your trading volume, with higher-volume traders receiving discounts.
                            </p>
                            <button 
                                type="button" 
                                onClick={() => setShowFeeInfo(false)}
                                style={{
                                    alignSelf: 'flex-end',
                                    background: 'none',
                                    border: 'none',
                                    color: '#3b82f6',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.5rem',
                                    fontWeight: '500'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    )}
                    
                    {/* UK Tax Information */}
                    {showTaxInfo && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: 'rgba(30, 30, 40, 0.7)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={16} color="#3b82f6" />
                                <span style={{ color: '#3b82f6', fontWeight: '600' }}>UK Crypto Tax Guide</span>
                            </div>
                            <div style={{ 
                                padding: '0.75rem', 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertTriangle size={16} color="#ef4444" />
                                <span style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.8rem' }}>
                                    This is a simplified educational overview. Actual tax obligations will vary. Consult a tax professional.
                                </span>
                            </div>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>
                                In the UK, crypto assets are subject to Capital Gains Tax (CGT) when:
                            </p>
                            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                                <li>You sell crypto for fiat money (e.g., GBP)</li>
                                <li>You exchange one cryptocurrency for another</li>
                                <li>You use crypto to buy goods or services</li>
                                <li>You give crypto away to someone (except to a spouse/civil partner)</li>
                            </ul>
                            <p style={{ margin: 0, fontWeight: '500', color: 'white' }}>Key points:</p>
                            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                                <li>Tax-free allowance: £{ukTaxFreeAllowance} per tax year (2023/24)</li>
                                <li>Basic rate taxpayers: {basicCGTRate}% on gains above the allowance</li>
                                <li>Higher/additional rate taxpayers: {higherCGTRate}% on gains above the allowance</li>
                                <li>You must keep detailed records of all crypto transactions</li>
                            </ul>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>
                                Mining and staking rewards are typically subject to Income Tax rather than Capital Gains Tax.
                            </p>
                            <button 
                                type="button" 
                                onClick={() => setShowTaxInfo(false)}
                                style={{
                                    alignSelf: 'flex-end',
                                    background: 'none',
                                    border: 'none',
                                    color: '#3b82f6',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.5rem',
                                    fontWeight: '500'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: transactionType === 'buy' 
                                ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                                : 'linear-gradient(135deg, #ef4444, #f97316)',
                            border: 'none',
                            borderRadius: '0.75rem',
                            color: 'white',
                            cursor: isSubmitting ? 'wait' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = transactionType === 'buy' 
                                    ? '0 8px 16px rgba(16, 185, 129, 0.3)' 
                                    : '0 8px 16px rgba(239, 68, 68, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                        }}
                    >
                        {isSubmitting ? 'Processing...' : (
                            <>
                                {transactionType === 'buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                {transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedCoin.toUpperCase()}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '0.75rem', 
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    borderRadius: '0.75rem', 
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    {success}
                </div>
            )}
        </div>
    );
}

export default TraderPanel;
