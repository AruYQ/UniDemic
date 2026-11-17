<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesProjectAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Collaboration\StoreMilestoneRequest;
use App\Http\Requests\Collaboration\UpdateMilestoneRequest;
use App\Http\Resources\ProjectMilestoneResource;
use App\Models\ProjectMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMilestoneController extends Controller
{
    use AuthorizesProjectAccess;

    /**
     * List milestones for a project.
     */
    public function index(Request $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);

        $milestones = $project->milestones()
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
            ])
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProjectMilestoneResource::collection($milestones),
        ]);
    }

    /**
     * Create a new milestone for a project.
     */
    public function store(StoreMilestoneRequest $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);
        $validated = $request->validated();

        $nextOrder = ($project->milestones()->max('order') ?? -1) + 1;

        $milestone = $project->milestones()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'order' => $validated['order'] ?? $nextOrder,
            'is_completed' => false,
        ]);

        $milestone->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Milestone created successfully',
            'data' => new ProjectMilestoneResource($milestone),
        ], 201);
    }

    /**
     * Update an existing milestone.
     */
    public function update(UpdateMilestoneRequest $request, int $id): JsonResponse
    {
        $milestone = ProjectMilestone::findOrFail($id);
        $this->findAccessibleProject($request, (int) $milestone->project_id);

        $validated = $request->validated();
        if (array_key_exists('is_completed', $validated)) {
            $validated['completed_at'] = $validated['is_completed'] ? now() : null;
        }

        $milestone->update($validated);
        $milestone->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Milestone updated successfully',
            'data' => new ProjectMilestoneResource($milestone),
        ]);
    }

    /**
     * Toggle completion status of a milestone.
     */
    public function toggleComplete(Request $request, int $id): JsonResponse
    {
        $milestone = ProjectMilestone::findOrFail($id);
        $this->findAccessibleProject($request, (int) $milestone->project_id);

        $newState = !$milestone->is_completed;
        $milestone->update([
            'is_completed' => $newState,
            'completed_at' => $newState ? now() : null,
        ]);

        $milestone->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Milestone status updated',
            'data' => new ProjectMilestoneResource($milestone),
        ]);
    }

    /**
     * Delete a milestone.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $milestone = ProjectMilestone::findOrFail($id);
        $this->findAccessibleProject($request, (int) $milestone->project_id);

        $milestone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Milestone deleted successfully',
        ]);
    }
}
