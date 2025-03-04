USE CryptoEdu;


CREATE TABLE Users (
    Username VARCHAR(255) PRIMARY KEY,
    Password VARCHAR(255) NOT NULL,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    DOB DATE,
    EmailAddress VARCHAR(255) UNIQUE NOT NULL,
    Experience ENUM('beginner', 'intermediate', 'expert') NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastLogin TIMESTAMP,
    Status ENUM('active', 'inactive') DEFAULT 'active',
    ProfilePicture VARCHAR(255)
);

-- TradingTransactions Table
CREATE TABLE TradingTransactions (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Asset VARCHAR(100) NOT NULL,
    Username VARCHAR(255) NOT NULL,
    UnitsBought DECIMAL(15, 2) NOT NULL,
    CurrentValueOfAsset DECIMAL(15, 2) NOT NULL,
    Total DECIMAL(15, 2) AS (UnitsBought * CurrentValueOfAsset) STORED,
    TransactionType ENUM('buy', 'sell') NOT NULL,
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TransactionFee DECIMAL(15, 2) DEFAULT 0.0,
    FOREIGN KEY (Username) REFERENCES Users(Username)
);