<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\StoreCourseRequest;
use App\Http\Requests\Course\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    /**
     * Display a listing of courses belonging to the user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Course::whereHas('semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['schedules', 'semester'])
          ->withCount(['schedules', 'assignments', 'exams']);

        if ($request->filled('semester_id')) {
            $query->where('semester_id', $request->query('semester_id'));
        }

        $courses = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => CourseResource::collection($courses),
        ]);
    }

    /**
     * Store a newly created course.
     */
    public function store(StoreCourseRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Verify the semester belongs to the authenticated user
        $semester = $user->semesters()->find($validated['semester_id']);
        if (! $semester) {
            throw ValidationException::withMessages([
                'semester_id' => ['The selected semester does not belong to your account.'],
            ]);
        }

        $course = $semester->courses()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully',
            'data' => new CourseResource($course->load('semester')),
        ], 201);
    }

    /**
     * Display the specified course.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $course = $this->getAuthorizedCourse($request, $id);
        $course->load(['semester', 'schedules', 'assignments', 'exams']);

        return response()->json([
            'success' => true,
            'data' => new CourseResource($course),
        ]);
    }

    /**
     * Update the specified course.
     */
    public function update(UpdateCourseRequest $request, int $id): JsonResponse
    {
        $course = $this->getAuthorizedCourse($request, $id);
        $course->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully',
            'data' => new CourseResource($course->fresh(['semester', 'schedules'])),
        ]);
    }

    /**
     * Remove the specified course.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $course = $this->getAuthorizedCourse($request, $id);
        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully',
        ]);
    }

    /**
     * Helper to find a course and ensure user owns it.
     */
    private function getAuthorizedCourse(Request $request, int $id): Course
    {
        $user = $request->user();
        return Course::whereHas('semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);
    }
}
