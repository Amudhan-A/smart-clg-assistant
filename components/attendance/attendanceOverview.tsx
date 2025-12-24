"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Course = {
  id: string;
  name: string;
  schedule?: Record<string, number>;
  attendanceLog?: Record<string, boolean>;
  attendedClasses?: number;
  totalClasses?: number;
  minAttendance?: number;
};

const getTodayKey = () => {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
};

const getTodayDateKey = () =>
  new Date().toISOString().split("T")[0]; // YYYY-MM-DD

export default function AttendanceOverview() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const today = getTodayKey(); // for testing
  const todayDateKey = getTodayDateKey();
  const { user } = useAuth();

  /* ---------------- FETCH ---------------- */

  const fetchCourses = async () => {
    try {
      const userId = user!.uid;

      const snapshot = await getDocs(
        collection(db, "users", user!.uid, "courses")
      );
      
      const data: Course[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Course, "id">),
      }));

      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(!user) return;
    fetchCourses();
  }, [user]);

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await deleteDoc(doc(db, "users", user!.uid, "courses", courseId));
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  /* ---------------- TOGGLE ATTENDANCE (FIXED) ---------------- */

  const toggleAttendance = async (course: Course) => {
    if (!course.schedule || !course.schedule[today]) return;

    const hours = course.schedule[today];
    const alreadyMarked = course.attendanceLog?.[todayDateKey] === true;

    try {
      const ref = doc(db, "users", user!.uid, "courses", course.id);

      if (alreadyMarked) {
        // UNMARK: Remove both attended AND total hours
        await updateDoc(ref, {
          attendedClasses: increment(-hours),
          totalClasses: increment(-hours),
          [`attendanceLog.${todayDateKey}`]: false,
        });
      } else {
        // MARK: Add both attended AND total hours
        await updateDoc(ref, {
          attendedClasses: increment(hours),
          totalClasses: increment(hours),
          [`attendanceLog.${todayDateKey}`]: true,
        });
      }

      // Instant UI update
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? {
                ...c,
                attendanceLog: {
                  ...c.attendanceLog,
                  [todayDateKey]: !alreadyMarked,
                },
                attendedClasses:
                  (c.attendedClasses ?? 0) + (alreadyMarked ? -hours : hours),
                totalClasses:
                  (c.totalClasses ?? 0) + (alreadyMarked ? -hours : hours),
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to toggle attendance");
    }
  };

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-3"></div>
          <p className="text-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-lg">No courses added yet.</p>
        <p className="text-gray-500 text-sm mt-2">Add your first course above to start tracking attendance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white">Your Courses</h2>
      </div>

      {/* Course Cards */}
      <div className="grid gap-4">
        {courses.map((course) => {
          const schedule = course.schedule ?? {};
          const totalWeeklyHours = Object.values(schedule).reduce(
            (sum, h) => sum + h,
            0
          );

          const attended = course.attendedClasses ?? 0;
          const total = course.totalClasses ?? 0;

          const attendancePercent =
            total === 0 ? 0 : Math.round((attended / total) * 100);

          const minRequired = course.minAttendance ?? 75;
          const isSafe = attendancePercent >= minRequired;

          const minDecimal = minRequired / 100;

          let bunkableHours = Math.floor(attended / minDecimal - total);

          if (bunkableHours < 0) bunkableHours = 0;

          return (
            <div
              key={course.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">{course.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Weekly hours: <span className="font-medium text-gray-300">{totalWeeklyHours} hrs</span>
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(course.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                >
                  Delete
                </button>
              </div>

              {/* Attendance Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${isSafe ? "text-emerald-400" : "text-red-400"}`}>
                    {attendancePercent}%
                  </span>
                  <span className="text-gray-400 text-sm">
                    {attended} / {total} hours attended
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isSafe 
                        ? "bg-gradient-to-r from-emerald-500 to-green-400" 
                        : "bg-gradient-to-r from-red-500 to-orange-400"
                    }`}
                    style={{ width: `${Math.min(attendancePercent, 100)}%` }}
                  />
                </div>

                {/* Bunkable Hours */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isSafe ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}>
                  <svg className={`w-4 h-4 ${isSafe ? "text-emerald-400" : "text-red-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-300">
                    You can bunk <span className="font-semibold text-white">{bunkableHours}</span> more hour{bunkableHours === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Schedule Summary */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(schedule)
                    .filter(([_, hrs]) => hrs > 0)
                    .map(([day, hrs]) => (
                      <span key={day} className="px-2.5 py-1 bg-gray-700 rounded-lg text-xs font-medium text-gray-300">
                        {day}: {hrs}h
                      </span>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WEEKLY TIMETABLE */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white">Weekly Timetable</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 text-sm">
            <thead>
              <tr className="bg-gray-700/50">
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className={`border border-gray-700 px-4 py-3 text-center font-semibold ${
                      day === today 
                        ? "bg-indigo-600 text-white" 
                        : "text-gray-300"
                    }`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                {DAYS.map((day) => (
                  <td
                    key={day}
                    className={`border border-gray-700 px-3 py-3 align-top ${
                      day === today ? "bg-indigo-900/20" : "bg-gray-800/50"
                    }`}
                  >
                    <div className="space-y-2">
                      {courses
                        .filter(
                          (course) =>
                            course.schedule &&
                            course.schedule[day] > 0
                        )
                        .map((course) => {
                          const isMarked = course.attendanceLog?.[todayDateKey];

                          return (
                            <div
                              key={course.id}
                              onClick={() =>
                                day === today && toggleAttendance(course)
                              }
                              className={`rounded-lg px-3 py-2 transition-all ${
                                day !== today
                                  ? "bg-gray-700/50 opacity-60 cursor-not-allowed"
                                  : isMarked
                                  ? "bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-lg shadow-emerald-900/50"
                                  : "bg-gray-700 hover:bg-gray-600 cursor-pointer hover:shadow-lg"
                              }`}
                            >
                              <div className="font-medium text-white text-sm">{course.name}</div>
                              <div className="text-xs text-gray-300 mt-0.5">
                                {course.schedule?.[day]} hrs
                              </div>
                              {day === today && isMarked && (
                                <div className="flex items-center gap-1 mt-1">
                                  <svg className="w-3 h-3 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs text-emerald-200">Attended</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {courses.filter(
                        (course) =>
                          course.schedule &&
                          course.schedule[day] > 0
                      ).length === 0 && (
                        <div className="text-center py-4">
                          <span className="text-gray-600 text-sm">No classes</span>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}