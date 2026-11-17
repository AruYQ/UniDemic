<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesProjectAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Collaboration\StoreProjectRequest;
use App\Http\Requests\Collaboration\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Course;
use App\Models\Project;
use App\Models\StudyGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    use AuthorizesProjectAccess;

    /**
     * Display projects accessible to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;

        $query = Project::where(function ($q) use ($userId) {
            $q->where('creator_id', $userId)
                ->orWhereHas('members', fn ($m) => $m->where('user_id', $userId))
                ->orWhereHas('studyGroup.members', fn ($sg) => $sg->where('user_id', $userId));
        })
            ->with(['studyGroup', 'course', 'githubRepo'])
            ->withCount(['tasks', 'milestones']);

        if ($request->filled('study_group_id')) {
            $query->where('study_group_id', (int) $request->query('study_group_id'));
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', (int) $request->query('course_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $projects = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data' => ProjectResource::collection($projects),
        ]);
    }

    /**
     * Store a newly created project workspace.
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (!empty($validated['study_group_id'])) {
            $group = StudyGroup::findOrFail($validated['study_group_id']);
            if (!$group->isMember((int) $user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be a member of the study group to create a project in it',
                ], 403);
            }
        }

        if (!empty($validated['course_id'])) {
            $ownsCourse = Course::where('id', $validated['course_id'])
                ->whereHas('semester', fn ($q) => $q->where('user_id', $user->id))
                ->exists();

            if (!$ownsCourse) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or unauthorized',
                ], 404);
            }
        }

        $project = DB::transaction(function () use ($user, $validated) {
            $project = Project::create([
                'study_group_id' => $validated['study_group_id'] ?? null,
                'course_id' => $validated['course_id'] ?? null,
                'creator_id' => $user->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'due_date' => $validated['due_date'] ?? null,
            ]);

            $project->members()->create([
                'user_id' => $user->id,
                'role' => 'owner',
                'joined_at' => now(),
            ]);

            return $project;
        });

        $project->load(['studyGroup', 'course', 'members.user', 'githubRepo'])
            ->loadCount(['tasks', 'milestones']);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => new ProjectResource($project),
        ], 201);
    }

    /**
     * Display the specified project workspace.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $id);

        $project->load([
            'studyGroup',
            'course',
            'members.user',
            'milestones' => fn ($q) => $q->withCount('tasks'),
            'tasks.assignee',
            'tasks.creator',
            'githubRepo.activities' => fn ($q) => $q->limit(25),
        ])->loadCount(['tasks', 'milestones']);

        return response()->json([
            'success' => true,
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Update project workspace details.
     */
    public function update(UpdateProjectRequest $request, int $id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $id);

        if (!$project->isManager((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update this project',
            ], 403);
        }

        $project->update($request->validated());
        $project->load(['studyGroup', 'course', 'members.user', 'githubRepo'])
            ->loadCount(['tasks', 'milestones']);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $id);

        if (!$project->isManager((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this project',
            ], 403);
        }

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully',
        ]);
    }

    /**
     * Add a collaborator to the project.
     */
    public function addMember(Request $request, int $id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $id);

        if (!$project->isManager((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to add project members',
            ], 403);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['nullable', 'string', 'in:owner,editor,viewer'],
        ]);

        $exists = $project->members()->where('user_id', $validated['user_id'])->exists();
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a project member',
            ], 422);
        }

        $project->members()->create([
            'user_id' => $validated['user_id'],
            'role' => $validated['role'] ?? 'editor',
            'joined_at' => now(),
        ]);

        $project->load(['members.user']);

        return response()->json([
            'success' => true,
            'message' => 'Project member added successfully',
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Remove a member from the project.
     */
    public function removeMember(Request $request, int $id, int $user_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $id);
        $currentUser = $request->user();

        if ((int) $project->creator_id === $user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot remove project creator',
            ], 422);
        }

        if ((int) $currentUser->id !== $user_id && !$project->isManager((int) $currentUser->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to remove project member',
            ], 403);
        }

        $project->members()->where('user_id', $user_id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project member removed successfully',
        ]);
    }
}
