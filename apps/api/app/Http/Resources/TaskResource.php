<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Task
 */
class TaskResource extends JsonResource
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
            'course' => new CourseResource($this->whenLoaded('course')),
            'course_name' => $this->whenLoaded('course', fn () => $this->course->name),
            'course_code' => $this->whenLoaded('course', fn () => $this->course->code),
            'course_color' => $this->whenLoaded('course', fn () => $this->course->color),
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'deadline' => $this->deadline?->toISOString(),
            'label' => $this->label,
            'is_recurring' => (bool) $this->is_recurring,
            'recurrence_pattern' => $this->recurrence_pattern,
            'progress' => (int) $this->progress,
            'is_completed' => (bool) $this->is_completed,
            'completed_at' => $this->completed_at?->toISOString(),
            'subtasks_count' => $this->whenCounted('subtasks'),
            'subtasks' => TaskSubtaskResource::collection($this->whenLoaded('subtasks')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
