import AttendanceOverview from "@/components/attendance/attendanceOverview";
import InitAttendanceForm from "@/components/attendance/InitAttendanceForm";

export default function AttendancePage() {
  return (
    <div className="min-h-screen p-8 space-y-10 ">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-gray-600 mt-1">
          Track your classes, attendance percentage, and bunk limits.
        </p>
      </div>

      {/* Initialization form */}
      <div className="bg-gray-600 rounded-xl p-6 shadow text-black">
        <h2 className="text-xl font-semibold mb-4">
          <InitAttendanceForm/>
        </h2>

          <AttendanceOverview/>

        {/* THIS WILL BE A COMPONENT LATER */}
      </div>

      {/* Attendance overview */}
      
    </div>
  );
}
