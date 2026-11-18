<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\StudySession
 */
class StudySessionResource extends JsonResource
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
            'task_id' => $this->task_id,
            'task' => new TaskResource($this->whenLoaded('task')),
            'task_title' => $this->whenLoaded('task', fn () => $this->task->title),
            'type' => $this->type,
            'duration_minutes' => (int) $this->duration_minutes,
            'started_at' => $this->started_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'notes' => $this->notes,
            'is_completed' => (bool) $this->is_completed,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
