<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectGithubActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_github_repo_id',
        'type',
        'external_id',
        'title',
        'author_name',
        'author_avatar',
        'url',
        'state',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
        ];
    }

    public function repo(): BelongsTo
    {
        return $this->belongsTo(ProjectGithubRepo::class, 'project_github_repo_id');
    }
}
