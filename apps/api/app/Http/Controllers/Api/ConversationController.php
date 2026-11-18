<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Communication\AddParticipantRequest;
use App\Http\Requests\Communication\StoreConversationRequest;
use App\Http\Requests\Communication\UpdateConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    /**
     * Get conversation where user is a participant or abort with 404.
     */
    protected function getUserConversation(Request $request, int $id): Conversation
    {
        return Conversation::where('id', $id)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Display a listing of user conversations.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with(['participants.user', 'lastMessage.user', 'course']);

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        $conversations = $query->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ConversationResource::collection($conversations),
        ]);
    }

    /**
     * Store a newly created conversation.
     */
    public function store(StoreConversationRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $type = $validated['type'];
        $participantIds = array_values(array_unique($validated['participant_ids']));

        // Prevent direct DM duplication
        if ($type === 'direct') {
            $otherUserIds = array_values(array_filter($participantIds, fn ($id) => (int) $id !== (int) $user->id));
            $otherUserId = $otherUserIds[0] ?? null;

            if (!$otherUserId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot create direct conversation with yourself or invalid recipient.',
                ], 422);
            }

            $existing = Conversation::where('type', 'direct')
                ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
                ->whereHas('participants', fn ($q) => $q->where('user_id', $otherUserId))
                ->with(['participants.user', 'lastMessage.user', 'course'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => true,
                    'message' => 'Direct conversation already exists',
                    'data' => new ConversationResource($existing),
                ]);
            }
        }

        $conversation = DB::transaction(function () use ($user, $validated, $participantIds, $type) {
            $conversation = Conversation::create([
                'type' => $type,
                'name' => $validated['name'] ?? null,
                'description' => $validated['description'] ?? null,
                'course_id' => $validated['course_id'] ?? null,
                'created_by' => $user->id,
            ]);

            // Add creator as admin
            $conversation->participants()->create([
                'user_id' => $user->id,
                'role' => 'admin',
                'joined_at' => now(),
                'last_read_at' => now(),
            ]);

            // Add other participants as members
            foreach ($participantIds as $pId) {
                if ($pId !== $user->id) {
                    $conversation->participants()->create([
                        'user_id' => $pId,
                        'role' => 'member',
                        'joined_at' => now(),
                        'last_read_at' => null,
                    ]);
                }
            }

            return $conversation;
        });

        $conversation->load(['participants.user', 'lastMessage.user', 'course']);

        return response()->json([
            'success' => true,
            'message' => 'Conversation created successfully',
            'data' => new ConversationResource($conversation),
        ], 201);
    }

    /**
     * Display the specified conversation details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $conversation = $this->getUserConversation($request, $id);
        $conversation->load(['participants.user', 'lastMessage.user', 'course']);

        return response()->json([
            'success' => true,
            'data' => new ConversationResource($conversation),
        ]);
    }

    /**
     * Update the specified conversation (group/channel details).
     */
    public function update(UpdateConversationRequest $request, int $id): JsonResponse
    {
        $conversation = $this->getUserConversation($request, $id);
        $user = $request->user();

        // Check if user is admin if it's a group or course channel
        if ($conversation->type !== 'direct') {
            $isAdmin = $conversation->participants()
                ->where('user_id', $user->id)
                ->where('role', 'admin')
                ->exists();

            if (!$isAdmin && $conversation->created_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only conversation admins can update group settings',
                ], 403);
            }
        }

        $conversation->update($request->validated());
        $conversation->load(['participants.user', 'lastMessage.user', 'course']);

        return response()->json([
            'success' => true,
            'message' => 'Conversation updated successfully',
            'data' => new ConversationResource($conversation),
        ]);
    }

    /**
     * Leave or delete a conversation.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $conversation = $this->getUserConversation($request, $id);
        $user = $request->user();

        // Remove participant
        $conversation->participants()->where('user_id', $user->id)->delete();

        // If no participants left, delete conversation
        if ($conversation->participants()->count() === 0) {
            $conversation->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Left conversation successfully',
        ]);
    }

    /**
     * Add participants to group/course conversation.
     */
    public function addParticipants(AddParticipantRequest $request, int $id): JsonResponse
    {
        $conversation = $this->getUserConversation($request, $id);

        $user = $request->user();

        if ($conversation->type === 'direct') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot add participants to a direct message',
            ], 422);
        }

        $isAdmin = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();

        if (!$isAdmin && $conversation->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to add participants',
            ], 403);
        }

        $userIds = $request->validated('user_ids');
        $role = $request->validated('role', 'member');

        foreach ($userIds as $uId) {
            $exists = $conversation->participants()->where('user_id', $uId)->exists();
            if (!$exists) {
                $conversation->participants()->create([
                    'user_id' => $uId,
                    'role' => $role,
                    'joined_at' => now(),
                ]);
            }
        }

        $conversation->load(['participants.user', 'lastMessage.user', 'course']);

        return response()->json([
            'success' => true,
            'message' => 'Participants added successfully',
            'data' => new ConversationResource($conversation),
        ]);
    }

    /**
     * Remove a participant from the conversation.
     */
    public function removeParticipant(Request $request, int $id, int $user_id): JsonResponse
    {
        $conversation = $this->getUserConversation($request, $id);
        $currentUser = $request->user();

        if ($currentUser->id !== $user_id) {
            $isAdmin = $conversation->participants()
                ->where('user_id', $currentUser->id)
                ->where('role', 'admin')
                ->exists();

            if (!$isAdmin && $conversation->created_by !== $currentUser->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only admins can remove other participants',
                ], 403);
            }
        }

        $conversation->participants()->where('user_id', $user_id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Participant removed successfully',
        ]);
    }

    /**
     * Mark conversation as read for the authenticated user.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $conversation = $this->getUserConversation($request, $id);
        $user = $request->user();

        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Conversation marked as read',
        ]);
    }
}
