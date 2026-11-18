<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Schedule\StoreScheduleRequest;
use App\Http\Requests\Schedule\UpdateScheduleRequest;
use App\Http\Resources\CourseScheduleResource;
use App\Models\Course;
use App\Models\CourseSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseScheduleController extends Controller
{
    /**
     * Display schedules for a specific course or all user's schedules.
     */
    public function index(Request $request, ?int $course_id = null): JsonResponse
    {
        $user = $request->user();

        $query = CourseSchedule::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('course');

        if ($course_id) {
            $query->where('course_id', $course_id);
        } elseif ($request->filled('day')) {
            $query->where('day', strtolower($request->query('day')));
        }

        $schedules = $query->orderBy('start_time')->get();

        return response()->json([
            'success' => true,
            'data' => CourseScheduleResource::collection($schedules),
        ]);
    }

    /**
     * Store a newly created schedule for a course.
     */
    public function store(StoreScheduleRequest $request, int $course_id): JsonResponse
    {
        $user = $request->user();
        $course = Course::whereHas('semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($course_id);

        $schedule = $course->schedules()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Schedule created successfully',
            'data' => new CourseScheduleResource($schedule->load('course')),
        ], 201);
    }

    /**
     * Update the specified schedule.
     */
    public function update(UpdateScheduleRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $schedule = CourseSchedule::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $schedule->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Schedule updated successfully',
            'data' => new CourseScheduleResource($schedule->fresh('course')),
        ]);
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $schedule = CourseSchedule::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Schedule deleted successfully',
        ]);
    }
}
