<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
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
            'user_id' => $this->user_id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'content' => $this->content,
            'tags' => $this->tags ?? [],
            'is_pinned' => (bool) $this->is_pinned,
            'color' => $this->color,
            'course' => new CourseResource($this->whenLoaded('course')),
            'linked_notes' => NoteResource::collection($this->whenLoaded('linkedNotes')),
            'backlinks' => NoteResource::collection($this->whenLoaded('backlinks')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
