<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAttemptResource extends JsonResource
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
            'quiz_id' => $this->quiz_id,
            'score' => (float) $this->score,
            'total_questions' => (int) $this->total_questions,
            'correct_answers' => (int) $this->correct_answers,
            'answers' => $this->answers ?? [],
            'completed_at' => $this->completed_at?->toISOString(),
            'quiz' => new QuizResource($this->whenLoaded('quiz')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
