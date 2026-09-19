<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'messages';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'conversation_id',
        'user_id',
        'content',
        'type',
        'reply_to_id',
        'reference_type',
        'reference_id',
    ];

    /**
     * Get the conversation of the message.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the author user of the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent message being replied to.
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    /**
     * Get the replies to this message.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Get the reactions for the message.
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * Resolve academic reference details dynamically if referenced.
     */
    public function getAcademicReferenceDataAttribute(): ?array
    {
        if (!$this->reference_type || !$this->reference_id) {
            return null;
        }

        return match ($this->reference_type) {
            'course' => ($c = Course::find($this->reference_id)) ? ['id' => $c->id, 'title' => $c->name, 'code' => $c->code] : null,
            'assignment' => ($a = Assignment::find($this->reference_id)) ? ['id' => $a->id, 'title' => $a->title, 'deadline' => $a->deadline] : null,
            'exam' => ($e = Exam::find($this->reference_id)) ? ['id' => $e->id, 'title' => $e->name, 'date' => $e->date] : null,
            'material' => ($m = Material::find($this->reference_id)) ? ['id' => $m->id, 'title' => $m->title, 'type' => $m->type] : null,
            'note' => ($n = Note::find($this->reference_id)) ? ['id' => $n->id, 'title' => $n->title] : null,
            'task' => ($t = Task::find($this->reference_id)) ? ['id' => $t->id, 'title' => $t->title, 'priority' => $t->priority] : null,
            default => null,
        };
    }
}
