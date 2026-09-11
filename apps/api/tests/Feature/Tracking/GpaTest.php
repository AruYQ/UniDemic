<?php

namespace Tests\Feature\Tracking;

use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GpaTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculates_course_gpa_based_on_grade_components(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Software Engineering', 'credits' => 3]);

        // Setup components: Tugas (30%), UTS (30%), UAS (40%)
        $compTugas = $course->gradeComponents()->create(['name' => 'Tugas', 'weight' => 30.00]);
        $compUts = $course->gradeComponents()->create(['name' => 'UTS', 'weight' => 30.00]);
        $compUas = $course->gradeComponents()->create(['name' => 'UAS', 'weight' => 40.00]);

        // Tugas avg = 90
        $course->grades()->create(['grade_component_id' => $compTugas->id, 'name' => 'T1', 'score' => 90]);
        // UTS = 85
        $course->grades()->create(['grade_component_id' => $compUts->id, 'name' => 'UTS', 'score' => 85]);
        // UAS = 88
        $course->grades()->create(['grade_component_id' => $compUas->id, 'name' => 'UAS', 'score' => 88]);

        // Expected final score = (90*0.30) + (85*0.30) + (88*0.40) = 27 + 25.5 + 35.2 = 87.7
        // 87.7 >= 85 => Grade 'A', Point 4.00

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/gpa");

        $response->assertStatus(200)
            ->assertJsonPath('data.final_score', 87.7)
            ->assertJsonPath('data.letter_grade', 'A')
            ->assertJsonPath('data.grade_point', fn ($val) => (float) $val == 4.0);
    }

    public function test_calculates_semester_gpa_ips(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        
        // Course 1: 3 credits, score 90 (A = 4.0)
        $course1 = $semester->courses()->create(['name' => 'Course 1', 'credits' => 3]);
        $course1->grades()->create(['name' => 'Final', 'score' => 90]);

        // Course 2: 3 credits, score 72 (B = 3.0)
        $course2 = $semester->courses()->create(['name' => 'Course 2', 'credits' => 3]);
        $course2->grades()->create(['name' => 'Final', 'score' => 72]);

        // IPS = ((3 * 4.0) + (3 * 3.0)) / (3 + 3) = (12 + 9) / 6 = 3.50
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/semesters/{$semester->id}/gpa");

        $response->assertStatus(200)
            ->assertJsonPath('data.total_credits', 6)
            ->assertJsonPath('data.gpa', 3.5);
    }

    public function test_calculates_cumulative_gpa_ipk_across_semesters(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Semester 1: 4 credits, grade A (4.0)
        $sem1 = $user->semesters()->create(['name' => 'Semester 1']);
        $c1 = $sem1->courses()->create(['name' => 'Course A', 'credits' => 4]);
        $c1->grades()->create(['name' => 'Final', 'score' => 88]);

        // Semester 2: 4 credits, grade B (3.0)
        $sem2 = $user->semesters()->create(['name' => 'Semester 2']);
        $c2 = $sem2->courses()->create(['name' => 'Course B', 'credits' => 4]);
        $c2->grades()->create(['name' => 'Final', 'score' => 70]);

        // Cumulative = ((4 * 4.0) + (4 * 3.0)) / 8 = 3.50
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/profile/cumulative-gpa');

        $response->assertStatus(200)
            ->assertJsonPath('data.total_credits', 8)
            ->assertJsonPath('data.cumulative_gpa', 3.5);
    }

    public function test_gpa_simulator_projects_expected_gpa(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Suppose student has current GPA 3.20 with 50 credits
        // Target: 2 courses, 3 credits each with target 'A' (4.0)
        // Simulated GPA = ((3.20 * 50) + (4.0 * 3) + (4.0 * 3)) / (50 + 6)
        //               = (160 + 12 + 12) / 56 = 184 / 56 = 3.2857 => 3.29

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/gpa-simulator', [
                'current_gpa' => 3.20,
                'current_credits' => 50,
                'simulations' => [
                    ['course_name' => 'Machine Learning', 'credits' => 3, 'target_grade' => 'A'],
                    ['course_name' => 'Cloud Computing', 'credits' => 3, 'target_grade' => 'A'],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.current_gpa', 3.2)
            ->assertJsonPath('data.simulated_gpa', 3.29)
            ->assertJsonPath('data.total_credits', 56)
            ->assertJsonCount(2, 'data.details');
    }

    public function test_user_cannot_access_another_users_gpa(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $semester = $user1->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Secret Course', 'credits' => 3]);
        $course->grades()->create(['name' => 'Test', 'score' => 90]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/courses/{$course->id}/gpa");

        $response->assertStatus(404);
    }
}
