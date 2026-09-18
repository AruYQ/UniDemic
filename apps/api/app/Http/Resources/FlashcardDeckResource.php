<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FlashcardDeckResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'cards_count' => $this->cards_count ?? $this->cards()->count(),
            'due_cards_count' => $this->due_cards_count ?? $this->dueCards()->count(),
            'course' => new CourseResource($this->whenLoaded('course')),
            'cards' => FlashcardResource::collection($this->whenLoaded('cards')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
