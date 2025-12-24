'use client'

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';


export default function Home() {
  const features = [
    {
      title: 'Attendance Tracker',
      description: 'Keep track of your class attendance and ensure you never miss important sessions.',
      href: '/attendance',
      icon: '📊',
    },
    {
      title: 'Brain Quiz',
      description: 'Test your knowledge with AI-generated quizzes tailored to your courses.',
      href: '/quiz',
      icon: '🧠',
    },
    {
      title: 'AI Assistant',
      description: 'Get instant help with your coursework from our intelligent AI assistant.',
      href: '/assistant',
      icon: '🤖',
    },
    {
      title: 'Classes',
      description: 'Manage your class schedule, assignments, and course materials in one place.',
      href: '/classes',
      icon: '📚',
    },
  ];

  
const { user, loading } = useAuth();    
console.log(user, loading);   

  return (
    <main className="min-h-screen bg-gradient-to-br text-white bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold  mb-4">
            ACADEX - AI 
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your all-in-one platform for managing academic life. Track attendance, test your knowledge,
            get AI assistance, and organize your classes effortlessly.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto ">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform "
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                {feature.title}
              </h2>
              <p className="text-gray-600">
                {feature.description}
              </p>
              <div className="mt-4 text-indigo-600 font-medium flex items-center">
                Get Started
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Powered by AI to make your academic journey smoother</p>
        </div>
      </div>
    </main>
  );
}
