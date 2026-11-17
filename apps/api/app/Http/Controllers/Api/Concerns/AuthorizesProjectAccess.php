<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Project;
use Illuminate\Http\Request;

trait AuthorizesProjectAccess
{
    /**
     * Find a project accessible to the authenticated user or abort with 404.
     */
    protected function findAccessibleProject(Request $request, int $projectId): Project
    {
        $userId = (int) $request->user()->id;

        return Project::where('id', $projectId)
            ->where(function ($query) use ($userId) {
                $query->where('creator_id', $userId)
                    ->orWhereHas('members', fn ($q) => $q->where('user_id', $userId))
                    ->orWhereHas('studyGroup.members', fn ($q) => $q->where('user_id', $userId));
            })
            ->firstOrFail();
    }
}
