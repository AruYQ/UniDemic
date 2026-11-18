<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectGithubRepo extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'repo_owner',
        'repo_name',
        'full_name',
        'default_branch',
        'html_url',
        'webhook_secret',
        'access_token',
        'last_synced_at',
    ];

    protected $hidden = [
        'webhook_secret',
        'access_token',
    ];

    protected function casts(): array
    {
        return [
            'webhook_secret' => 'encrypted',
            'access_token' => 'encrypted',
            'last_synced_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ProjectGithubActivity::class)->orderByDesc('occurred_at')->orderByDesc('id');
    }
}
