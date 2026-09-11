<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
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
            'grade_component_id' => $this->grade_component_id,
            'name' => $this->name,
            'score' => (float) $this->score,
            'weight' => $this->weight !== null ? (float) $this->weight : null,
            'component' => new GradeComponentResource($this->whenLoaded('component')),
            'course' => new CourseResource($this->whenLoaded('course')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
