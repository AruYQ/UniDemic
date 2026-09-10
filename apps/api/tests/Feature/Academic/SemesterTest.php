<?php

namespace Tests\Feature\Academic;

use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SemesterTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_own_semesters(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $user->semesters()->create([
            'name' => 'Ganjil 2026/2027',
            'is_active' => true,
        ]);
        $otherUser->semesters()->create([
            'name' => 'Semester Orang Lain',
            'is_active' => true,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/semesters');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ganjil 2026/2027');
    }

    public function test_user_can_create_semester(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/semesters', [
                'name' => 'Genap 2026/2027',
                'start_date' => '2027-02-01',
                'end_date' => '2027-06-30',
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Genap 2026/2027',
                    'is_active' => true,
                ],
            ]);

        $this->assertDatabaseHas('semesters', [
            'user_id' => $user->id,
            'name' => 'Genap 2026/2027',
            'is_active' => true,
        ]);
    }

    public function test_user_can_activate_semester_and_deactivate_others(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $sem1 = $user->semesters()->create(['name' => 'Sem 1', 'is_active' => true]);
        $sem2 = $user->semesters()->create(['name' => 'Sem 2', 'is_active' => false]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/semesters/{$sem2->id}/activate");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $sem2->id,
                    'is_active' => true,
                ],
            ]);

        $this->assertFalse($sem1->fresh()->is_active);
        $this->assertTrue($sem2->fresh()->is_active);
    }

    public function test_user_can_get_active_semester(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $user->semesters()->create(['name' => 'Sem 1', 'is_active' => false]);
        $user->semesters()->create(['name' => 'Sem Aktif', 'is_active' => true]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/semesters/active');

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Sem Aktif');
    }

    public function test_user_can_update_semester(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Old Name']);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/semesters/{$semester->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');

        $this->assertEquals('Updated Name', $semester->fresh()->name);
    }

    public function test_user_can_delete_semester(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'To Delete']);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/semesters/{$semester->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('semesters', ['id' => $semester->id]);
    }

    public function test_user_cannot_access_another_users_semester(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $token = $user->createToken('test')->plainTextToken;
        $otherSemester = $otherUser->semesters()->create(['name' => 'Private']);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/semesters/{$otherSemester->id}");

        $response->assertStatus(404);
    }
}
