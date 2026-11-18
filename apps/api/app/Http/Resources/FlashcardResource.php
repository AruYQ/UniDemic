<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FlashcardResource extends JsonResource
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
            'deck_id' => $this->deck_id,
            'question' => $this->question,
            'answer' => $this->answer,
            'ease_factor' => (float) $this->ease_factor,
            'interval' => (int) $this->interval,
            'repetitions' => (int) $this->repetitions,
            'next_review_at' => $this->next_review_at?->toISOString(),
            'last_reviewed_at' => $this->last_reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
