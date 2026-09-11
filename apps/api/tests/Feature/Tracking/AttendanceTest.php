<?php

namespace Tests\Feature\Tracking;

use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_attendances_for_course(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Data Structures', 'credits' => 3]);

        $course->attendances()->create([
            'date' => '2026-09-01',
            'status' => 'present',
        ]);

        $course->attendances()->create([
            'date' => '2026-09-08',
            'status' => 'absent',
            'notes' => 'Sakit tanpa surat',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/attendances");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.status', 'absent')
            ->assertJsonPath('data.1.status', 'present');
    }

    public function test_user_can_record_attendance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Database Systems', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/attendances", [
                'date' => '2026-09-15',
                'status' => 'present',
                'notes' => 'Hadir tepat waktu',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'present')
            ->assertJsonPath('data.notes', 'Hadir tepat waktu');

        $this->assertDatabaseHas('attendances', [
            'course_id' => $course->id,
            'status' => 'present',
            'notes' => 'Hadir tepat waktu',
        ]);
    }

    public function test_attendance_validation_fails_on_invalid_status(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Calculus', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/attendances", [
                'date' => '2026-09-15',
                'status' => 'bolus', // invalid status
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_user_can_get_attendance_summary_with_percentage(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Algorithms', 'credits' => 3]);

        // 3 present, 1 absent = 75%
        $course->attendances()->createMany([
            ['date' => '2026-09-01', 'status' => 'present'],
            ['date' => '2026-09-08', 'status' => 'present'],
            ['date' => '2026-09-15', 'status' => 'present'],
            ['date' => '2026-09-22', 'status' => 'absent'],
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/attendance-summary");

        $response->assertStatus(200)
            ->assertJsonPath('data.total_classes', 4)
            ->assertJsonPath('data.present_count', 3)
            ->assertJsonPath('data.absent_count', 1)
            ->assertJsonPath('data.attendance_percentage', fn ($val) => (float) $val == 75.0);
    }

    public function test_warning_triggered_when_attendance_drops_below_threshold(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Physics', 'credits' => 3]);

        // 1 present, 3 absent = 25% (below 75%)
        $course->attendances()->createMany([
            ['date' => '2026-09-01', 'status' => 'present'],
            ['date' => '2026-09-08', 'status' => 'absent'],
            ['date' => '2026-09-15', 'status' => 'absent'],
            ['date' => '2026-09-22', 'status' => 'absent'],
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/attendance-summary");

        $response->assertStatus(200)
            ->assertJsonPath('data.attendance_percentage', fn ($val) => (float) $val == 25.0)
            ->assertJsonPath('data.warning', true);
    }

    public function test_user_can_update_attendance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Chemistry', 'credits' => 3]);
        $attendance = $course->attendances()->create([
            'date' => '2026-09-01',
            'status' => 'absent',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/attendances/{$attendance->id}", [
                'status' => 'permission',
                'notes' => 'Surat izin diserahkan',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'permission')
            ->assertJsonPath('data.notes', 'Surat izin diserahkan');
    }

    public function test_user_can_delete_attendance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Statistics', 'credits' => 3]);
        $attendance = $course->attendances()->create([
            'date' => '2026-09-01',
            'status' => 'present',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/attendances/{$attendance->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('attendances', ['id' => $attendance->id]);
    }

    public function test_user_cannot_access_another_users_attendance(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $semester = $user1->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Biology', 'credits' => 3]);
        $attendance = $course->attendances()->create([
            'date' => '2026-09-01',
            'status' => 'present',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/attendances/{$attendance->id}");

        $response->assertStatus(404);
    }
}
