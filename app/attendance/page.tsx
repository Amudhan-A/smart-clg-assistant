"use client";

import { useAuth } from "@/context/AuthContext";
import AttendanceOverview from "@/components/attendance/attendanceOverview";
import InitAttendanceForm from "@/components/attendance/InitAttendanceForm";

export default function AttendancePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="text-gray-600 mt-2">
          Please log in to access attendance tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-10 text-black">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-gray-600 mt-1">
          Track your classes, attendance percentage, and bunk limits.
        </p>
      </div>

      <InitAttendanceForm />
      <AttendanceOverview />
    </div>
  );
}
