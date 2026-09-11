<?php

namespace Tests\Feature\Tracking;

use App\Models\Course;
use App\Models\GradeComponent;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_grade_components_with_weights(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Operating Systems', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/grade-components", [
                'name' => 'Ujian Akhir Semester (UAS)',
                'weight' => 40.00,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Ujian Akhir Semester (UAS)')
            ->assertJsonPath('data.weight', fn ($val) => (float) $val == 40.0);

        $this->assertDatabaseHas('grade_components', [
            'course_id' => $course->id,
            'name' => 'Ujian Akhir Semester (UAS)',
            'weight' => 40.00,
        ]);
    }

    public function test_user_can_list_grade_components(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Linear Algebra', 'credits' => 3]);

        $course->gradeComponents()->createMany([
            ['name' => 'Tugas', 'weight' => 20.00],
            ['name' => 'UTS', 'weight' => 35.00],
            ['name' => 'UAS', 'weight' => 45.00],
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/grade-components");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Tugas')
            ->assertJsonPath('data.1.name', 'UTS');
    }

    public function test_user_can_record_grade_under_component(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Computer Networks', 'credits' => 3]);
        $component = $course->gradeComponents()->create(['name' => 'Tugas', 'weight' => 20.00]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/grades", [
                'grade_component_id' => $component->id,
                'name' => 'Tugas 1: Socket Programming',
                'score' => 92.50,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Tugas 1: Socket Programming')
            ->assertJsonPath('data.score', 92.5)
            ->assertJsonPath('data.grade_component_id', $component->id);
    }

    public function test_cannot_assign_grade_to_another_courses_component(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course1 = $semester->courses()->create(['name' => 'Course 1', 'credits' => 3]);
        $course2 = $semester->courses()->create(['name' => 'Course 2', 'credits' => 3]);

        $component1 = $course1->gradeComponents()->create(['name' => 'Tugas', 'weight' => 20]);

        // Attempt to create grade for course 2 with component of course 1
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course2->id}/grades", [
                'grade_component_id' => $component1->id,
                'name' => 'Tugas Course 2',
                'score' => 80.00,
            ]);

        $response->assertStatus(422);
    }

    public function test_user_can_update_and_delete_grade(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Discrete Math', 'credits' => 3]);
        $grade = $course->grades()->create([
            'name' => 'Kuis 1',
            'score' => 70.00,
        ]);

        // Update
        $updRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/grades/{$grade->id}", [
                'score' => 88.00,
            ]);

        $updRes->assertStatus(200)
            ->assertJsonPath('data.score', fn ($val) => (float) $val == 88.0);

        // Delete
        $delRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/grades/{$grade->id}");

        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('grades', ['id' => $grade->id]);
    }

    public function test_user_cannot_access_another_users_grade(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $semester = $user1->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'English', 'credits' => 2]);
        $grade = $course->grades()->create([
            'name' => 'Paper',
            'score' => 90.00,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/grades/{$grade->id}");

        $response->assertStatus(404);
    }
}
