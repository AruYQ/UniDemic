<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Http\Resources\ExamResource;
use App\Models\Course;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Display a listing of exams.
     */
    public function index(Request $request, ?int $course_id = null): JsonResponse
    {
        $user = $request->user();

        $query = Exam::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('course');

        if ($course_id) {
            $query->where('course_id', $course_id);
        }

        $exams = $query->orderBy('date')->orderBy('time')->get();

        return response()->json([
            'success' => true,
            'data' => ExamResource::collection($exams),
        ]);
    }

    /**
     * Store a newly created exam for a course.
     */
    public function store(StoreExamRequest $request, int $course_id): JsonResponse
    {
        $user = $request->user();
        $course = Course::whereHas('semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($course_id);

        $exam = $course->exams()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Exam created successfully',
            'data' => new ExamResource($exam->load('course')),
        ], 201);
    }

    /**
     * Display the specified exam.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $exam = Exam::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('course')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ExamResource($exam),
        ]);
    }

    /**
     * Update the specified exam.
     */
    public function update(UpdateExamRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $exam = Exam::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $exam->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Exam updated successfully',
            'data' => new ExamResource($exam->fresh('course')),
        ]);
    }

    /**
     * Remove the specified exam.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $exam = Exam::whereHas('course.semester', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $exam->delete();

        return response()->json([
            'success' => true,
            'message' => 'Exam deleted successfully',
        ]);
    }
}
