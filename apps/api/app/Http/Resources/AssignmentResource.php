<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Assignment
 */
class AssignmentResource extends JsonResource
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
            'course' => new CourseResource($this->whenLoaded('course')),
            'course_name' => $this->whenLoaded('course', fn () => $this->course->name),
            'course_code' => $this->whenLoaded('course', fn () => $this->course->code),
            'course_color' => $this->whenLoaded('course', fn () => $this->course->color),
            'title' => $this->title,
            'description' => $this->description,
            'deadline' => $this->deadline?->toISOString(),
            'priority' => $this->priority,
            'progress' => (int) $this->progress,
            'is_completed' => (bool) $this->is_completed,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
