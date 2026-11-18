<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Semester\StoreSemesterRequest;
use App\Http\Requests\Semester\UpdateSemesterRequest;
use App\Http\Resources\SemesterResource;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SemesterController extends Controller
{
    /**
     * Display a listing of the user's semesters.
     */
    public function index(Request $request): JsonResponse
    {
        $semesters = $request->user()
            ->semesters()
            ->withCount('courses')
            ->orderByDesc('is_active')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => SemesterResource::collection($semesters),
        ]);
    }

    /**
     * Get the currently active semester for the user.
     */
    public function active(Request $request): JsonResponse
    {
        $semester = $request->user()
            ->semesters()
            ->where('is_active', true)
            ->with(['courses.schedules'])
            ->first();

        if (! $semester) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No active semester found',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => new SemesterResource($semester),
        ]);
    }

    /**
     * Store a newly created semester.
     */
    public function store(StoreSemesterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $semester = DB::transaction(function () use ($user, $validated) {
            $isActive = (bool) ($validated['is_active'] ?? false);

            // If user marks this semester active, or if user has no semesters yet, set active
            if ($isActive || $user->semesters()->count() === 0) {
                $user->semesters()->update(['is_active' => false]);
                $validated['is_active'] = true;
            }

            return $user->semesters()->create($validated);
        });

        return response()->json([
            'success' => true,
            'message' => 'Semester created successfully',
            'data' => new SemesterResource($semester),
        ], 201);
    }

    /**
     * Display the specified semester with its courses.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $semester = $request->user()
            ->semesters()
            ->with(['courses.schedules'])
            ->withCount('courses')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new SemesterResource($semester),
        ]);
    }

    /**
     * Update the specified semester.
     */
    public function update(UpdateSemesterRequest $request, int $id): JsonResponse
    {
        $semester = $request->user()->semesters()->findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($request, $semester, $validated) {
            if (isset($validated['is_active']) && $validated['is_active']) {
                $request->user()->semesters()->where('id', '!=', $semester->id)->update(['is_active' => false]);
            }

            $semester->update($validated);
        });

        return response()->json([
            'success' => true,
            'message' => 'Semester updated successfully',
            'data' => new SemesterResource($semester->fresh()),
        ]);
    }

    /**
     * Remove the specified semester.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $semester = $request->user()->semesters()->findOrFail($id);
        $semester->delete();

        return response()->json([
            'success' => true,
            'message' => 'Semester deleted successfully',
        ]);
    }

    /**
     * Activate the specified semester.
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        $semester = $request->user()->semesters()->findOrFail($id);

        DB::transaction(function () use ($request, $semester) {
            $request->user()->semesters()->where('id', '!=', $semester->id)->update(['is_active' => false]);
            $semester->update(['is_active' => true]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Semester activated successfully',
            'data' => new SemesterResource($semester->fresh()),
        ]);
    }
}
