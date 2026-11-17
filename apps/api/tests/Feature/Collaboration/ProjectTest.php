<?php

namespace Tests\Feature\Collaboration;

use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_project_and_collaborate_via_study_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        $tokenOwner = $owner->createToken('test')->plainTextToken;
        $tokenMember = $member->createToken('test')->plainTextToken;
        $tokenOutsider = $outsider->createToken('test')->plainTextToken;

        // Create study group and add member
        $groupRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson('/api/study-groups', ['name' => 'Capstone Team']);
        $groupId = $groupRes->json('data.id');

        $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson("/api/study-groups/{$groupId}/members", ['user_id' => $member->id]);

        // Owner creates project under study group
        $projRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson('/api/projects', [
                'name' => 'UniDemic Mobile App',
                'description' => 'Final semester software engineering project',
                'study_group_id' => $groupId,
                'status' => 'active',
                'due_date' => '2026-12-20',
            ]);

        $projRes->assertStatus(201)
            ->assertJsonPath('data.name', 'UniDemic Mobile App')
            ->assertJsonPath('data.study_group_id', $groupId);
        $projectId = $projRes->json('data.id');

        // Study group member can list & view the project
        $this->flushHeaders();
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$tokenMember)
            ->getJson('/api/projects')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->withHeader('Authorization', 'Bearer '.$tokenMember)
            ->getJson("/api/projects/{$projectId}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $projectId);

        // Non-manager group member cannot delete project
        $this->withHeader('Authorization', 'Bearer '.$tokenMember)
            ->deleteJson("/api/projects/{$projectId}")
            ->assertStatus(403);

        // Outsider cannot see project
        $this->flushHeaders();
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$tokenOutsider)
            ->getJson("/api/projects/{$projectId}")
            ->assertStatus(404);
    }

    public function test_manager_can_add_and_remove_project_members(): void
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $tokenOwner = $owner->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson('/api/projects', ['name' => 'Distributed Systems Lab']);
        $projectId = $projRes->json('data.id');

        $addRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson("/api/projects/{$projectId}/members", [
                'user_id' => $editor->id,
                'role' => 'editor',
            ]);
        $addRes->assertStatus(200)
            ->assertJsonCount(2, 'data.members');

        $removeRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->deleteJson("/api/projects/{$projectId}/members/{$editor->id}");
        $removeRes->assertStatus(200);

        $this->assertDatabaseMissing('project_members', [
            'project_id' => $projectId,
            'user_id' => $editor->id,
        ]);
    }
}
