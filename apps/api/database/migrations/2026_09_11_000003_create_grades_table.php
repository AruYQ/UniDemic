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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('grade_component_id')->nullable()->constrained('grade_components')->nullOnDelete();
            $table->string('name', 100);
            $table->decimal('score', 5, 2); // 0.00 - 100.00
            $table->decimal('weight', 5, 2)->nullable(); // optional custom weight (%)
            $table->timestamps();

            $table->index(['course_id', 'grade_component_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
