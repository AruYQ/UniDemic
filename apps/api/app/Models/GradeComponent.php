<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'name',
        'weight',
    ];

    protected function casts(): array
    {
        return [
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
     * Grades associated with this component.
     */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}
