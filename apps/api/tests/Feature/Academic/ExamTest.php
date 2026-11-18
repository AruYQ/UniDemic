<?php

namespace Tests\Feature\Academic;

use App\Models\Course;
use App\Models\Exam;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_exams(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Database', 'credits' => 3]);
        $course->exams()->create([
            'type' => 'UTS',
            'date' => '2026-10-20',
            'time' => '08:00',
            'location' => 'Gedung A R.301',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/exams");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'UTS');
    }

    public function test_user_can_create_exam(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Linear Algebra', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/exams", [
                'type' => 'UAS',
                'date' => '2026-12-15',
                'time' => '10:00',
                'location' => 'Auditorium',
                'topics' => 'Matriks, Vektor, Eigenvalue',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'UAS')
            ->assertJsonPath('data.location', 'Auditorium');

        $this->assertDatabaseHas('exams', [
            'course_id' => $course->id,
            'type' => 'UAS',
        ]);
        $this->assertEquals('2026-12-15', Exam::first()->date->format('Y-m-d'));
    }

    public function test_user_can_update_exam(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Statistics', 'credits' => 3]);
        $exam = $course->exams()->create([
            'type' => 'Quiz 1',
            'date' => '2026-09-25',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/exams/{$exam->id}", [
                'type' => 'Quiz 2',
                'location' => 'Online LMS',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.type', 'Quiz 2')
            ->assertJsonPath('data.location', 'Online LMS');

        $this->assertEquals('Quiz 2', $exam->fresh()->type);
    }

    public function test_user_can_delete_exam(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Networks', 'credits' => 3]);
        $exam = $course->exams()->create([
            'type' => 'Praktikum',
            'date' => '2026-11-01',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/exams/{$exam->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('exams', ['id' => $exam->id]);
    }
}
