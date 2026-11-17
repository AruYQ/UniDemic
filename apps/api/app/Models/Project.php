<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'study_group_id',
        'course_id',
        'creator_id',
        'name',
        'description',
        'status',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
        ];
    }

    public function studyGroup(): BelongsTo
    {
        return $this->belongsTo(StudyGroup::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(ProjectMilestone::class)->orderBy('order')->orderBy('id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class)->orderBy('position')->orderBy('id');
    }

    public function githubRepo(): HasOne
    {
        return $this->hasOne(ProjectGithubRepo::class);
    }

    /**
     * Check whether a user can access/collaborate on this project.
     */
    public function hasAccess(int $userId): bool
    {
        if ((int) $this->creator_id === $userId) {
            return true;
        }

        if ($this->members()->where('user_id', $userId)->exists()) {
            return true;
        }

        if ($this->study_group_id && $this->studyGroup?->isMember($userId)) {
            return true;
        }

        return false;
    }

    /**
     * Check whether a user can administer the project (settings, members, delete, GitHub).
     */
    public function isManager(int $userId): bool
    {
        if ((int) $this->creator_id === $userId) {
            return true;
        }

        if ($this->members()->where('user_id', $userId)->where('role', 'owner')->exists()) {
            return true;
        }

        if ($this->study_group_id && $this->studyGroup?->isAdmin($userId)) {
            return true;
        }

        return false;
    }
}
