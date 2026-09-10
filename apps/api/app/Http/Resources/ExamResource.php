<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Exam
 */
class ExamResource extends JsonResource
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
            'course_id' => $this->course_id,
            'course_name' => $this->whenLoaded('course', fn () => $this->course->name),
            'course_code' => $this->whenLoaded('course', fn () => $this->course->code),
            'course_color' => $this->whenLoaded('course', fn () => $this->course->color),
            'type' => $this->type,
            'date' => $this->date?->format('Y-m-d'),
            'time' => $this->time,
            'location' => $this->location,
            'topics' => $this->topics,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
