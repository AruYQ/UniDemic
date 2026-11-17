<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectGithubActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_github_repo_id' => $this->project_github_repo_id,
            'type' => $this->type,
            'external_id' => $this->external_id,
            'title' => $this->title,
            'author_name' => $this->author_name,
            'author_avatar' => $this->author_avatar,
            'url' => $this->url,
            'state' => $this->state,
            'occurred_at' => $this->occurred_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
