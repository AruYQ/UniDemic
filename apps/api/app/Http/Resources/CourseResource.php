<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Course
 */
class CourseResource extends JsonResource
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
            'semester_id' => $this->semester_id,
            'semester_name' => $this->whenLoaded('semester', fn () => $this->semester->name),
            'name' => $this->name,
            'code' => $this->code,
            'lecturer' => $this->lecturer,
            'credits' => (int) $this->credits,
            'classroom' => $this->classroom,
            'color' => $this->color ?? '#6B7FD7',
            'schedules' => CourseScheduleResource::collection($this->whenLoaded('schedules')),
            'assignments' => AssignmentResource::collection($this->whenLoaded('assignments')),
            'exams' => ExamResource::collection($this->whenLoaded('exams')),
            'schedules_count' => $this->schedules_count ?? $this->schedules()->count(),
            'assignments_count' => $this->assignments_count ?? $this->assignments()->count(),
            'exams_count' => $this->exams_count ?? $this->exams()->count(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
