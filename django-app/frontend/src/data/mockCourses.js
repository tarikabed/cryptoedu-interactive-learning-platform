// src/data/mockCourses.js
import { Book, ShieldCheck, Rocket } from 'lucide-react';

export const courses = [
  {
    id: 1,
    title: "Intro to Trading",
    icon: Book,
    color: "#FEE2E2",
    lessons: [
      { id: 1, title: "What is Cryptocurrency?" },
      { id: 2, title: "Blockchain Basics" },
      { id: 3, title: "Use Cases in Real Life" },
    ],
  },
  {
    id: 2,
    title: "Risk Management",
    icon: ShieldCheck,
    color: "#E0F2FE",
    lessons: [
      { id: 1, title: "Volatility & Scams" },
      { id: 2, title: "Phishing & Rugpulls" },
      { id: 3, title: "UK Tax Laws" },
    ],
  },
  {
    id: 3,
    title: "Smart Investing",
    icon: Rocket,
    color: "#E9D5FF",
    lessons: [
      { id: 1, title: "Diversification" },
      { id: 2, title: "Risk Tolerance" },
      { id: 3, title: "Long-term Strategy" },
    ],
  },
];
