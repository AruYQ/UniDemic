<?php

namespace Tests\Feature\Academic;

use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_courses(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $semester->courses()->create(['name' => 'Data Structures', 'code' => 'CS101', 'credits' => 3]);

        $otherUser = User::factory()->create();
        $otherSemester = $otherUser->semesters()->create(['name' => 'Other Sem']);
        $otherSemester->courses()->create(['name' => 'Secret Course', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/courses');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Data Structures');
    }

    public function test_user_can_filter_courses_by_semester(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $sem1 = $user->semesters()->create(['name' => 'Sem 1']);
        $sem2 = $user->semesters()->create(['name' => 'Sem 2']);

        $sem1->courses()->create(['name' => 'Course 1', 'credits' => 3]);
        $sem2->courses()->create(['name' => 'Course 2', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses?semester_id={$sem1->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Course 1');
    }

    public function test_user_can_create_course(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/courses', [
                'semester_id' => $semester->id,
                'name' => 'Database Systems',
                'code' => 'CS202',
                'lecturer' => 'Dr. Budi',
                'credits' => 4,
                'classroom' => 'Lab 2',
                'color' => '#4ECDC4',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Database Systems')
            ->assertJsonPath('data.credits', 4);

        $this->assertDatabaseHas('courses', [
            'semester_id' => $semester->id,
            'name' => 'Database Systems',
            'code' => 'CS202',
        ]);
    }

    public function test_user_cannot_create_course_for_another_users_semester(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $otherUser = User::factory()->create();
        $otherSemester = $otherUser->semesters()->create(['name' => 'Other Sem']);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/courses', [
                'semester_id' => $otherSemester->id,
                'name' => 'Hacker Course',
                'credits' => 3,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['semester_id']);
    }

    public function test_user_can_view_course_detail(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'AI', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'AI');
    }

    public function test_user_can_update_course(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'Old Course', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/courses/{$course->id}", [
                'name' => 'New Course',
                'credits' => 4,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Course')
            ->assertJsonPath('data.credits', 4);

        $this->assertEquals('New Course', $course->fresh()->name);
    }

    public function test_user_can_delete_course(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Sem 1']);
        $course = $semester->courses()->create(['name' => 'To Delete', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/courses/{$course->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }
}
