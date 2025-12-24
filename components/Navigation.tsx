'use client'
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';


export default function Navigation() {
  const { user, loading, loginWithGoogle, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex gap-6">
        <Link href="/" className="hover:text-gray-300 transition-colors">
          Home
        </Link>
        <Link href="/classes" className="hover:text-gray-300 transition-colors">
          Classes
        </Link>
        <Link href="/attendance" className="hover:text-gray-300 transition-colors">
          Attendance
        </Link>
        <Link href="/quiz" className="hover:text-gray-300 transition-colors">
          Quiz
        </Link>
        <Link href="/assistant" className="hover:text-gray-300 transition-colors">
          AI Assistant
        </Link>

        {!loading && (
        user ? (
          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-gray-200 ml-auto bg-red-400"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 rounded  text-white ml-auto bg-green-400"
          >
            Login
          </button>
        )
      )}
      </div>
      

    </nav>
  );
}
