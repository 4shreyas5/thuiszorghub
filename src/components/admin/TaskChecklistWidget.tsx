"use client";

import { useState } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  task_title: string;
  task_type: string;
  time_category: string;
  estimated_duration_minutes?: number;
  instructions?: string;
  completion_status?: string;
}

interface TaskChecklistWidgetProps {
  tasks: Task[];
  isEditing: boolean;
  onTaskComplete: (taskId: string, status: string, notes?: string) => Promise<void>;
}

export function TaskChecklistWidget({
  tasks,
  isEditing,
  onTaskComplete,
}: TaskChecklistWidgetProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const completed = tasks.filter((t) => t.completion_status === "completed").length;

  const handleTaskComplete = async (taskId: string) => {
    setLoading(taskId);
    try {
      await onTaskComplete(taskId, "completed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Task Checklist</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completed} of {tasks.length} completed
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No tasks scheduled for this visit
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleTaskComplete(task.id)}
                  disabled={loading === task.id || !isEditing || task.completion_status === "completed"}
                  className="mt-1 flex-shrink-0 disabled:opacity-50"
                >
                  {task.completion_status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() =>
                      setExpandedTask(expandedTask === task.id ? null : task.id)
                    }
                    className="text-left w-full"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`font-medium ${
                            task.completion_status === "completed"
                              ? "line-through text-gray-500"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {task.task_title}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {task.task_type}
                          </span>
                          <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded">
                            {task.time_category}
                          </span>
                          {task.estimated_duration_minutes && (
                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">
                              {task.estimated_duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      {task.instructions && (
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {expandedTask === task.id && task.instructions && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-900 dark:text-amber-200">
                      <p className="font-medium mb-1">Instructions:</p>
                      <p>{task.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
