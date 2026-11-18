<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class StudyGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'subject',
        'course_id',
        'conversation_id',
        'creator_id',
        'invite_code',
        'is_public',
        'max_members',
        'avatar_url',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'max_members' => 'integer',
        ];
    }

    /**
     * Generate a unique uppercase invite code.
     */
    public static function generateInviteCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('invite_code', $code)->exists());

        return $code;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(StudyGroupMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'study_group_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function sharedNotes(): BelongsToMany
    {
        return $this->belongsToMany(Note::class, 'study_group_notes')
            ->withPivot(['shared_by'])
            ->withTimestamps();
    }

    public function sharedMaterials(): BelongsToMany
    {
        return $this->belongsToMany(Material::class, 'study_group_materials')
            ->withPivot(['shared_by'])
            ->withTimestamps();
    }

    public function isMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    public function isAdmin(int $userId): bool
    {
        if ((int) $this->creator_id === $userId) {
            return true;
        }

        return $this->members()
            ->where('user_id', $userId)
            ->where('role', 'admin')
            ->exists();
    }
}
