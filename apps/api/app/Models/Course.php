<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'semester_id',
        'name',
        'code',
        'lecturer',
        'credits',
        'classroom',
        'color',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'credits' => 'integer',
        ];
    }

    /**
     * Get the semester that owns the course.
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    /**
     * Get all schedules for this course.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(CourseSchedule::class);
    }

    /**
     * Get all assignments for this course.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Get all exams for this course.
     */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    /**
     * Get all attendance records for this course.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get all grade components configured for this course.
     */
    public function gradeComponents(): HasMany
    {
        return $this->hasMany(GradeComponent::class);
    }

    /**
     * Get all grades recorded for this course.
     */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}

