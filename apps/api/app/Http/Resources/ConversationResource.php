<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        // For direct messages, dynamic name and avatar can be the other participant
        $displayName = $this->name;
        $displayAvatar = $this->avatar_url;

        if ($this->type === 'direct' && $user) {
            $otherParticipant = $this->participants->firstWhere('user_id', '!=', $user->id);
            if ($otherParticipant && $otherParticipant->user) {
                $displayName = $displayName ?: $otherParticipant->user->name;
                $displayAvatar = $displayAvatar ?: $otherParticipant->user->avatar_url;
            }
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $displayName,
            'description' => $this->description,
            'course_id' => $this->course_id,
            'avatar_url' => $displayAvatar,
            'created_by' => $this->created_by,
            'course' => new CourseResource($this->whenLoaded('course')),
            'participants' => ConversationParticipantResource::collection($this->whenLoaded('participants')),
            'last_message' => new MessageResource($this->whenLoaded('lastMessage')),
            'last_message_at' => $this->last_message_at?->toISOString(),
            'unread_count' => $user ? $this->unreadCountFor($user) : 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
