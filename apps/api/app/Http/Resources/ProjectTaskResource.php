<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectTaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'milestone_id' => $this->milestone_id,
            'creator_id' => $this->creator_id,
            'assignee_id' => $this->assignee_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'position' => $this->position,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'labels' => $this->labels ?? [],
            'assignee' => $this->whenLoaded('assignee', function () {
                if (!$this->assignee) return null;
                return [
                    'id' => $this->assignee->id,
                    'name' => $this->assignee->name,
                    'avatar_url' => $this->assignee->avatar_url,
                ];
            }),
            'creator' => $this->whenLoaded('creator', function () {
                if (!$this->creator) return null;
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'avatar_url' => $this->creator->avatar_url,
                ];
            }),
            'milestone' => new ProjectMilestoneResource($this->whenLoaded('milestone')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
