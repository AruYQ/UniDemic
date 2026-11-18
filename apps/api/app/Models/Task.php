<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'productivity_tasks';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'course_id',
        'title',
        'description',
        'priority',
        'deadline',
        'label',
        'is_recurring',
        'recurrence_pattern',
        'progress',
        'is_completed',
        'completed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deadline' => 'datetime',
            'is_recurring' => 'boolean',
            'progress' => 'integer',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the task.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the optional course linked to the task.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the subtasks for the task.
     */
    public function subtasks(): HasMany
    {
        return $this->hasMany(TaskSubtask::class, 'task_id')->orderBy('order')->orderBy('id');
    }

    /**
     * Get the study sessions associated with this task.
     */
    public function studySessions(): HasMany
    {
        return $this->hasMany(StudySession::class, 'task_id');
    }

    /**
     * Recalculate task progress based on subtasks completion.
     */
    public function recalculateProgress(): void
    {
        $total = $this->subtasks()->count();
        if ($total === 0) {
            return;
        }

        $done = $this->subtasks()->where('is_done', true)->count();
        $progress = (int) round(($done / $total) * 100);
        $isCompleted = $progress === 100;

        $this->update([
            'progress' => $progress,
            'is_completed' => $isCompleted,
            'completed_at' => $isCompleted ? ($this->completed_at ?? now()) : null,
        ]);
    }
}
