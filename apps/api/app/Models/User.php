<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'bio',
        'university',
        'major',
        'student_id',
        'phone',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
        ];
    }

    /**
     * Get all semesters belonging to the user.
     */
    public function semesters(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Semester::class);
    }

    /**
     * Get the user's currently active semester.
     */
    public function activeSemester(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Semester::class)->where('is_active', true);
    }

    /**
     * Get all productivity tasks belonging to the user.
     */
    public function tasks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get all study sessions belonging to the user.
     */
    public function studySessions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StudySession::class);
    }

    /**
     * Get all productivity goals belonging to the user.
     */
    public function goals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Goal::class);
    }

    /**
     * Get all learning notes belonging to the user.
     */
    public function notes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get all flashcard decks belonging to the user.
     */
    public function flashcardDecks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(FlashcardDeck::class);
    }

    /**
     * Get all quizzes belonging to the user.
     */
    public function quizzes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * Get all quiz attempts made by the user.
     */
    public function quizAttempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }
}

