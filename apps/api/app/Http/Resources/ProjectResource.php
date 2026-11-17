<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'study_group_id' => $this->study_group_id,
            'course_id' => $this->course_id,
            'creator_id' => $this->creator_id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'tasks_count' => $this->whenCounted('tasks'),
            'milestones_count' => $this->whenCounted('milestones'),
            'study_group' => new StudyGroupResource($this->whenLoaded('studyGroup')),
            'course' => new CourseResource($this->whenLoaded('course')),
            'members' => ProjectMemberResource::collection($this->whenLoaded('members')),
            'milestones' => ProjectMilestoneResource::collection($this->whenLoaded('milestones')),
            'tasks' => ProjectTaskResource::collection($this->whenLoaded('tasks')),
            'github_repo' => new ProjectGithubRepoResource($this->whenLoaded('githubRepo')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
