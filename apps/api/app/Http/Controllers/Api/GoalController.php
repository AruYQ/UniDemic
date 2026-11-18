<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Productivity\StoreGoalRequest;
use App\Http\Requests\Productivity\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Models\Goal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    /**
     * Display a listing of goals.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->goals();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->has('is_completed')) {
            $query->where('is_completed', filter_var($request->query('is_completed'), FILTER_VALIDATE_BOOLEAN));
        }

        $goals = $query->orderBy('is_completed')
            ->orderByRaw('end_date IS NULL, end_date ASC')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => GoalResource::collection($goals),
        ]);
    }

    /**
     * Store a newly created goal.
     */
    public function store(StoreGoalRequest $request): JsonResponse
    {
        $user = $request->user();
        $goal = $user->goals()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Goal created successfully',
            'data' => new GoalResource($goal),
        ], 201);
    }

    /**
     * Display the specified goal.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = $user->goals()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new GoalResource($goal),
        ]);
    }

    /**
     * Update the specified goal.
     */
    public function update(UpdateGoalRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = $user->goals()->findOrFail($id);

        $goal->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Goal updated successfully',
            'data' => new GoalResource($goal->fresh()),
        ]);
    }

    /**
     * Update only the progress (current_value) of the goal.
     */
    public function updateProgress(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'current_value' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        $goal = $user->goals()->findOrFail($id);

        $goal->update([
            'current_value' => $request->input('current_value'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Goal progress updated successfully',
            'data' => new GoalResource($goal->fresh()),
        ]);
    }

    /**
     * Remove the specified goal.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = $user->goals()->findOrFail($id);
        $goal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Goal deleted successfully',
        ]);
    }
}
