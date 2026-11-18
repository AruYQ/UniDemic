<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FlashcardDeck extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'flashcard_decks';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'course_id',
        'name',
        'description',
    ];

    /**
     * Get the user that owns the deck.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the optional course linked to the deck.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the cards in the deck.
     */
    public function cards(): HasMany
    {
        return $this->hasMany(Flashcard::class, 'deck_id');
    }

    /**
     * Get the cards that are due for review.
     */
    public function dueCards(): HasMany
    {
        return $this->hasMany(Flashcard::class, 'deck_id')
            ->where(function ($q) {
                $q->whereNull('next_review_at')
                  ->orWhere('next_review_at', '<=', now());
            });
    }
}
