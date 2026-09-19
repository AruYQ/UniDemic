<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageAttachmentResource extends JsonResource
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
            'message_id' => $this->message_id,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'file_size' => (int) $this->file_size,
            'file_type' => $this->file_type,
            'file_url' => $this->file_url,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
