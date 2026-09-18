<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flashcard_decks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'course_id']);
        });

        Schema::create('flashcards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deck_id')->constrained('flashcard_decks')->cascadeOnDelete();
            $table->text('question');
            $table->text('answer');
            $table->decimal('ease_factor', 4, 2)->default(2.50);
            $table->unsignedInteger('interval')->default(0); // in days
            $table->unsignedInteger('repetitions')->default(0);
            $table->timestamp('next_review_at')->nullable();
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['deck_id', 'next_review_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flashcards');
        Schema::dropIfExists('flashcard_decks');
    }
};
