"use client";

import { useAuth } from "@/context/AuthContext";
import AttendanceOverview from "@/components/attendance/attendanceOverview";
import InitAttendanceForm from "@/components/attendance/InitAttendanceForm";

export default function AttendancePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-gray-300 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-gray-400">
            Please log in to access attendance tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white">Attendance</h1>
          </div>
          <p className="text-gray-400 text-lg ml-15">
            Track your classes, attendance percentage, and bunk limits.
          </p>
        </div>

        {/* Split Layout: Form Left, Overview Right with Scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE: Add Course Form */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-xl h-fit">
            <InitAttendanceForm />
          </div>

          {/* RIGHT SIDE: Course Overview with Scrollbar */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
            <div className="h-190 overflow-y-auto p-6 sm:p-8">
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: #1f2937;
                  border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #4b5563;
                  border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #6b7280;
                }
              `}</style>
              <AttendanceOverview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}