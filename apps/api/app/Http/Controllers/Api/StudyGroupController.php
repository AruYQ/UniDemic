<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Collaboration\AddStudyGroupMemberRequest;
use App\Http\Requests\Collaboration\JoinStudyGroupRequest;
use App\Http\Requests\Collaboration\StoreStudyGroupRequest;
use App\Http\Requests\Collaboration\UpdateStudyGroupRequest;
use App\Http\Resources\StudyGroupResource;
use App\Models\Conversation;
use App\Models\Course;
use App\Models\Material;
use App\Models\Note;
use App\Models\StudyGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudyGroupController extends Controller
{
    /**
     * Find a study group where the user is a member or abort with 404.
     */
    protected function findMemberGroup(Request $request, int $id): StudyGroup
    {
        $userId = (int) $request->user()->id;

        return StudyGroup::where('id', $id)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();
    }

    /**
     * List study groups the user belongs to, or discover public groups.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = StudyGroup::with(['course'])
            ->withCount(['members', 'projects']);

        if ($request->boolean('discover')) {
            $query->where('is_public', true);
        } else {
            $query->whereHas('members', fn ($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', (int) $request->query('course_id'));
        }

        $groups = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data' => StudyGroupResource::collection($groups),
        ]);
    }

    /**
     * Create a new study group and auto-provision creator membership & group chat.
     */
    public function store(StoreStudyGroupRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

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

        $group = DB::transaction(function () use ($user, $validated) {
            // Auto-create linked group conversation for seamless communication
            $conversation = Conversation::create([
                'type' => 'group',
                'name' => $validated['name'],
                'description' => $validated['description'] ?? 'Study Group Chat',
                'created_by' => $user->id,
            ]);

            $conversation->participants()->create([
                'user_id' => $user->id,
                'role' => 'admin',
                'joined_at' => now(),
                'last_read_at' => now(),
            ]);

            $group = StudyGroup::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'subject' => $validated['subject'] ?? null,
                'course_id' => $validated['course_id'] ?? null,
                'conversation_id' => $conversation->id,
                'creator_id' => $user->id,
                'invite_code' => StudyGroup::generateInviteCode(),
                'is_public' => $validated['is_public'] ?? false,
                'max_members' => $validated['max_members'] ?? 50,
            ]);

            $group->members()->create([
                'user_id' => $user->id,
                'role' => 'admin',
                'joined_at' => now(),
            ]);

            return $group;
        });

        $group->load(['members.user', 'course'])->loadCount(['members', 'projects']);

        return response()->json([
            'success' => true,
            'message' => 'Study group created successfully',
            'data' => new StudyGroupResource($group),
        ], 201);
    }

    /**
     * Show details of a study group (members, shared notes & materials).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $group = StudyGroup::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->whereHas('members', fn ($m) => $m->where('user_id', $user->id))
                    ->orWhere('is_public', true);
            })
            ->with(['course', 'members.user', 'sharedNotes', 'sharedMaterials'])
            ->withCount(['members', 'projects'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Update study group details (admin or creator only).
     */
    public function update(UpdateStudyGroupRequest $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);
        $user = $request->user();

        if (!$group->isAdmin((int) $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update study group',
            ], 403);
        }

        $validated = $request->validated();

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

        $group->update($validated);
        $group->load(['course', 'members.user'])->loadCount(['members', 'projects']);

        return response()->json([
            'success' => true,
            'message' => 'Study group updated successfully',
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Delete a study group (creator only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if ((int) $group->creator_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the study group creator can delete it',
            ], 403);
        }

        $group->delete();

        return response()->json([
            'success' => true,
            'message' => 'Study group deleted successfully',
        ]);
    }

    /**
     * Join a study group via invite code or public study_group_id.
     */
    public function join(JoinStudyGroupRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (!empty($validated['invite_code'])) {
            $group = StudyGroup::where('invite_code', strtoupper($validated['invite_code']))->first();
        } else {
            $group = StudyGroup::where('id', $validated['study_group_id'])
                ->where('is_public', true)
                ->first();
        }

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Study group not found or invalid invite code',
            ], 404);
        }

        if ($group->isMember((int) $user->id)) {
            $group->load(['members.user', 'course'])->loadCount(['members', 'projects']);
            return response()->json([
                'success' => true,
                'message' => 'Already a member of this study group',
                'data' => new StudyGroupResource($group),
            ]);
        }

        if ($group->max_members && $group->members()->count() >= $group->max_members) {
            return response()->json([
                'success' => false,
                'message' => 'Study group has reached its maximum member capacity',
            ], 422);
        }

        DB::transaction(function () use ($group, $user) {
            $group->members()->create([
                'user_id' => $user->id,
                'role' => 'member',
                'joined_at' => now(),
            ]);

            if ($group->conversation_id && $group->conversation) {
                $group->conversation->participants()->firstOrCreate(
                    ['user_id' => $user->id],
                    ['role' => 'member', 'joined_at' => now()]
                );
            }
        });

        $group->load(['members.user', 'course'])->loadCount(['members', 'projects']);

        return response()->json([
            'success' => true,
            'message' => 'Joined study group successfully',
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Regenerate the study group invite code (admin/creator only).
     */
    public function regenerateInvite(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group->isAdmin((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to regenerate invite code',
            ], 403);
        }

        $group->update(['invite_code' => StudyGroup::generateInviteCode()]);

        return response()->json([
            'success' => true,
            'message' => 'Invite code regenerated successfully',
            'data' => ['invite_code' => $group->invite_code],
        ]);
    }

    /**
     * Add a member directly to a study group (admin/creator only).
     */
    public function addMember(AddStudyGroupMemberRequest $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group->isAdmin((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to add members',
            ], 403);
        }

        $validated = $request->validated();
        $targetUserId = (int) $validated['user_id'];

        if ($group->isMember($targetUserId)) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a member of this study group',
            ], 422);
        }

        if ($group->max_members && $group->members()->count() >= $group->max_members) {
            return response()->json([
                'success' => false,
                'message' => 'Study group has reached its maximum member capacity',
            ], 422);
        }

        DB::transaction(function () use ($group, $targetUserId, $validated) {
            $group->members()->create([
                'user_id' => $targetUserId,
                'role' => $validated['role'] ?? 'member',
                'joined_at' => now(),
            ]);

            if ($group->conversation_id && $group->conversation) {
                $group->conversation->participants()->firstOrCreate(
                    ['user_id' => $targetUserId],
                    ['role' => 'member', 'joined_at' => now()]
                );
            }
        });

        $group->load(['members.user', 'course'])->loadCount(['members', 'projects']);

        return response()->json([
            'success' => true,
            'message' => 'Member added successfully',
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Update a study group member's role (admin/creator only).
     */
    public function updateMemberRole(Request $request, int $id, int $user_id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group->isAdmin((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update member role',
            ], 403);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,moderator,member'],
        ]);

        if ((int) $group->creator_id === $user_id && $validated['role'] !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot downgrade the study group creator role',
            ], 422);
        }

        $member = $group->members()->where('user_id', $user_id)->firstOrFail();
        $member->update(['role' => $validated['role']]);

        $group->load(['members.user', 'course'])->loadCount(['members', 'projects']);

        return response()->json([
            'success' => true,
            'message' => 'Member role updated successfully',
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Remove a member or allow self-leave from a study group.
     */
    public function removeMember(Request $request, int $id, int $user_id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);
        $currentUser = $request->user();

        if ((int) $group->creator_id === $user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Creator cannot be removed from their own study group',
            ], 422);
        }

        if ((int) $currentUser->id !== $user_id && !$group->isAdmin((int) $currentUser->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to remove this member',
            ], 403);
        }

        DB::transaction(function () use ($group, $user_id) {
            $group->members()->where('user_id', $user_id)->delete();

            if ($group->conversation_id && $group->conversation) {
                $group->conversation->participants()->where('user_id', $user_id)->delete();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully',
        ]);
    }

    /**
     * Share a user's note to the study group.
     */
    public function shareNote(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);
        $user = $request->user();

        $validated = $request->validate([
            'note_id' => ['required', 'integer', 'exists:notes,id'],
        ]);

        $note = Note::where('id', $validated['note_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $group->sharedNotes()->syncWithoutDetaching([
            $note->id => ['shared_by' => $user->id],
        ]);

        $group->load(['sharedNotes']);

        return response()->json([
            'success' => true,
            'message' => 'Note shared to study group successfully',
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Unshare a note from the study group.
     */
    public function unshareNote(Request $request, int $id, int $note_id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);
        $user = $request->user();

        $pivot = DB::table('study_group_notes')
            ->where('study_group_id', $group->id)
            ->where('note_id', $note_id)
            ->first();

        if (!$pivot) {
            return response()->json(['success' => false, 'message' => 'Shared note not found'], 404);
        }

        if ((int) $pivot->shared_by !== (int) $user->id && !$group->isAdmin((int) $user->id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to unshare note'], 403);
        }

        $group->sharedNotes()->detach($note_id);

        return response()->json([
            'success' => true,
            'message' => 'Note unshared from study group successfully',
        ]);
    }

    /**
     * Share a course material to the study group.
     */
    public function shareMaterial(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);
        $user = $request->user();

        $validated = $request->validate([
            'material_id' => ['required', 'integer', 'exists:materials,id'],
        ]);

        $material = Material::where('id', $validated['material_id'])
            ->whereHas('course.semester', fn ($q) => $q->where('user_id', $user->id))
            ->firstOrFail();

        $group->sharedMaterials()->syncWithoutDetaching([
            $material->id => ['shared_by' => $user->id],
        ]);

        $group->load(['sharedMaterials']);

        return response()->json([
            'success' => true,
            'message' => 'Material shared to study group successfully',
            'data' => new StudyGroupResource($group),
        ]);
    }

    /**
     * Unshare a material from the study group.
     */
    public function unshareMaterial(Request $request, int $id, int $material_id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);
        $user = $request->user();

        $pivot = DB::table('study_group_materials')
            ->where('study_group_id', $group->id)
            ->where('material_id', $material_id)
            ->first();

        if (!$pivot) {
            return response()->json(['success' => false, 'message' => 'Shared material not found'], 404);
        }

        if ((int) $pivot->shared_by !== (int) $user->id && !$group->isAdmin((int) $user->id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to unshare material'], 403);
        }

        $group->sharedMaterials()->detach($material_id);

        return response()->json([
            'success' => true,
            'message' => 'Material unshared from study group successfully',
        ]);
    }
}
