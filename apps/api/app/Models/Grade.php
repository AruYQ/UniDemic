<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'grade_component_id',
        'name',
        'score',
        'weight',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'float',
            'weight' => 'float',
        ];
    }

    /**
     * Course relationship.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * GradeComponent relationship.
     */
    public function component(): BelongsTo
    {
        return $this->belongsTo(GradeComponent::class, 'grade_component_id');
    }
}
