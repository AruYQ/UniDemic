<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudyGroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'subject' => $this->subject,
            'course_id' => $this->course_id,
            'conversation_id' => $this->conversation_id,
            'creator_id' => $this->creator_id,
            'invite_code' => $this->invite_code,
            'is_public' => (bool) $this->is_public,
            'max_members' => $this->max_members,
            'avatar_url' => $this->avatar_url,
            'members_count' => $this->whenCounted('members'),
            'projects_count' => $this->whenCounted('projects'),
            'course' => new CourseResource($this->whenLoaded('course')),
            'members' => StudyGroupMemberResource::collection($this->whenLoaded('members')),
            'shared_notes' => NoteResource::collection($this->whenLoaded('sharedNotes')),
            'shared_materials' => MaterialResource::collection($this->whenLoaded('sharedMaterials')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
