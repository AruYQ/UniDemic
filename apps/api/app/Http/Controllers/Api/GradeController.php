<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grade\StoreGradeComponentRequest;
use App\Http\Requests\Grade\StoreGradeRequest;
use App\Http\Requests\Grade\UpdateGradeComponentRequest;
use App\Http\Requests\Grade\UpdateGradeRequest;
use App\Http\Resources\GradeComponentResource;
use App\Http\Resources\GradeResource;
use App\Models\Course;
use App\Models\Grade;
use App\Models\GradeComponent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Get user-owned course or abort with 404.
     */
    protected function getCourse(Request $request, int $courseId): Course
    {
        return Course::where('id', $courseId)
            ->whereHas('semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Get user-owned grade component or abort with 404.
     */
    protected function getComponent(Request $request, int $id): GradeComponent
    {
        return GradeComponent::where('id', $id)
            ->whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Get user-owned grade or abort with 404.
     */
    protected function getGrade(Request $request, int $id): Grade
    {
        return Grade::where('id', $id)
            ->whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    // ==========================================
    // Grade Components
    // ==========================================

    /**
     * List all grade components for a course.
     */
    public function components(Request $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);
        $components = $course->gradeComponents()->withCount('grades')->get();

        return response()->json([
            'success' => true,
            'data' => GradeComponentResource::collection($components),
        ]);
    }

    /**
     * Store a new grade component for a course.
     */
    public function storeComponent(StoreGradeComponentRequest $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);
        $component = $course->gradeComponents()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Grade component created successfully',
            'data' => new GradeComponentResource($component),
        ], 201);
    }

    /**
     * Update a grade component.
     */
    public function updateComponent(UpdateGradeComponentRequest $request, int $id): JsonResponse
    {
        $component = $this->getComponent($request, $id);
        $component->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Grade component updated successfully',
            'data' => new GradeComponentResource($component->fresh()),
        ]);
    }

    /**
     * Delete a grade component.
     */
    public function destroyComponent(Request $request, int $id): JsonResponse
    {
        $component = $this->getComponent($request, $id);
        $component->delete();

        return response()->json([
            'success' => true,
            'message' => 'Grade component deleted successfully',
        ]);
    }

    // ==========================================
    // Grades
    // ==========================================

    /**
     * List grades for a course or all user grades.
     */
    public function index(Request $request, ?int $course_id = null): JsonResponse
    {
        $courseId = $course_id ?? $request->query('course_id');

        $query = Grade::whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['component', 'course'])
            ->orderBy('id', 'desc');

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        $grades = $query->get();

        return response()->json([
            'success' => true,
            'data' => GradeResource::collection($grades),
        ]);
    }

    /**
     * Store a new grade for a course.
     */
    public function store(StoreGradeRequest $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);
        $validated = $request->validated();

        // If grade_component_id is passed, verify it belongs to this course
        if (!empty($validated['grade_component_id'])) {
            $componentExists = $course->gradeComponents()->where('id', $validated['grade_component_id'])->exists();
            if (!$componentExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected grade component does not belong to this course',
                ], 422);
            }
        }

        $grade = $course->grades()->create($validated);
        $grade->load('component');

        return response()->json([
            'success' => true,
            'message' => 'Grade recorded successfully',
            'data' => new GradeResource($grade),
        ], 201);
    }

    /**
     * Display a specific grade.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $grade = $this->getGrade($request, $id);
        $grade->load(['component', 'course']);

        return response()->json([
            'success' => true,
            'data' => new GradeResource($grade),
        ]);
    }

    /**
     * Update a grade.
     */
    public function update(UpdateGradeRequest $request, int $id): JsonResponse
    {
        $grade = $this->getGrade($request, $id);
        $validated = $request->validated();

        if (!empty($validated['grade_component_id'])) {
            $componentExists = $grade->course->gradeComponents()->where('id', $validated['grade_component_id'])->exists();
            if (!$componentExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected grade component does not belong to this course',
                ], 422);
            }
        }

        $grade->update($validated);
        $grade->load('component');

        return response()->json([
            'success' => true,
            'message' => 'Grade updated successfully',
            'data' => new GradeResource($grade->fresh()),
        ]);
    }

    /**
     * Delete a grade.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $grade = $this->getGrade($request, $id);
        $grade->delete();

        return response()->json([
            'success' => true,
            'message' => 'Grade deleted successfully',
        ]);
    }
}
