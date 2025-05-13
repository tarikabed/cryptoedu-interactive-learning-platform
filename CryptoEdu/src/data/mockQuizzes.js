import { LockKeyhole, Wallet, FileCode2, ChartLine, Globe, PaintBucket, Shield, Calculator, Book, AlertTriangle, BadgePound, Scale, Bank, Target, Lightbulb, History, Network, Key, RefreshCcw, Box } from 'lucide-react';

export const quizTopics = [
  {
    id: 1,
    title: "Blockchain Fundamentals",
    icon: LockKeyhole,
    color: "#FEE2E2",
    description: "Learn the basics of blockchain technology",
    xpReward: 100,
    questions: [
      {
        id: 1,
        question: "What is a blockchain?",
        options: [
          "A type of cryptocurrency",
          "A distributed, immutable ledger",
          "A computer program",
          "A digital wallet"
        ],
        correctAnswer: 1,
        explanation: "A blockchain is a distributed, immutable ledger that securely records transactions across a network of computers."
      },
      {
        id: 2,
        question: "What ensures the security of blockchain transactions?",
        options: [
          "Government regulations",
          "Bank oversight",
          "Cryptographic algorithms",
          "Manual verification"
        ],
        correctAnswer: 2,
        explanation: "Cryptographic algorithms ensure the security and integrity of blockchain transactions."
      },
      {
        id: 3,
        question: "What is a block in blockchain?",
        options: [
          "A unit of cryptocurrency",
          "A collection of validated transactions",
          "A type of digital wallet",
          "A security protocol"
        ],
        correctAnswer: 1,
        explanation: "A block is a collection of validated transactions that are linked together in chronological order."
      }
    ]
  },
  {
    id: 2,
    title: "Crypto Wallets & Security",
    icon: Wallet,
    color: "#E0F2FE",
    description: "Master cryptocurrency wallet security",
    xpReward: 150,
    questions: [
      {
        id: 1,
        question: "What is a private key?",
        options: [
          "A password for your email",
          "A secret code that controls your crypto",
          "A public address",
          "A backup file"
        ],
        correctAnswer: 1,
        explanation: "A private key is a secret code that gives you control over your cryptocurrency."
      },
      {
        id: 2,
        question: "Which is the safest way to store large amounts of cryptocurrency?",
        options: [
          "In an exchange wallet",
          "In a hardware wallet",
          "In a mobile wallet",
          "In a web wallet"
        ],
        correctAnswer: 1,
        explanation: "Hardware wallets provide the highest level of security by keeping your private keys offline."
      },
      {
        id: 3,
        question: "What is a seed phrase?",
        options: [
          "A password for your exchange account",
          "A backup of your private keys",
          "A transaction ID",
          "A wallet address"
        ],
        correctAnswer: 1,
        explanation: "A seed phrase is a series of words that can be used to recover your cryptocurrency wallet if lost or damaged."
      }
    ]
  },
  {
    id: 3,
    title: "Smart Contracts",
    icon: FileCode2,
    color: "#E9D5FF",
    description: "Understand automated blockchain agreements",
    xpReward: 200,
    questions: [
      {
        id: 1,
        question: "What is a smart contract?",
        options: [
          "A legal document",
          "Self-executing code on blockchain",
          "A type of cryptocurrency",
          "A trading strategy"
        ],
        correctAnswer: 1,
        explanation: "Smart contracts are self-executing contracts with terms directly written into code on the blockchain."
      }
    ]
  },
  {
    id: 4,
    title: "Risk Management",
    icon: Shield,
    color: "#FFE4E6",
    description: "Learn to protect your investments",
    xpReward: 250,
    questions: [
      {
        id: 1,
        question: "What is diversification in crypto investing?",
        options: [
          "Buying only Bitcoin",
          "Spreading investments across different assets",
          "Day trading multiple coins",
          "Using multiple exchanges"
        ],
        correctAnswer: 1,
        explanation: "Diversification means spreading your investments across different assets to reduce risk."
      }
    ]
  },
  {
    id: 5,
    title: "Tax Implications",
    icon: Calculator,
    color: "#DBEAFE",
    description: "Understanding cryptocurrency taxes",
    xpReward: 200,
    questions: [
      {
        id: 1,
        question: "When do you need to pay tax on cryptocurrency in the UK?",
        options: [
          "Never",
          "When trading for profit or mining",
          "Only when selling for cash",
          "Only when buying crypto"
        ],
        correctAnswer: 1,
        explanation: "In the UK, you need to pay Capital Gains Tax when you sell crypto for profit, and Income Tax on mining rewards."
      }
    ]
  },
  {
    id: 6,
    title: "Market Analysis",
    icon: ChartLine,
    color: "#F3E8FF",
    description: "Learn to analyze crypto markets",
    xpReward: 200,
    questions: [
      {
        id: 1,
        question: "What is market capitalization?",
        options: [
          "The total value of all coins",
          "The price of one coin",
          "The trading volume",
          "The number of holders"
        ],
        correctAnswer: 0,
        explanation: "Market capitalization is the total value of all coins in circulation, calculated by multiplying the price by the circulating supply."
      }
    ]
  },
  {
    id: 7,
    title: "Regulatory Framework",
    icon: Scale,
    color: "#FFE4E6",
    description: "Learn about crypto regulations",
    xpReward: 175,
    questions: [
      {
        id: 1,
        question: "Which UK body regulates cryptocurrency firms?",
        options: [
          "Bank of England",
          "Financial Conduct Authority (FCA)",
          "HMRC",
          "FSA"
        ],
        correctAnswer: 1,
        explanation: "The FCA regulates cryptocurrency firms in the UK for anti-money laundering purposes."
      }
    ]
  },
  {
    id: 8,
    title: "Scam Prevention",
    icon: AlertTriangle,
    color: "#FEE2E2",
    description: "Identify and avoid crypto scams",
    xpReward: 225,
    questions: [
      {
        id: 1,
        question: "What is a 'pump and dump' scheme?",
        options: [
          "A legitimate trading strategy",
          "A type of market manipulation",
          "A blockchain feature",
          "A mining technique"
        ],
        correctAnswer: 1,
        explanation: "A pump and dump scheme is when a group artificially inflates a coin's price before selling, leaving others with losses."
      }
    ]
  },
  {
    id: 9,
    title: "Investment Strategies",
    icon: Target,
    color: "#E0F2FE",
    description: "Long-term vs short-term investing",
    xpReward: 200,
    questions: [
      {
        id: 1,
        question: "What is 'HODL' in crypto terms?",
        options: [
          "A typo of 'HOLD'",
          "Hold On for Dear Life",
          "A trading platform",
          "A type of token"
        ],
        correctAnswer: 1,
        explanation: "HODL became a popular term meaning to hold onto your crypto long-term, regardless of market conditions."
      }
    ]
  },
  {
    id: 10,
    title: "DeFi Fundamentals",
    icon: Bank,
    color: "#E9D5FF",
    description: "Decentralized Finance basics",
    xpReward: 250,
    questions: [
      {
        id: 1,
        question: "What is yield farming?",
        options: [
          "Mining cryptocurrency",
          "Earning rewards by lending crypto",
          "Trading NFTs",
          "Staking tokens"
        ],
        correctAnswer: 1,
        explanation: "Yield farming involves lending or staking cryptocurrency to earn returns."
      }
    ]
  },
  {
    id: 11,
    title: "NFT Basics",
    icon: PaintBucket,
    color: "#DBEAFE",
    description: "Understanding NFTs",
    xpReward: 150,
    questions: [
      {
        id: 1,
        question: "What does NFT stand for?",
        options: [
          "New Financial Token",
          "Non-Fungible Token",
          "Network File Transfer",
          "Natural Fund Trade"
        ],
        correctAnswer: 1,
        explanation: "NFT stands for Non-Fungible Token, meaning it's unique and can't be replaced with something else of the same value."
      }
    ]
  },
  {
    id: 12,
    title: "Sustainable Crypto",
    icon: Lightbulb,
    color: "#F3E8FF",
    description: "Environmental impact of crypto",
    xpReward: 175,
    questions: [
      {
        id: 1,
        question: "Which consensus mechanism is more energy-efficient?",
        options: [
          "Proof of Work (PoW)",
          "Proof of Stake (PoS)",
          "Proof of Authority",
          "Proof of History"
        ],
        correctAnswer: 1,
        explanation: "Proof of Stake (PoS) is significantly more energy-efficient than Proof of Work."
      }
    ]
  },
  {
    id: 13,
    title: "Crypto History",
    icon: History,
    color: "#FFE4E6",
    description: "Evolution of cryptocurrency",
    xpReward: 150,
    questions: [
      {
        id: 1,
        question: "Who created Bitcoin?",
        options: [
          "Vitalik Buterin",
          "Satoshi Nakamoto",
          "Charlie Lee",
          "Craig Wright"
        ],
        correctAnswer: 1,
        explanation: "Bitcoin was created by an anonymous person or group using the pseudonym Satoshi Nakamoto."
      }
    ]
  },
  {
    id: 14,
    title: "Network Types",
    icon: Network,
    color: "#E0F2FE",
    description: "Understanding blockchain networks",
    xpReward: 200,
    questions: [
      {
        id: 1,
        question: "What is a Layer 2 solution?",
        options: [
          "A new blockchain",
          "A scaling solution built on top of Layer 1",
          "A type of cryptocurrency",
          "A mining protocol"
        ],
        correctAnswer: 1,
        explanation: "Layer 2 solutions are built on top of existing blockchains to improve scalability and reduce fees."
      }
    ]
  },
  {
    id: 15,
    title: "Crypto Security",
    icon: Key,
    color: "#E9D5FF",
    description: "Advanced security practices",
    xpReward: 225,
    questions: [
      {
        id: 1,
        question: "What is Two-Factor Authentication (2FA)?",
        options: [
          "Two passwords",
          "An additional security verification step",
          "A backup system",
          "A type of wallet"
        ],
        correctAnswer: 1,
        explanation: "2FA adds an extra layer of security by requiring a second form of verification beyond your password."
      }
    ]
  }
];