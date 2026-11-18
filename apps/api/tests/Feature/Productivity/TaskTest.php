<?php

namespace Tests\Feature\Productivity;

use App\Models\Course;
use App\Models\Semester;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_their_tasks_with_filtering(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Algorithms', 'credits' => 3]);

        $task1 = $user->tasks()->create([
            'course_id' => $course->id,
            'title' => 'Read chapter 3',
            'priority' => 'high',
            'deadline' => '2026-09-20 12:00:00',
            'label' => 'reading',
            'is_completed' => false,
        ]);

        $task2 = $user->tasks()->create([
            'title' => 'Personal workout',
            'priority' => 'low',
            'label' => 'personal',
            'is_completed' => true,
        ]);

        // Filter by is_completed = false
        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/tasks?is_completed=false');

        $res->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $task1->id);

        // Filter by priority = low
        $res2 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/tasks?priority=low');

        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $task2->id);
    }

    public function test_user_can_create_task_with_subtasks(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Operating Systems', 'credits' => 3]);

        $payload = [
            'course_id' => $course->id,
            'title' => 'Build OS Kernel module',
            'priority' => 'urgent',
            'deadline' => '2026-09-25 23:59:00',
            'label' => 'project',
            'subtasks' => [
                ['title' => 'Setup environment', 'order' => 1],
                ['title' => 'Write driver code', 'order' => 2],
                ['title' => 'Run QEMU test', 'order' => 3],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/tasks', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Build OS Kernel module')
            ->assertJsonPath('data.priority', 'urgent')
            ->assertJsonPath('data.progress', 0)
            ->assertJsonPath('data.is_completed', false)
            ->assertJsonCount(3, 'data.subtasks');

        $this->assertDatabaseHas('productivity_tasks', [
            'user_id' => $user->id,
            'title' => 'Build OS Kernel module',
        ]);

        $this->assertDatabaseHas('task_subtasks', [
            'title' => 'Setup environment',
            'order' => 1,
            'is_done' => false,
        ]);
    }

    public function test_subtask_completion_updates_task_progress_automatically(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $task = $user->tasks()->create([
            'title' => 'Research Paper',
            'priority' => 'medium',
        ]);

        $sub1 = $task->subtasks()->create(['title' => 'Literature review', 'order' => 1, 'is_done' => false]);
        $sub2 = $task->subtasks()->create(['title' => 'Drafting', 'order' => 2, 'is_done' => false]);

        $this->assertEquals(0, $task->fresh()->progress);

        // Mark 1 of 2 subtasks done (50%)
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/subtasks/{$sub1->id}", ['is_done' => true])
            ->assertStatus(200);

        $this->assertEquals(50, $task->fresh()->progress);
        $this->assertFalse($task->fresh()->is_completed);

        // Mark 2 of 2 subtasks done (100% -> auto completed)
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/subtasks/{$sub2->id}", ['is_done' => true])
            ->assertStatus(200);

        $this->assertEquals(100, $task->fresh()->progress);
        $this->assertTrue($task->fresh()->is_completed);
        $this->assertNotNull($task->fresh()->completed_at);
    }

    public function test_user_can_toggle_task_complete(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $task = $user->tasks()->create([
            'title' => 'Pay Semester Fee',
            'is_completed' => false,
            'progress' => 0,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/tasks/{$task->id}/toggle-complete");

        $res->assertStatus(200)
            ->assertJsonPath('data.is_completed', true)
            ->assertJsonPath('data.progress', 100);

        $this->assertTrue($task->fresh()->is_completed);
    }

    public function test_user_can_add_subtask_to_existing_task(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $task = $user->tasks()->create(['title' => 'Clean room']);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/tasks/{$task->id}/subtasks", [
                'title' => 'Vacuum floor',
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.title', 'Vacuum floor')
            ->assertJsonPath('data.order', 1);

        $this->assertDatabaseHas('task_subtasks', [
            'task_id' => $task->id,
            'title' => 'Vacuum floor',
        ]);
    }

    public function test_user_can_delete_subtask_and_progress_recalculates(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $task = $user->tasks()->create(['title' => 'Coding Project']);
        $sub1 = $task->subtasks()->create(['title' => 'Task A', 'is_done' => true]);
        $sub2 = $task->subtasks()->create(['title' => 'Task B', 'is_done' => false]);

        $task->recalculateProgress();
        $this->assertEquals(50, $task->fresh()->progress);

        // Delete uncompleted subtask B -> now 1 of 1 is done -> progress becomes 100%
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/subtasks/{$sub2->id}")
            ->assertStatus(200);

        $this->assertEquals(100, $task->fresh()->progress);
        $this->assertTrue($task->fresh()->is_completed);
    }

    public function test_user_can_delete_task(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $task = $user->tasks()->create(['title' => 'Task to delete']);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/tasks/{$task->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('productivity_tasks', ['id' => $task->id]);
    }

    public function test_user_cannot_access_another_users_task(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $task = $user1->tasks()->create(['title' => 'Secret Task']);

        $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/tasks/{$task->id}")
            ->assertStatus(404);
    }
}
