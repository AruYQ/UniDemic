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
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->string('type', 20)->default('pdf'); // pdf, slide, doc, link, video, other
            $table->string('file_path')->nullable();
            $table->unsignedBigInteger('file_size')->nullable(); // bytes
            $table->string('url')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
