<?php

namespace Tests\Feature\Collaboration;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KanbanAndMilestoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_milestones_crud_and_completion_tracking(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/projects', ['name' => 'Research Paper']);
        $projectId = $projRes->json('data.id');

        $mRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/milestones", [
                'title' => 'Literature Review',
                'description' => 'Collect 15 peer-reviewed papers',
                'due_date' => '2026-12-01',
            ]);

        $mRes->assertStatus(201)
            ->assertJsonPath('data.title', 'Literature Review')
            ->assertJsonPath('data.is_completed', false);
        $milestoneId = $mRes->json('data.id');

        // Toggle complete
        $toggleRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/milestones/{$milestoneId}/toggle-complete");
        $toggleRes->assertStatus(200)
            ->assertJsonPath('data.is_completed', true);

        // List milestones
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/projects/{$projectId}/milestones")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // Delete milestone
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/milestones/{$milestoneId}")
            ->assertStatus(200);
    }

    public function test_kanban_tasks_creation_move_and_batch_reorder(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $token = $owner->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/projects', ['name' => 'Kanban Project']);
        $projectId = $projRes->json('data.id');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/members", [
                'user_id' => $collaborator->id,
                'role' => 'editor',
            ]);

        // Create 3 tasks in 'todo'
        $t1 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/tasks", [
                'title' => 'Design Database Schema',
                'assignee_id' => $collaborator->id,
                'priority' => 'high',
                'labels' => ['backend', 'db'],
            ])->assertStatus(201)->json('data');

        $t2 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/tasks", [
                'title' => 'Build REST Endpoints',
                'priority' => 'urgent',
            ])->assertStatus(201)->json('data');

        $t3 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/tasks", [
                'title' => 'Write Unit Tests',
            ])->assertStatus(201)->json('data');

        $this->assertEquals(0, $t1['position']);
        $this->assertEquals(1, $t2['position']);
        $this->assertEquals(2, $t3['position']);

        // Move task 1 to 'in_progress' at position 0
        $moveRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/project-tasks/{$t1['id']}/move", [
                'status' => 'in_progress',
                'position' => 0,
            ]);
        $moveRes->assertStatus(200)
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.position', 0);

        // Source column ('todo') should re-index to [0, 1]
        $todoTasks = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/projects/{$projectId}/tasks?status=todo")
            ->assertStatus(200)
            ->json('data');
        $this->assertCount(2, $todoTasks);
        $this->assertEquals(0, $todoTasks[0]['position']);
        $this->assertEquals(1, $todoTasks[1]['position']);

        // Batch reorder across columns
        $reorderRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/tasks/reorder", [
                'tasks' => [
                    ['id' => $t1['id'], 'status' => 'done', 'position' => 0],
                    ['id' => $t2['id'], 'status' => 'in_progress', 'position' => 0],
                    ['id' => $t3['id'], 'status' => 'todo', 'position' => 0],
                ],
            ]);
        $reorderRes->assertStatus(200);

        $this->assertDatabaseHas('project_tasks', [
            'id' => $t1['id'],
            'status' => 'done',
            'position' => 0,
        ]);
    }

    public function test_viewer_cannot_mutate_kanban_tasks(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $tokenOwner = $owner->createToken('test')->plainTextToken;
        $tokenViewer = $viewer->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson('/api/projects', ['name' => 'Read Only Test']);
        $projectId = $projRes->json('data.id');

        $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson("/api/projects/{$projectId}/members", [
                'user_id' => $viewer->id,
                'role' => 'viewer',
            ]);

        $this->flushHeaders();
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$tokenViewer)
            ->postJson("/api/projects/{$projectId}/tasks", ['title' => 'Unauthorized Task'])
            ->assertStatus(403);
    }
}
