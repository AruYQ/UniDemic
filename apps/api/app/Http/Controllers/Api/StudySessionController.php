<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Productivity\StoreStudySessionRequest;
use App\Http\Resources\StudySessionResource;
use App\Models\Course;
use App\Models\StudySession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudySessionController extends Controller
{
    /**
     * Display a listing of study sessions.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->studySessions()
            ->with(['course', 'task']);

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        if ($request->filled('task_id')) {
            $query->where('task_id', $request->query('task_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('date')) {
            $query->whereDate('started_at', $request->query('date'));
        }

        $sessions = $query->orderByDesc('started_at')->get();

        return response()->json([
            'success' => true,
            'data' => StudySessionResource::collection($sessions),
        ]);
    }

    /**
     * Store a newly created study session.
     */
    public function store(StoreStudySessionRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (!empty($validated['course_id'])) {
            $courseExists = Course::whereHas('semester', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('id', $validated['course_id'])->exists();

            if (!$courseExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected course does not belong to your account.',
                ], 422);
            }
        }

        if (!empty($validated['task_id'])) {
            $taskExists = $user->tasks()->where('id', $validated['task_id'])->exists();
            if (!$taskExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected task does not belong to your account.',
                ], 422);
            }
        }

        $validated['is_completed'] = true;
        $session = $user->studySessions()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Study session recorded successfully',
            'data' => new StudySessionResource($session->fresh(['course', 'task'])),
        ], 201);
    }

    /**
     * Display summary metrics for user's study sessions.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = Carbon::now();

        $todayMinutes = (int) $user->studySessions()
            ->whereDate('started_at', $now->toDateString())
            ->sum('duration_minutes');

        $weekMinutes = (int) $user->studySessions()
            ->whereBetween('started_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])
            ->sum('duration_minutes');

        $totalSessions = $user->studySessions()->count();

        $byCourseRaw = $user->studySessions()
            ->select('course_id', DB::raw('SUM(duration_minutes) as minutes'))
            ->groupBy('course_id')
            ->get();

        $courseIds = $byCourseRaw->pluck('course_id')->filter()->all();
        $courses = Course::whereIn('id', $courseIds)->pluck('name', 'id');

        $byCourse = $byCourseRaw->map(function ($item) use ($courses) {
            return [
                'course_id' => $item->course_id,
                'course_name' => $item->course_id ? ($courses[$item->course_id] ?? 'Unknown Course') : 'General Study',
                'minutes' => (int) $item->minutes,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'today_minutes' => $todayMinutes,
                'week_minutes' => $weekMinutes,
                'total_sessions' => $totalSessions,
                'by_course' => $byCourse,
            ],
        ]);
    }

    /**
     * Remove the specified study session.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $session = $user->studySessions()->findOrFail($id);
        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Study session deleted successfully',
        ]);
    }
}
