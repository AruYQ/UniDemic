<?php

namespace Tests\Feature\Academic;

use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_course_schedules(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Data Structures', 'credits' => 3]);
        $course->schedules()->create([
            'day' => 'monday',
            'start_time' => '08:00',
            'end_time' => '09:40',
            'room' => 'Lab 1',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/schedules");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.day', 'monday')
            ->assertJsonPath('data.0.room', 'Lab 1');
    }

    public function test_user_can_add_schedule_to_course(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Algorithms', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/schedules", [
                'day' => 'wednesday',
                'start_time' => '10:00',
                'end_time' => '11:40',
                'room' => 'Room 204',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.day', 'wednesday')
            ->assertJsonPath('data.room', 'Room 204');

        $this->assertDatabaseHas('course_schedules', [
            'course_id' => $course->id,
            'day' => 'wednesday',
            'room' => 'Room 204',
        ]);
    }

    public function test_user_can_update_schedule(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Networking', 'credits' => 3]);
        $schedule = $course->schedules()->create([
            'day' => 'friday',
            'start_time' => '13:00',
            'end_time' => '14:40',
            'room' => 'Old Room',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/schedules/{$schedule->id}", [
                'room' => 'New Room 301',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.room', 'New Room 301');

        $this->assertEquals('New Room 301', $schedule->fresh()->room);
    }

    public function test_user_can_delete_schedule(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'OS', 'credits' => 3]);
        $schedule = $course->schedules()->create([
            'day' => 'monday',
            'start_time' => '08:00',
            'end_time' => '09:40',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('course_schedules', ['id' => $schedule->id]);
    }
}
