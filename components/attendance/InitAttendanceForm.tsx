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
        schedule, // 👈 per-day hours
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
    <div className="bg-white p-6 rounded-xl shadow space-y-6 text-black">
      <h2 className="text-xl font-semibold">Add a Course</h2>

      {/* Course name */}
      <input
        type="text"
        placeholder="Course name (e.g. Mathematics)"
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
        className="w-full border rounded-lg p-2"
      />

      {/* Weekly schedule */}
      <div>
        <p className="font-medium mb-2">Weekly Schedule (hours per day)</p>

        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <span className="w-10">{day}</span>

              <input
                type="number"
                min={0}
                value={schedule[day]}
                onChange={(e) =>
                  handleScheduleChange(day, Number(e.target.value))
                }
                className="w-24 border rounded p-1"
              />

              <span className="text-gray-500">hrs</span>
            </div>
          ))}
        </div>
      </div>

      {/* Minimum attendance */}
      <div>
        <label className="font-medium">Minimum attendance (%)</label>
        <input
          type="number"
          min={1}
          max={100}
          value={minAttendance}
          onChange={(e) => setMinAttendance(Number(e.target.value))}
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer hover:scale-101 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Course"}
      </button>
    </div>
  );
}
