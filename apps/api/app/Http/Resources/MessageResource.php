<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'content' => $this->deleted_at ? 'Pesan ini telah dihapus' : $this->content,
            'is_deleted' => !is_null($this->deleted_at),
            'type' => $this->type,
            'reply_to_id' => $this->reply_to_id,
            'reply_to' => $this->whenLoaded('replyTo', function () {
                if (!$this->replyTo) return null;
                return [
                    'id' => $this->replyTo->id,
                    'user_id' => $this->replyTo->user_id,
                    'content' => $this->replyTo->deleted_at ? 'Pesan ini telah dihapus' : $this->replyTo->content,
                    'is_deleted' => !is_null($this->replyTo->deleted_at),
                    'user' => [
                        'id' => $this->replyTo->user?->id,
                        'name' => $this->replyTo->user?->name,
                    ],
                ];
            }),
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'reference_data' => $this->academic_reference_data,
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'avatar_url' => $this->user?->avatar_url,
            ],
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'reactions' => MessageReactionResource::collection($this->whenLoaded('reactions')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
