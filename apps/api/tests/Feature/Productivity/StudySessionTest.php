<?php

namespace Tests\Feature\Productivity;

use App\Models\Course;
use App\Models\Semester;
use App\Models\StudySession;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudySessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_record_study_session(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Calculus I', 'credits' => 3]);
        $task = $user->tasks()->create(['title' => 'Calculus Homework 1']);

        $payload = [
            'course_id' => $course->id,
            'task_id' => $task->id,
            'type' => 'pomodoro',
            'duration_minutes' => 25,
            'started_at' => now()->subMinutes(25)->toISOString(),
            'ended_at' => now()->toISOString(),
            'notes' => 'Finished limits problems',
        ];

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/study-sessions', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.duration_minutes', 25)
            ->assertJsonPath('data.type', 'pomodoro')
            ->assertJsonPath('data.course_name', 'Calculus I')
            ->assertJsonPath('data.task_title', 'Calculus Homework 1');

        $this->assertDatabaseHas('study_sessions', [
            'user_id' => $user->id,
            'duration_minutes' => 25,
            'notes' => 'Finished limits problems',
        ]);
    }

    public function test_user_can_list_study_sessions(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $user->studySessions()->createMany([
            [
                'type' => 'pomodoro',
                'duration_minutes' => 25,
                'started_at' => now()->subHours(2),
                'is_completed' => true,
            ],
            [
                'type' => 'custom',
                'duration_minutes' => 60,
                'started_at' => now()->subHours(1),
                'is_completed' => true,
            ],
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/study-sessions');

        $res->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_get_study_session_summary_by_day_week_and_course(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Physics II', 'credits' => 3]);

        // Today session for course
        $user->studySessions()->create([
            'course_id' => $course->id,
            'type' => 'pomodoro',
            'duration_minutes' => 50,
            'started_at' => Carbon::now(),
            'is_completed' => true,
        ]);

        // General session today
        $user->studySessions()->create([
            'course_id' => null,
            'type' => 'stopwatch',
            'duration_minutes' => 30,
            'started_at' => Carbon::now(),
            'is_completed' => true,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/study-sessions/summary');

        $res->assertStatus(200)
            ->assertJsonPath('data.today_minutes', 80)
            ->assertJsonPath('data.total_sessions', 2)
            ->assertJsonCount(2, 'data.by_course');
    }

    public function test_user_can_delete_study_session(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $session = $user->studySessions()->create([
            'type' => 'pomodoro',
            'duration_minutes' => 25,
            'started_at' => now(),
            'is_completed' => true,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/study-sessions/{$session->id}");

        $res->assertStatus(200);
        $this->assertDatabaseMissing('study_sessions', ['id' => $session->id]);
    }

    public function test_user_cannot_link_session_to_another_users_course_or_task(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $semester1 = $user1->semesters()->create(['name' => 'Semester 1']);
        $course1 = $semester1->courses()->create(['name' => 'Secret Course', 'credits' => 3]);
        $task1 = $user1->tasks()->create(['title' => 'Secret Task']);

        $res = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson('/api/study-sessions', [
                'course_id' => $course1->id,
                'duration_minutes' => 30,
                'started_at' => now()->toISOString(),
            ]);

        $res->assertStatus(422);

        $res2 = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson('/api/study-sessions', [
                'task_id' => $task1->id,
                'duration_minutes' => 30,
                'started_at' => now()->toISOString(),
            ]);

        $res2->assertStatus(422);
    }
}
