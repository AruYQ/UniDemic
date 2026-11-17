<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesProjectAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Collaboration\MoveProjectTaskRequest;
use App\Http\Requests\Collaboration\ReorderProjectTasksRequest;
use App\Http\Requests\Collaboration\StoreProjectTaskRequest;
use App\Http\Requests\Collaboration\UpdateProjectTaskRequest;
use App\Http\Resources\ProjectTaskResource;
use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectTaskController extends Controller
{
    use AuthorizesProjectAccess;

    /**
     * Ensure user is not a read-only viewer on the project.
     */
    protected function canEditProjectTasks(Project $project, int $userId): bool
    {
        $member = $project->members()->where('user_id', $userId)->first();
        if ($member && $member->role === 'viewer' && (int) $project->creator_id !== $userId) {
            return false;
        }

        return true;
    }

    /**
     * List Kanban tasks for a project.
     */
    public function index(Request $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);

        $query = $project->tasks()->with(['assignee', 'creator', 'milestone']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', (int) $request->query('assignee_id'));
        }

        if ($request->filled('milestone_id')) {
            $query->where('milestone_id', (int) $request->query('milestone_id'));
        }

        return response()->json([
            'success' => true,
            'data' => ProjectTaskResource::collection($query->get()),
        ]);
    }

    /**
     * Create a new Kanban task inside a project.
     */
    public function store(StoreProjectTaskRequest $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);
        $user = $request->user();

        if (!$this->canEditProjectTasks($project, (int) $user->id)) {
            return response()->json(['success' => false, 'message' => 'Viewers cannot create tasks'], 403);
        }

        $validated = $request->validated();

        if (!empty($validated['milestone_id'])) {
            $validMilestone = $project->milestones()->where('id', $validated['milestone_id'])->exists();
            if (!$validMilestone) {
                return response()->json(['success' => false, 'message' => 'Milestone does not belong to this project'], 422);
            }
        }

        if (!empty($validated['assignee_id']) && !$project->hasAccess((int) $validated['assignee_id'])) {
            return response()->json(['success' => false, 'message' => 'Assignee must be a project collaborator'], 422);
        }

        $status = $validated['status'] ?? 'todo';
        $nextPos = ($project->tasks()->where('status', $status)->max('position') ?? -1) + 1;

        $task = $project->tasks()->create([
            'milestone_id' => $validated['milestone_id'] ?? null,
            'creator_id' => $user->id,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $status,
            'priority' => $validated['priority'] ?? 'medium',
            'position' => $nextPos,
            'due_date' => $validated['due_date'] ?? null,
            'labels' => $validated['labels'] ?? [],
        ]);

        $task->load(['assignee', 'creator', 'milestone']);

        return response()->json([
            'success' => true,
            'message' => 'Project task created successfully',
            'data' => new ProjectTaskResource($task),
        ], 201);
    }

    /**
     * Update a Kanban project task.
     */
    public function update(UpdateProjectTaskRequest $request, int $id): JsonResponse
    {
        $task = ProjectTask::findOrFail($id);
        $project = $this->findAccessibleProject($request, (int) $task->project_id);

        if (!$this->canEditProjectTasks($project, (int) $request->user()->id)) {
            return response()->json(['success' => false, 'message' => 'Viewers cannot edit tasks'], 403);
        }

        $validated = $request->validated();

        if (!empty($validated['milestone_id'])) {
            $validMilestone = $project->milestones()->where('id', $validated['milestone_id'])->exists();
            if (!$validMilestone) {
                return response()->json(['success' => false, 'message' => 'Milestone does not belong to this project'], 422);
            }
        }

        if (!empty($validated['assignee_id']) && !$project->hasAccess((int) $validated['assignee_id'])) {
            return response()->json(['success' => false, 'message' => 'Assignee must be a project collaborator'], 422);
        }

        $task->update($validated);
        $task->load(['assignee', 'creator', 'milestone']);

        return response()->json([
            'success' => true,
            'message' => 'Project task updated successfully',
            'data' => new ProjectTaskResource($task),
        ]);
    }

    /**
     * Move a Kanban task between columns or reorder within a column.
     */
    public function move(MoveProjectTaskRequest $request, int $id): JsonResponse
    {
        $task = ProjectTask::findOrFail($id);
        $project = $this->findAccessibleProject($request, (int) $task->project_id);

        if (!$this->canEditProjectTasks($project, (int) $request->user()->id)) {
            return response()->json(['success' => false, 'message' => 'Viewers cannot move tasks'], 403);
        }

        $validated = $request->validated();
        $targetStatus = $validated['status'];
        $targetPosition = (int) $validated['position'];

        DB::transaction(function () use ($project, $task, $targetStatus, $targetPosition) {
            $oldStatus = $task->status;

            // Remove task temporarily from target list ordering
            $siblings = $project->tasks()
                ->where('status', $targetStatus)
                ->where('id', '!=', $task->id)
                ->orderBy('position')
                ->orderBy('id')
                ->get()
                ->values();

            $clampedPos = max(0, min($targetPosition, $siblings->count()));
            $siblings->splice($clampedPos, 0, [$task]);

            foreach ($siblings as $index => $item) {
                $item->update([
                    'status' => $targetStatus,
                    'position' => $index,
                ]);
            }

            // Reindex source column if moved across columns
            if ($oldStatus !== $targetStatus) {
                $oldSiblings = $project->tasks()
                    ->where('status', $oldStatus)
                    ->orderBy('position')
                    ->orderBy('id')
                    ->get()
                    ->values();

                foreach ($oldSiblings as $index => $item) {
                    $item->update(['position' => $index]);
                }
            }
        });

        $task->refresh()->load(['assignee', 'creator', 'milestone']);

        return response()->json([
            'success' => true,
            'message' => 'Project task moved successfully',
            'data' => new ProjectTaskResource($task),
        ]);
    }

    /**
     * Batch reorder Kanban tasks across columns.
     */
    public function reorder(ReorderProjectTasksRequest $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);

        if (!$this->canEditProjectTasks($project, (int) $request->user()->id)) {
            return response()->json(['success' => false, 'message' => 'Viewers cannot reorder tasks'], 403);
        }

        $items = $request->validated('tasks');
        $taskIds = array_column($items, 'id');

        $ownedCount = $project->tasks()->whereIn('id', $taskIds)->count();
        if ($ownedCount !== count(array_unique($taskIds))) {
            return response()->json([
                'success' => false,
                'message' => 'One or more tasks do not belong to this project',
            ], 422);
        }

        DB::transaction(function () use ($project, $items) {
            foreach ($items as $item) {
                $project->tasks()
                    ->where('id', $item['id'])
                    ->update([
                        'status' => $item['status'],
                        'position' => $item['position'],
                    ]);
            }
        });

        $tasks = $project->tasks()->with(['assignee', 'creator', 'milestone'])->get();

        return response()->json([
            'success' => true,
            'message' => 'Kanban board reordered successfully',
            'data' => ProjectTaskResource::collection($tasks),
        ]);
    }

    /**
     * Delete a Kanban project task.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $task = ProjectTask::findOrFail($id);
        $project = $this->findAccessibleProject($request, (int) $task->project_id);

        if (!$this->canEditProjectTasks($project, (int) $request->user()->id)) {
            return response()->json(['success' => false, 'message' => 'Viewers cannot delete tasks'], 403);
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project task deleted successfully',
        ]);
    }
}
