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
import { db, auth } from "@/src/lib/firebase";

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

  /* ---------------- FETCH ---------------- */

  const fetchCourses = async () => {
    try {
      const userId = auth.currentUser?.uid ?? "dev-user";

      const q = query(
        collection(db, "courses"),
        where("userId", "==", userId)
      );

      const snapshot = await getDocs(q);

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
    fetchCourses();
  }, []);

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
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
    const alreadyMarked =
      course.attendanceLog?.[todayDateKey] === true;

    try {
      const ref = doc(db, "courses", course.id);

      if (alreadyMarked) {
        // UNMARK: class still happened, student didn’t attend
        await updateDoc(ref, {
          attendedClasses: increment(-hours),
          [`attendanceLog.${todayDateKey}`]: false,
        });
      } else {
        // MARK: first time today → class happened + student attended
        await updateDoc(ref, {
          attendedClasses: increment(hours),
          totalClasses: increment(hours),
          [`attendanceLog.${todayDateKey}`]: true,
        });
      }

      // instant UI update
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
                  (c.attendedClasses ?? 0) +
                  (alreadyMarked ? -hours : hours),
                totalClasses:
                  c.totalClasses ??
                  (!alreadyMarked ? hours : c.totalClasses),
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

  if (loading) return <p className="text-gray-500">Loading courses...</p>;
  if (courses.length === 0)
    return <p className="text-gray-500">No courses added yet.</p>;

  return (
    <div className="space-y-4">
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

        let bunkableHours = Math.floor(
        attended / minDecimal - total
        );

        if (bunkableHours < 0) bunkableHours = 0;


        return (
          <div
            key={course.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-start"
          >
            <div>
              <h3 className="text-lg font-semibold">{course.name}</h3>

              <p className="text-gray-600">
                Weekly hours:{" "}
                <span className="font-medium">{totalWeeklyHours} hrs</span>
              </p>

              <p
                className={`mt-1 text-sm font-medium ${
                  isSafe ? "text-green-600" : "text-red-600"
                }`}
              >
                Attendance: {attendancePercent}%
              </p>

              <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isSafe ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${attendancePercent}%` }}
                />
              </div>

              <p className="mt-2 text-sm text-gray-700">
                You can bunk{" "}
                <span className="font-semibold">
                    {bunkableHours}
                </span>{" "}
                more hour{bunkableHours === 1 ? "" : "s"}
                </p>


            
              <div className="mt-2 text-sm text-gray-500">
                {Object.entries(schedule)
                  .filter(([_, hrs]) => hrs > 0)
                  .map(([day, hrs]) => (
                    <span key={day} className="mr-3">
                      {day}: {hrs}h
                    </span>
                  ))}
              </div>
            </div>

            <button
              onClick={() => handleDelete(course.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        );
      })}

      {/* WEEKLY TIMETABLE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Weekly Timetable</h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className={`border px-3 py-2 ${
                      day === today ? "bg-indigo-200 font-semibold" : ""
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
                    className={`border px-3 py-2 align-top ${
                      day === today ? "bg-indigo-100" : ""
                    }`}
                  >
                    {courses
                      .filter(
                        (course) =>
                          course.schedule &&
                          course.schedule[day] > 0
                      )
                      .map((course) => {
                        const isMarked =
                          course.attendanceLog?.[todayDateKey];

                        return (
                          <div
                            key={course.id}
                            onClick={() =>
                              day === today && toggleAttendance(course)
                            }
                            className={`mb-2 rounded-lg px-2 py-1 transition-all cursor-pointer
                              ${
                                day !== today
                                  ? "bg-gray-100 opacity-60 cursor-not-allowed"
                                  : isMarked
                                  ? "bg-green-200"
                                  : "bg-indigo-50 hover:-translate-y-0.5"
                              }
                            `}
                          >
                            <div className="font-medium">{course.name}</div>
                            <div className="text-xs text-gray-600">
                              {course.schedule?.[day]} hrs
                            </div>
                          </div>
                        );
                      })}

                    {courses.filter(
                      (course) =>
                        course.schedule &&
                        course.schedule[day] > 0
                    ).length === 0 && (
                      <span className="text-gray-400">–</span>
                    )}
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
