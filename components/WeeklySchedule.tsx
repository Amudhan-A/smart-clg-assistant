type TimeBlock = {
  id?: string;
  task: string;
  start: string;
  end: string;
};

type Schedule = {
  days: Record<string, TimeBlock[]>;
};

export default function WeeklySchedule({ schedule }: { schedule: Schedule }) {
  if (!schedule) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6">Weekly Schedule</h2>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Object.entries(schedule.days).map(([day, blocks]) => (
          <div
            key={day}
            className="bg-white rounded-xl border shadow-sm p-4 flex flex-col"
          >
            {/* Day header */}
            <h3 className="text-center font-semibold text-indigo-600 mb-4">
              {day}
            </h3>

            {/* Empty state */}
            {blocks.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-4">
                No tasks
              </p>
            )}

            {/* Tasks */}
            <div className="flex flex-col gap-3">
              {blocks
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((block, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-gray-50 p-3 hover:bg-gray-100 transition"
                  >
                    <p className="font-medium text-gray-900">
                      {block.task}
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      🕒 {block.start} – {block.end}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
