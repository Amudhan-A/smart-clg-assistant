type TimeBlock = {
  id?: string;
  task: string;
  start: string;
  end: string;
};

type Schedule = {
  days: Record<string, TimeBlock[]>;
};

// Format time to 12-hour with AM/PM
function formatTime(time: string): string {
  if (!time) return '';
  
  const match = time.match(/(\d{1,2}):?(\d{2})?/);
  if (!match) return time;
  
  let hours = parseInt(match[1]);
  const minutes = match[2] || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  return `${hours}:${minutes} ${period}`;
}

// Get color based on task name
function getTaskColor(task: string): string {
  const lowercaseTask = task.toLowerCase();
  
  if (lowercaseTask.includes('gym') || lowercaseTask.includes('workout') || lowercaseTask.includes('exercise')) {
    return 'bg-orange-100 border-orange-300 text-orange-900';
  }
  if (lowercaseTask.includes('meeting') || lowercaseTask.includes('call')) {
    return 'bg-blue-100 border-blue-300 text-blue-900';
  }
  if (lowercaseTask.includes('lunch') || lowercaseTask.includes('dinner') || lowercaseTask.includes('breakfast')) {
    return 'bg-green-100 border-green-300 text-green-900';
  }
  if (lowercaseTask.includes('study') || lowercaseTask.includes('learn') || lowercaseTask.includes('read')) {
    return 'bg-purple-100 border-purple-300 text-purple-900';
  }
  
  return 'bg-gray-100 border-gray-300 text-gray-900';
}

export default function WeeklySchedule({ schedule }: { schedule: Schedule }) {
  if (!schedule) return null;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="flex flex-col mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Weekly Schedule</h2>
        <div className="text-sm text-gray-500">
          {Object.values(schedule.days).flat().length} tasks scheduled
        </div>
      </div>

      <div className="flex flex-col lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day) => {
          const blocks = schedule.days[day] || [];
          const sortedBlocks = [...blocks].sort((a, b) => {
            const getMinutes = (time: string) => {
              if (!time) return 0;
              const match = time.match(/(\d{1,2}):?(\d{2})?/);
              if (!match) return 0;
              return parseInt(match[1]) * 60 + parseInt(match[2] || '0');
            };
            return getMinutes(a.start || '') - getMinutes(b.start || '');
          });

          return (
            <div
              key={day}
              className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4 min-h-[280px] flex flex-col"
            >
              {/* Day Header */}
              <div className="text-center mb-4 pb-3 border-b border-gray-200 ">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                  {day.slice(0, 3)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {sortedBlocks.length} {sortedBlocks.length === 1 ? 'task' : 'tasks'}
                </p>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {sortedBlocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Free day</p>
                  </div>
                ) : (
                  sortedBlocks.map((block, idx) => (
                    <div
                      key={block.id || idx}
                      className={`rounded-lg border-2 p-3 transition-all hover:scale-105 hover:shadow-md ${getTaskColor(block.task)}`}
                    >
                      <p className="font-semibold text-sm mb-2 leading-tight">
                        {block.task}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-medium opacity-75">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(block.start)} - {formatTime(block.end)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}