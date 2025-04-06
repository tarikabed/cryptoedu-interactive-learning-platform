USE CryptoEdu;


-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    userPassword VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER PROFILES
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    virtual_funds DECIMAL(18,2) DEFAULT 10000,
    userLevel INTEGER DEFAULT 1,
    streak_count INTEGER DEFAULT 0,
    profile_icon VARCHAR(255),
    total_trades INTEGER DEFAULT 0,
    net_profit DECIMAL(18,2) DEFAULT 0,
    last_login_date TIMESTAMP
);

-- TRADES
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    crypto_symbol VARCHAR(10),
    trade_type VARCHAR(10) CHECK (trade_type IN ('buy', 'sell')),
    quantity DECIMAL(18,8),
    price_per_unit DECIMAL(18,8),
    total_value DECIMAL(18,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quest_id INTEGER REFERENCES quests(id)
);

-- PORTFOLIO HOLDINGS
CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    crypto_symbol VARCHAR(10),
    quantity DECIMAL(18,8),
    average_buy_price DECIMAL(18,8)
);

-- QUESTS
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    quest_type VARCHAR(20) CHECK (quest_type IN ('daily', 'investment')),
    goal_description TEXT,
    reward_points INTEGER,
    expires_at TIMESTAMP
);

-- USER QUESTS
CREATE TABLE user_quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    quest_id INTEGER REFERENCES quests(id),
    status VARCHAR(20) CHECK (status IN ('in_progress', 'completed', 'failed')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- ACHIEVEMENTS
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    criteria_description TEXT,
    badge_icon VARCHAR(255)
);

-- USER ACHIEVEMENTS
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    achievement_id INTEGER REFERENCES achievements(id),
    achieved_at TIMESTAMP
);

-- LEADERBOARDS
CREATE TABLE leaderboards (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('daily', 'weekly', 'tournament')),
    start_date DATE,
    end_date DATE
);

-- LEADERBOARD ENTRIES
CREATE TABLE leaderboard_entries (
    id SERIAL PRIMARY KEY,
    leaderboard_id INTEGER REFERENCES leaderboards(id),
    user_id INTEGER REFERENCES users(id),
    score DECIMAL(18,2),
    rank INTEGER
);
