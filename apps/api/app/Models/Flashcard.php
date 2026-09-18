<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flashcard extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'flashcards';

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'ease_factor' => 2.50,
        'interval' => 0,
        'repetitions' => 0,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'deck_id',
        'question',
        'answer',
        'ease_factor',
        'interval',
        'repetitions',
        'next_review_at',
        'last_reviewed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ease_factor' => 'float',
            'interval' => 'integer',
            'repetitions' => 'integer',
            'next_review_at' => 'datetime',
            'last_reviewed_at' => 'datetime',
        ];
    }

    /**
     * Get the deck that owns the card.
     */
    public function deck(): BelongsTo
    {
        return $this->belongsTo(FlashcardDeck::class, 'deck_id');
    }

    /**
     * Apply review rating using the SuperMemo SM-2 Spaced Repetition algorithm.
     *
     * @param int $rating 1: Again, 2: Hard, 3: Good, 4: Easy
     */
    public function applyReview(int $rating): void
    {
        // Map 1-4 scale to SM-2 quality 0-5
        $quality = match ($rating) {
            1 => 1, // Again
            2 => 3, // Hard
            3 => 4, // Good
            4 => 5, // Easy
            default => 3,
        };

        $repetitions = $this->repetitions;
        $easeFactor = (float) ($this->ease_factor ?: 2.50);
        $interval = (int) ($this->interval ?: 0);

        if ($quality < 3) {
            // Failed recall: reset repetitions and interval to 1 day
            $repetitions = 0;
            $interval = 1;
        } else {
            // Successful recall
            if ($repetitions === 0) {
                $interval = 1;
            } elseif ($repetitions === 1) {
                $interval = 6;
            } else {
                $interval = max(1, (int) round($interval * $easeFactor));
            }
            $repetitions++;
        }

        // Calculate new ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        $diff = 5 - $quality;
        $newEf = $easeFactor + (0.1 - ($diff * (0.08 + ($diff * 0.02))));
        if ($newEf < 1.30) {
            $newEf = 1.30;
        }

        $now = Carbon::now();
        $this->update([
            'ease_factor' => round($newEf, 2),
            'interval' => $interval,
            'repetitions' => $repetitions,
            'last_reviewed_at' => $now,
            'next_review_at' => $now->copy()->addDays($interval),
        ]);
    }
}
