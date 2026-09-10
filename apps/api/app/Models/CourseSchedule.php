<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseSchedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'course_id',
        'day',
        'start_time',
        'end_time',
        'room',
    ];

    /**
     * Get the course that owns the schedule.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
