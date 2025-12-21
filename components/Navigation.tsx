import Link from 'next/link';

export default function Navigation() {
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
      </div>
    </nav>
  );
}
