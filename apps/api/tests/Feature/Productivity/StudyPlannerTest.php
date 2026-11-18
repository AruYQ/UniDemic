<?php

namespace Tests\Feature\Productivity;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Exam;
use App\Models\Semester;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyPlannerTest extends TestCase
{
    use RefreshDatabase;

    public function test_planner_suggests_study_blocks_before_exam_and_assignment_deadlines(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1', 'is_active' => true]);
        $course = $semester->courses()->create(['name' => 'Linear Algebra', 'credits' => 3]);

        // Upcoming Exam in 4 days
        $course->exams()->create([
            'type' => 'midterm',
            'date' => Carbon::now()->addDays(4)->toDateString(),
            'time' => '10:00',
            'location' => 'Room 301',
        ]);

        // Assignment due in 2 days
        $course->assignments()->create([
            'title' => 'Homework 4 - Matrices',
            'deadline' => Carbon::now()->addDays(2)->toDateTimeString(),
            'priority' => 'urgent',
            'is_completed' => false,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/study-planner/suggest', [
                'days_ahead' => 7,
                'max_hours_per_day' => 4,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'start_date',
                    'end_date',
                    'total_study_hours',
                    'schedule' => [
                        '*' => [
                            'date',
                            'start_time',
                            'end_time',
                            'title',
                            'course_id',
                            'course_name',
                            'duration_minutes',
                            'reason',
                        ],
                    ],
                ],
            ]);

        $this->assertGreaterThan(0, count($res->json('data.schedule')));
    }

    public function test_planner_avoids_course_schedule_time_conflicts(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1', 'is_active' => true]);
        $course = $semester->courses()->create(['name' => 'Computer Networks', 'credits' => 3]);

        // Create lecture conflict on Monday 16:00 - 18:30
        $course->schedules()->create([
            'day' => 'monday',
            'start_time' => '16:00',
            'end_time' => '18:30',
        ]);

        // Create a task
        $user->tasks()->create([
            'title' => 'Subnetting Exercises',
            'deadline' => Carbon::parse('next monday')->addDays(3)->toDateTimeString(),
            'is_completed' => false,
        ]);

        // Run planner starting next monday
        $mondayStr = Carbon::parse('next monday')->toDateString();
        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/study-planner/suggest', [
                'start_date' => $mondayStr,
                'days_ahead' => 1,
            ]);

        $res->assertStatus(200);
        $schedule = $res->json('data.schedule');

        // Check that none of the suggested slots on Monday overlap 16:00-18:30
        foreach ($schedule as $item) {
            if ($item['date'] === $mondayStr) {
                $this->assertFalse(
                    ($item['start_time'] >= '16:00' && $item['start_time'] < '18:30') ||
                    ($item['end_time'] > '16:00' && $item['end_time'] <= '18:30')
                );
            }
        }
    }

    public function test_planner_provides_general_review_when_no_urgent_deadlines(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1', 'is_active' => true]);
        $course = $semester->courses()->create(['name' => 'Philosophy of Science', 'credits' => 2]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/study-planner/suggest', [
                'days_ahead' => 3,
                'max_hours_per_day' => 3,
            ]);

        $res->assertStatus(200);
        $schedule = $res->json('data.schedule');
        $this->assertNotEmpty($schedule);
        $this->assertStringContainsString('Material review', $schedule[0]['title']);
    }
}
