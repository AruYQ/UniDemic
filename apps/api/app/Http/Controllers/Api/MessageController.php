<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageReactionUpdated;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communication\SendMessageRequest;
use App\Http\Requests\Communication\ToggleReactionRequest;
use App\Http\Requests\Communication\UpdateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Get user-accessible conversation or abort with 403/404.
     */
    protected function getConversation(Request $request, int $conversationId): Conversation
    {
        return Conversation::where('id', $conversationId)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Get message where user is participant of conversation.
     */
    protected function getMessage(Request $request, int $messageId): Message
    {
        return Message::where('id', $messageId)
            ->whereHas('conversation.participants', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Display messages for a conversation.
     */
    public function index(Request $request, int $conversation_id): JsonResponse
    {
        $conversation = $this->getConversation($request, $conversation_id);
        $user = $request->user();

        $query = $conversation->messages()
            ->with(['user', 'replyTo.user', 'attachments', 'reactions.user'])
            ->orderBy('created_at', 'asc');

        if ($request->has('limit')) {
            $query->limit((int) $request->query('limit'));
        }

        $messages = $query->get();

        // Update read status for the user
        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => MessageResource::collection($messages),
        ]);
    }

    /**
     * Send a new message to the conversation.
     */
    public function store(SendMessageRequest $request, int $conversation_id): JsonResponse
    {
        $conversation = $this->getConversation($request, $conversation_id);
        $user = $request->user();
        $validated = $request->validated();

        $message = DB::transaction(function () use ($conversation, $user, $validated, $request) {
            $msgType = $validated['type'] ?? 'text';
            if ($request->hasFile('files') && $msgType === 'text') {
                $msgType = 'file';
            }

            $message = $conversation->messages()->create([
                'user_id' => $user->id,
                'content' => $validated['content'],
                'type' => $msgType,
                'reply_to_id' => $validated['reply_to_id'] ?? null,
                'reference_type' => $validated['reference_type'] ?? null,
                'reference_id' => $validated['reference_id'] ?? null,
            ]);

            // Handle file attachments if any
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('chat_attachments', 'public');
                    $message->attachments()->create([
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'file_type' => $file->getClientMimeType(),
                    ]);
                }
            }

            // Update conversation last_message_at
            $conversation->update(['last_message_at' => now()]);

            // Update sender's last_read_at
            $conversation->participants()
                ->where('user_id', $user->id)
                ->update(['last_read_at' => now()]);

            return $message;
        });

        $message->load(['user', 'replyTo.user', 'attachments', 'reactions.user']);

        // Broadcast event (catches silently if queue / broadcast driver not configured)
        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable $e) {
            // Silently ignore broadcast transport failures in local/test
        }

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => new MessageResource($message),
        ], 201);
    }

    /**
     * Display a specific message.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $message = $this->getMessage($request, $id);
        $message->load(['user', 'replyTo.user', 'attachments', 'reactions.user']);

        return response()->json([
            'success' => true,
            'data' => new MessageResource($message),
        ]);
    }

    /**
     * Update an existing message (edit content).
     */
    public function update(UpdateMessageRequest $request, int $id): JsonResponse
    {
        $message = $this->getMessage($request, $id);
        $user = $request->user();

        if ($message->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own messages',
            ], 403);
        }

        $message->update($request->validated());
        $message->load(['user', 'replyTo.user', 'attachments', 'reactions.user']);

        return response()->json([
            'success' => true,
            'message' => 'Message updated successfully',
            'data' => new MessageResource($message),
        ]);
    }

    /**
     * Delete a message.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $message = $this->getMessage($request, $id);
        $user = $request->user();

        $conversation = $message->conversation;
        $isAdmin = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();

        if ($message->user_id !== $user->id && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this message',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }

    /**
     * Toggle an emoji reaction on a message.
     */
    public function toggleReaction(ToggleReactionRequest $request, int $id): JsonResponse
    {
        $message = $this->getMessage($request, $id);
        $user = $request->user();
        $emoji = $request->validated('emoji');

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
            $action = 'added';
        }

        $message->load(['user', 'replyTo.user', 'attachments', 'reactions.user']);

        try {
            broadcast(new MessageReactionUpdated($message, $action, $emoji, $user->id))->toOthers();
        } catch (\Throwable $e) {
            // Silently ignore broadcast transport failures
        }

        return response()->json([
            'success' => true,
            'message' => "Reaction {$action} successfully",
            'data' => new MessageResource($message),
        ]);
    }
}
