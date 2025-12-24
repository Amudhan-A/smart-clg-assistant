"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type Schedule = Record<string, number>;

export default function InitAttendanceForm() {
  const { user } = useAuth();
  const [courseName, setCourseName] = useState("");
  const [schedule, setSchedule] = useState<Schedule>({
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
  });
  const [minAttendance, setMinAttendance] = useState(75);
  const [loading, setLoading] = useState(false);

  const handleScheduleChange = (day: string, hours: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: hours,
    }));
  };

  const handleSubmit = async () => {
    if(!user) return;

    const totalWeeklyHours = Object.values(schedule).reduce(
      (sum, h) => sum + h,
      0
    );

    if (!courseName || totalWeeklyHours === 0) {
      alert("Please enter course name and at least one class hour");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "users", user!.uid, "courses"), {
        name: courseName,
        schedule,
        minAttendance,
        attendedClasses: 0,
        totalClasses: 0,
        createdAt: new Date(),
      });

      // reset form
      setCourseName("");
      setSchedule({
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
      });
      setMinAttendance(75);

      alert("Course added successfully");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white">Add a Course</h2>
      </div>

      {/* Course name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Course Name
        </label>
        <input
          type="text"
          placeholder="e.g. Mathematics, Physics, Chemistry..."
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Weekly schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Weekly Schedule
        </label>
        
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-12 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-300">{day}</span>
              </div>

              <div className="flex-1 flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={schedule[day]}
                  onChange={(e) =>
                    handleScheduleChange(day, Number(e.target.value))
                  }
                  className="w-20 bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <span className="text-gray-400 text-sm">hours</span>
              </div>

              {/* Visual indicator */}
              <div className="flex gap-1">
                {[...Array(Math.min(schedule[day], 5))].map((_, i) => (
                  <div key={i} className="w-2 h-6 bg-blue-500 rounded-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2 ml-1">
          Total weekly hours: {Object.values(schedule).reduce((sum, h) => sum + h, 0)}
        </p>
      </div>

      {/* Minimum attendance */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Minimum Attendance Target
        </label>
        <div className="relative">
          <input
            type="number"
            min={1}
            max={100}
            value={minAttendance}
            onChange={(e) => setMinAttendance(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
        </div>
        
        {/* Progress bar visualization */}
        <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${minAttendance}%` }}
          ></div>
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : (
          "Add Course"
        )}
      </button>
    </div>
  );
}