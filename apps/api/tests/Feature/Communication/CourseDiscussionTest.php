<?php

namespace Tests\Feature\Communication;

use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseDiscussionTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_discussions_auto_provisions_default_channels(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Operating Systems', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/discussions");

        $response->assertStatus(200)
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.name', '#general')
            ->assertJsonPath('data.1.name', '#tugas')
            ->assertJsonPath('data.2.name', '#ujian')
            ->assertJsonPath('data.3.name', '#resources');

        $this->assertDatabaseHas('conversations', [
            'type' => 'course',
            'course_id' => $course->id,
            'name' => '#general',
        ]);
    }

    public function test_user_can_create_custom_course_discussion_channel(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Algorithms', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/discussions", [
                'name' => 'competitive-programming',
                'description' => 'Discussions for CP practice and LeetCode problems',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'course')
            ->assertJsonPath('data.name', '#competitive-programming')
            ->assertJsonPath('data.course_id', $course->id);

        $this->assertDatabaseHas('conversations', [
            'type' => 'course',
            'course_id' => $course->id,
            'name' => '#competitive-programming',
        ]);
    }

    public function test_user_cannot_access_discussions_of_unauthorized_course(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $semester1 = $user1->semesters()->create(['name' => 'Semester 1']);
        $course1 = $semester1->courses()->create(['name' => 'Secret Defense Lab', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/courses/{$course1->id}/discussions");

        $response->assertStatus(404);
    }
}
