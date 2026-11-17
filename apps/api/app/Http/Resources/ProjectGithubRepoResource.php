<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectGithubRepoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'repo_owner' => $this->repo_owner,
            'repo_name' => $this->repo_name,
            'full_name' => $this->full_name,
            'default_branch' => $this->default_branch,
            'html_url' => $this->html_url,
            'has_webhook_secret' => !empty($this->webhook_secret),
            'has_access_token' => !empty($this->access_token),
            'last_synced_at' => $this->last_synced_at?->toISOString(),
            'activities' => ProjectGithubActivityResource::collection($this->whenLoaded('activities')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
