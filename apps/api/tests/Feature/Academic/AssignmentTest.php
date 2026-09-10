<?php

namespace Tests\Feature\Academic;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_assignments(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Web Dev', 'credits' => 3]);
        $course->assignments()->create([
            'title' => 'Tugas 1 React Native',
            'deadline' => now()->addDays(3),
            'priority' => 'high',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/assignments");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Tugas 1 React Native');
    }

    public function test_user_can_create_assignment(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Calculus', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/assignments", [
                'title' => 'Latihan Integral',
                'description' => 'Kerjakan bab 5 no 1-10',
                'deadline' => '2026-10-15 23:59:00',
                'priority' => 'medium',
                'progress' => 0,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Latihan Integral')
            ->assertJsonPath('data.priority', 'medium')
            ->assertJsonPath('data.is_completed', false);

        $this->assertDatabaseHas('assignments', [
            'course_id' => $course->id,
            'title' => 'Latihan Integral',
            'is_completed' => false,
        ]);
    }

    public function test_user_can_update_assignment_progress_and_auto_complete(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Physics', 'credits' => 3]);
        $assignment = $course->assignments()->create([
            'title' => 'Laporan Praktikum',
            'progress' => 50,
            'is_completed' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/assignments/{$assignment->id}", [
                'progress' => 100,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.progress', 100)
            ->assertJsonPath('data.is_completed', true);

        $this->assertTrue($assignment->fresh()->is_completed);
    }

    public function test_user_can_delete_assignment(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'English', 'credits' => 2]);
        $assignment = $course->assignments()->create([
            'title' => 'Essay',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/assignments/{$assignment->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('assignments', ['id' => $assignment->id]);
    }
}
