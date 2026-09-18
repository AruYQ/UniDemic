<?php

namespace Tests\Feature\Learning;

use App\Models\Course;
use App\Models\Material;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MaterialTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_course_materials(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Algorithms', 'credits' => 3]);

        $course->materials()->create([
            'title' => 'Introduction to Big O',
            'type' => 'doc',
            'description' => 'Lecture 1 notes',
        ]);

        $course->materials()->create([
            'title' => 'Sorting Algorithms Slides',
            'type' => 'slide',
            'url' => 'https://example.com/slides.pdf',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/courses/{$course->id}/materials");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_create_material(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Calculus I', 'credits' => 4]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/courses/{$course->id}/materials", [
                'title' => 'Derivatives Reference',
                'description' => 'Comprehensive table of derivatives',
                'type' => 'link',
                'url' => 'https://mathworld.wolfram.com/Derivative.html',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Derivatives Reference')
            ->assertJsonPath('data.type', 'link')
            ->assertJsonPath('data.url', 'https://mathworld.wolfram.com/Derivative.html');

        $this->assertDatabaseHas('materials', [
            'course_id' => $course->id,
            'title' => 'Derivatives Reference',
            'type' => 'link',
        ]);
    }

    public function test_user_can_upload_material_file(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->create('syllabus.pdf', 500, 'application/pdf');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/materials/upload', [
                'file' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.file_name', 'syllabus.pdf');

        $storagePath = $response->json('data.file_path');
        Storage::disk('public')->assertExists($storagePath);
    }

    public function test_user_can_view_update_and_delete_material(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Physics', 'credits' => 3]);

        $material = $course->materials()->create([
            'title' => 'Thermodynamics Note',
            'type' => 'doc',
        ]);

        // Show
        $showRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/materials/{$material->id}");
        $showRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Thermodynamics Note');

        // Update
        $updateRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/materials/{$material->id}", [
                'title' => 'Thermodynamics & Heat Transfer Note',
                'description' => 'Updated chapter 4 notes',
            ]);
        $updateRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Thermodynamics & Heat Transfer Note')
            ->assertJsonPath('data.description', 'Updated chapter 4 notes');

        // Delete
        $delRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/materials/{$material->id}");
        $delRes->assertStatus(200);

        $this->assertDatabaseMissing('materials', [
            'id' => $material->id,
        ]);
    }

    public function test_user_cannot_access_other_users_material(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $semester1 = $user1->semesters()->create(['name' => 'Semester 1']);
        $course1 = $semester1->courses()->create(['name' => 'Confidential Course', 'credits' => 3]);

        $material = $course1->materials()->create([
            'title' => 'Confidential Material',
            'type' => 'doc',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/materials/{$material->id}");

        $response->assertStatus(404);
    }
}
