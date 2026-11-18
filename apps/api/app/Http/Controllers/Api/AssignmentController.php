<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assignment\StoreAssignmentRequest;
use App\Http\Requests\Assignment\UpdateAssignmentRequest;
use App\Http\Resources\AssignmentResource;
use App\Models\Assignment;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    /**
     * Display a listing of assignments.
     */
    public function index(Request $request, ?int $course_id = null): JsonResponse
    {
        $user = $request->user();

        $query = Assignment::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('course');

        if ($course_id) {
            $query->where('course_id', $course_id);
        }

        if ($request->has('is_completed')) {
            $query->where('is_completed', filter_var($request->query('is_completed'), FILTER_VALIDATE_BOOLEAN));
        }

        $assignments = $query->orderBy('deadline')->get();

        return response()->json([
            'success' => true,
            'data' => AssignmentResource::collection($assignments),
        ]);
    }

    /**
     * Store a newly created assignment for a course.
     */
    public function store(StoreAssignmentRequest $request, int $course_id): JsonResponse
    {
        $user = $request->user();
        $course = Course::whereHas('semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($course_id);

        $validated = $request->validated();
        if (isset($validated['progress']) && $validated['progress'] >= 100) {
            $validated['is_completed'] = true;
        }

        $assignment = $course->assignments()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment created successfully',
            'data' => new AssignmentResource($assignment->load('course')),
        ], 201);
    }

    /**
     * Display the specified assignment.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $assignment = Assignment::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('course')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new AssignmentResource($assignment),
        ]);
    }

    /**
     * Update the specified assignment.
     */
    public function update(UpdateAssignmentRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $assignment = Assignment::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $validated = $request->validated();
        if (isset($validated['progress'])) {
            $validated['is_completed'] = $validated['progress'] >= 100;
        } elseif (isset($validated['is_completed']) && $validated['is_completed']) {
            $validated['progress'] = 100;
        }

        $assignment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment updated successfully',
            'data' => new AssignmentResource($assignment->fresh('course')),
        ]);
    }

    /**
     * Remove the specified assignment.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $assignment = Assignment::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assignment deleted successfully',
        ]);
    }
}
