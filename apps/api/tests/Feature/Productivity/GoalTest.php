<?php

namespace Tests\Feature\Productivity;

use App\Models\Goal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoalTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_goal(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $payload = [
            'title' => 'Read 10 Research Papers',
            'description' => 'For Machine Learning thesis',
            'type' => 'monthly',
            'target_value' => 10,
            'current_value' => 2,
            'unit' => 'papers',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ];

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/goals', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.title', 'Read 10 Research Papers')
            ->assertJsonPath('data.target_value', fn ($val) => (float) $val == 10.0)
            ->assertJsonPath('data.current_value', fn ($val) => (float) $val == 2.0)
            ->assertJsonPath('data.unit', 'papers')
            ->assertJsonPath('data.is_completed', false);

        $this->assertDatabaseHas('goals', [
            'user_id' => $user->id,
            'title' => 'Read 10 Research Papers',
        ]);
    }

    public function test_user_can_list_and_filter_goals(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $goal1 = $user->goals()->create([
            'title' => 'Weekly Study 20h',
            'type' => 'weekly',
            'target_value' => 20,
            'current_value' => 10,
            'unit' => 'hours',
            'is_completed' => false,
        ]);

        $goal2 = $user->goals()->create([
            'title' => 'Semester GPA 3.8',
            'type' => 'semester',
            'target_value' => 3.8,
            'current_value' => 3.8,
            'unit' => 'IPK',
            'is_completed' => true,
        ]);

        // Filter by type
        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/goals?type=weekly');

        $res->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $goal1->id);

        // Filter by is_completed
        $res2 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/goals?is_completed=true');

        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $goal2->id);
    }

    public function test_updating_current_value_to_target_auto_completes_goal(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $goal = $user->goals()->create([
            'title' => 'Solve 50 LeetCode problems',
            'type' => 'monthly',
            'target_value' => 50,
            'current_value' => 45,
            'unit' => 'problems',
            'is_completed' => false,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/goals/{$goal->id}/progress", [
                'current_value' => 50,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.current_value', fn ($val) => (float) $val == 50.0)
            ->assertJsonPath('data.is_completed', true);

        $this->assertTrue($goal->fresh()->is_completed);
    }

    public function test_user_can_update_goal_details(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $goal = $user->goals()->create([
            'title' => 'Exercise 3x a week',
            'type' => 'weekly',
            'target_value' => 3,
            'current_value' => 1,
            'unit' => 'times',
            'is_completed' => false,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/goals/{$goal->id}", [
                'title' => 'Exercise 4x a week',
                'target_value' => 4,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.title', 'Exercise 4x a week')
            ->assertJsonPath('data.target_value', fn ($val) => (float) $val == 4.0);
    }

    public function test_user_can_delete_goal(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $goal = $user->goals()->create([
            'title' => 'Old Goal',
            'type' => 'custom',
            'target_value' => 1,
            'current_value' => 0,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/goals/{$goal->id}");

        $res->assertStatus(200);
        $this->assertDatabaseMissing('goals', ['id' => $goal->id]);
    }

    public function test_user_cannot_access_another_users_goal(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $goal1 = $user1->goals()->create([
            'title' => 'Private Goal',
            'type' => 'weekly',
            'target_value' => 10,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/goals/{$goal1->id}")
            ->assertStatus(404);
    }
}
