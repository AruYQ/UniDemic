<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Productivity\StoreSubtaskRequest;
use App\Http\Requests\Productivity\StoreTaskRequest;
use App\Http\Requests\Productivity\UpdateSubtaskRequest;
use App\Http\Requests\Productivity\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Http\Resources\TaskSubtaskResource;
use App\Models\Task;
use App\Models\TaskSubtask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Display a listing of tasks.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->tasks()
            ->with(['course', 'subtasks'])
            ->withCount('subtasks');

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->has('is_completed')) {
            $query->where('is_completed', filter_var($request->query('is_completed'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('label')) {
            $query->where('label', $request->query('label'));
        }

        $tasks = $query->orderByRaw('deadline IS NULL, deadline ASC')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $subtasksData = $validated['subtasks'] ?? [];
        unset($validated['subtasks']);

        $task = $user->tasks()->create($validated);

        if (!empty($subtasksData)) {
            foreach ($subtasksData as $index => $item) {
                $task->subtasks()->create([
                    'title' => $item['title'],
                    'order' => $item['order'] ?? ($index + 1),
                    'is_done' => false,
                ]);
            }
            $task->recalculateProgress();
        }

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => new TaskResource($task->fresh(['course', 'subtasks'])->loadCount('subtasks')),
        ], 201);
    }

    /**
     * Display the specified task.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $task = $user->tasks()
            ->with(['course', 'subtasks'])
            ->withCount('subtasks')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(UpdateTaskRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $task = $user->tasks()->findOrFail($id);
        $validated = $request->validated();

        if (isset($validated['is_completed'])) {
            if ($validated['is_completed']) {
                $validated['completed_at'] = $task->completed_at ?? now();
                $validated['progress'] = $validated['progress'] ?? 100;
            } else {
                $validated['completed_at'] = null;
            }
        } elseif (isset($validated['progress'])) {
            if ($validated['progress'] >= 100) {
                $validated['is_completed'] = true;
                $validated['completed_at'] = $task->completed_at ?? now();
            } else {
                $validated['is_completed'] = false;
                $validated['completed_at'] = null;
            }
        }

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => new TaskResource($task->fresh(['course', 'subtasks'])->loadCount('subtasks')),
        ]);
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $task = $user->tasks()->findOrFail($id);
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Toggle completion status of the task.
     */
    public function toggleComplete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $task = $user->tasks()->findOrFail($id);

        $newCompletedState = !$task->is_completed;

        $task->update([
            'is_completed' => $newCompletedState,
            'progress' => $newCompletedState ? 100 : 0,
            'completed_at' => $newCompletedState ? now() : null,
        ]);

        if ($task->subtasks()->count() > 0) {
            $task->subtasks()->update(['is_done' => $newCompletedState]);
        }

        return response()->json([
            'success' => true,
            'message' => $newCompletedState ? 'Task marked as completed' : 'Task marked as active',
            'data' => new TaskResource($task->fresh(['course', 'subtasks'])->loadCount('subtasks')),
        ]);
    }

    /**
     * Store a new subtask for the task.
     */
    public function storeSubtask(StoreSubtaskRequest $request, int $task_id): JsonResponse
    {
        $user = $request->user();
        $task = $user->tasks()->findOrFail($task_id);
        $validated = $request->validated();

        if (!isset($validated['order'])) {
            $validated['order'] = ($task->subtasks()->max('order') ?? 0) + 1;
        }
        $validated['is_done'] = false;

        $subtask = $task->subtasks()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subtask created successfully',
            'data' => new TaskSubtaskResource($subtask),
        ], 201);
    }

    /**
     * Update the specified subtask.
     */
    public function updateSubtask(UpdateSubtaskRequest $request, int $subtask_id): JsonResponse
    {
        $user = $request->user();
        $subtask = TaskSubtask::whereHas('task', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($subtask_id);

        $subtask->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Subtask updated successfully',
            'data' => new TaskSubtaskResource($subtask->fresh()),
        ]);
    }

    /**
     * Delete the specified subtask.
     */
    public function destroySubtask(Request $request, int $subtask_id): JsonResponse
    {
        $user = $request->user();
        $subtask = TaskSubtask::whereHas('task', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($subtask_id);

        $subtask->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subtask deleted successfully',
        ]);
    }
}
