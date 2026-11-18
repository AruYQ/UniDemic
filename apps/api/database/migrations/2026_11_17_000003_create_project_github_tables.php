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
        Schema::create('project_github_repos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->cascadeOnDelete();
            $table->string('repo_owner', 100);
            $table->string('repo_name', 150);
            $table->string('full_name', 255);
            $table->string('default_branch', 100)->default('main');
            $table->string('html_url');
            $table->text('webhook_secret')->nullable();
            $table->text('access_token')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['full_name']);
        });

        Schema::create('project_github_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_github_repo_id')->constrained('project_github_repos')->cascadeOnDelete();
            $table->string('type', 30); // commit, pull_request, issue, release
            $table->string('external_id', 100);
            $table->string('title');
            $table->string('author_name')->nullable();
            $table->string('author_avatar')->nullable();
            $table->string('url')->nullable();
            $table->string('state', 30)->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->unique(['project_github_repo_id', 'type', 'external_id'], 'pg_act_repo_type_ext_unique');
            $table->index(['project_github_repo_id', 'occurred_at'], 'pg_act_repo_occurred_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_github_activities');
        Schema::dropIfExists('project_github_repos');
    }
};
