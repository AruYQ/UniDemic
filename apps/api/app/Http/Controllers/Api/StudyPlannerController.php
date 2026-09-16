<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Productivity\StudyPlannerRequest;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Exam;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class StudyPlannerController extends Controller
{
    /**
     * Generate an intelligent study plan suggestion based on user's tasks, assignments, exams, and class schedules.
     */
    public function suggest(StudyPlannerRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $startDate = Carbon::parse($validated['start_date'] ?? now()->toDateString())->startOfDay();
        $daysAhead = (int) ($validated['days_ahead'] ?? 7);
        $maxHoursPerDay = (int) ($validated['max_hours_per_day'] ?? 4);
        $maxMinutesPerDay = $maxHoursPerDay * 60;
        $endDate = $startDate->copy()->addDays($daysAhead - 1)->endOfDay();

        // 1. Fetch user's class schedules to avoid collisions
        $schedules = CourseSchedule::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->get();

        $schedulesByDay = [];
        foreach ($schedules as $sched) {
            $dayKey = strtolower($sched->day);
            $schedulesByDay[$dayKey][] = [
                'start' => $sched->start_time,
                'end' => $sched->end_time,
            ];
        }

        // 2. Fetch study target items
        // A. Upcoming Exams
        $exams = Exam::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->whereDate('date', '>=', $startDate->toDateString())
        ->with('course')
        ->orderBy('date')
        ->get();

        // B. Pending Assignments
        $assignments = Assignment::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->where('is_completed', false)
        ->with('course')
        ->orderByRaw('deadline IS NULL, deadline ASC')
        ->get();

        // C. Pending Tasks
        $tasks = $user->tasks()
            ->where('is_completed', false)
            ->with('course')
            ->orderByRaw('deadline IS NULL, deadline ASC')
            ->get();

        // 3. Prepare prioritised study queue
        $studyQueue = [];

        foreach ($exams as $exam) {
            $examDate = Carbon::parse($exam->date);
            $daysUntil = (int) $startDate->diffInDays($examDate, false);
            $priorityScore = max(10, 100 - ($daysUntil * 5));
            $examLabel = ucfirst($exam->type) . ' Exam' . ($exam->course ? ' (' . $exam->course->name . ')' : '');

            $studyQueue[] = [
                'type' => 'exam',
                'title' => 'Review for ' . $examLabel,
                'course_id' => $exam->course_id,
                'course_name' => $exam->course?->name,
                'exam_id' => $exam->id,
                'task_id' => null,
                'assignment_id' => null,
                'deadline' => $examDate,
                'priority_score' => $priorityScore,
                'duration_minutes' => 90,
                'reason' => 'Exam preparation scheduled before ' . $examDate->format('d M'),
            ];
        }

        foreach ($assignments as $assignment) {
            $deadline = $assignment->deadline ? Carbon::parse($assignment->deadline) : null;
            $daysUntil = $deadline ? (int) $startDate->diffInDays($deadline, false) : 14;
            $priorityScore = $deadline ? max(10, 90 - ($daysUntil * 5)) : 40;

            if ($assignment->priority === 'urgent') {
                $priorityScore += 30;
            } elseif ($assignment->priority === 'high') {
                $priorityScore += 20;
            }

            $studyQueue[] = [
                'type' => 'assignment',
                'title' => 'Work on assignment: ' . $assignment->title,
                'course_id' => $assignment->course_id,
                'course_name' => $assignment->course?->name,
                'task_id' => null,
                'assignment_id' => $assignment->id,
                'deadline' => $deadline,
                'priority_score' => $priorityScore,
                'duration_minutes' => 60,
                'reason' => $deadline ? 'Assignment due ' . $deadline->format('d M H:i') : 'Course assignment progress',
            ];
        }

        foreach ($tasks as $task) {
            $deadline = $task->deadline ? Carbon::parse($task->deadline) : null;
            $daysUntil = $deadline ? (int) $startDate->diffInDays($deadline, false) : 14;
            $priorityScore = $deadline ? max(10, 80 - ($daysUntil * 5)) : 30;

            if ($task->priority === 'urgent') {
                $priorityScore += 25;
            } elseif ($task->priority === 'high') {
                $priorityScore += 15;
            }

            $studyQueue[] = [
                'type' => 'task',
                'title' => 'Focus on: ' . $task->title,
                'course_id' => $task->course_id,
                'course_name' => $task->course?->name,
                'task_id' => $task->id,
                'assignment_id' => null,
                'deadline' => $deadline,
                'priority_score' => $priorityScore,
                'duration_minutes' => 60,
                'reason' => $deadline ? 'Task deadline approaching on ' . $deadline->format('d M') : 'Productivity goal task',
            ];
        }

        // If queue is empty, propose review sessions for active courses
        if (empty($studyQueue)) {
            $activeCourses = Course::whereHas('semester', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('is_active', true);
            })->get();

            foreach ($activeCourses as $course) {
                $studyQueue[] = [
                    'type' => 'review',
                    'title' => 'Material review: ' . $course->name,
                    'course_id' => $course->id,
                    'course_name' => $course->name,
                    'task_id' => null,
                    'assignment_id' => null,
                    'deadline' => null,
                    'priority_score' => 20,
                    'duration_minutes' => 60,
                    'reason' => 'Consistent weekly subject review',
                ];
            }
        }

        // Sort queue by priority score descending
        usort($studyQueue, fn ($a, $b) => $b['priority_score'] <=> $a['priority_score']);

        // 4. Distribute into available slots across the time range
        $plannedSchedule = [];
        $totalStudyMinutes = 0;
        $queueIndex = 0;
        $totalItems = count($studyQueue);

        for ($dayOffset = 0; $dayOffset < $daysAhead; $dayOffset++) {
            if ($queueIndex >= $totalItems) {
                // If items remain in daysAhead, cycle through if needed or stop
                break;
            }

            $currentDate = $startDate->copy()->addDays($dayOffset);
            $dayOfWeek = strtolower($currentDate->format('l'));
            $isWeekend = in_array($dayOfWeek, ['saturday', 'sunday']);

            $defaultSlots = $isWeekend ? [
                ['start' => '10:00', 'end' => '11:30', 'duration' => 90],
                ['start' => '14:30', 'end' => '16:00', 'duration' => 90],
                ['start' => '19:30', 'end' => '21:00', 'duration' => 90],
            ] : [
                ['start' => '16:30', 'end' => '18:00', 'duration' => 90],
                ['start' => '19:30', 'end' => '21:00', 'duration' => 90],
            ];

            $dailyMinutes = 0;
            $classTimes = $schedulesByDay[$dayOfWeek] ?? [];

            foreach ($defaultSlots as $slot) {
                if ($dailyMinutes + $slot['duration'] > $maxMinutesPerDay) {
                    continue;
                }

                if ($queueIndex >= $totalItems) {
                    break;
                }

                // Check conflict with class times
                $hasConflict = false;
                foreach ($classTimes as $class) {
                    if (!($slot['end'] <= $class['start'] || $slot['start'] >= $class['end'])) {
                        $hasConflict = true;
                        break;
                    }
                }

                if ($hasConflict) {
                    continue;
                }

                $item = $studyQueue[$queueIndex];

                // If item has a deadline, don't schedule after the deadline
                if ($item['deadline'] && $currentDate->isAfter($item['deadline'])) {
                    // Try next item
                    continue;
                }

                $plannedSchedule[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'start_time' => $slot['start'],
                    'end_time' => $slot['end'],
                    'title' => $item['title'],
                    'course_id' => $item['course_id'],
                    'course_name' => $item['course_name'],
                    'task_id' => $item['task_id'],
                    'assignment_id' => $item['assignment_id'],
                    'duration_minutes' => $slot['duration'],
                    'reason' => $item['reason'],
                ];

                $dailyMinutes += $slot['duration'];
                $totalStudyMinutes += $slot['duration'];
                $queueIndex++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'total_study_hours' => round($totalStudyMinutes / 60, 1),
                'schedule' => $plannedSchedule,
            ],
        ]);
    }
}
