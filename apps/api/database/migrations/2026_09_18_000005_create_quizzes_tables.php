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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('time_limit_minutes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'course_id']);
        });

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->string('type', 30)->default('multiple_choice'); // multiple_choice, true_false, short_answer
            $table->text('question');
            $table->json('options')->nullable(); // array of option strings for multiple choice
            $table->text('correct_answer');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('order')->default(1);
            $table->timestamps();

            $table->index(['quiz_id', 'order']);
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->decimal('score', 5, 2); // 0.00 to 100.00
            $table->unsignedInteger('total_questions');
            $table->unsignedInteger('correct_answers');
            $table->json('answers'); // question_id -> user answer, is_correct
            $table->timestamp('completed_at');
            $table->timestamps();

            $table->index(['user_id', 'quiz_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
    }
};
