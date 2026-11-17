<?php

namespace Tests\Feature\Collaboration;

use App\Models\Course;
use App\Models\Material;
use App\Models\Note;
use App\Models\Semester;
use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyGroupTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_study_group_with_invite_code_and_linked_chat(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/study-groups', [
                'name' => 'Algorithms & Data Structures Study Group',
                'description' => 'Cross-university prep for competitive programming and exams.',
                'subject' => 'Algorithms',
                'is_public' => true,
                'max_members' => 25,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Algorithms & Data Structures Study Group')
            ->assertJsonPath('data.is_public', true)
            ->assertJsonPath('data.members_count', 1);

        $inviteCode = $response->json('data.invite_code');
        $conversationId = $response->json('data.conversation_id');
        $this->assertNotEmpty($inviteCode);
        $this->assertNotNull($conversationId);

        $this->assertDatabaseHas('study_groups', [
            'name' => 'Algorithms & Data Structures Study Group',
            'creator_id' => $user->id,
            'invite_code' => $inviteCode,
        ]);

        $this->assertDatabaseHas('study_group_members', [
            'user_id' => $user->id,
            'role' => 'admin',
        ]);
    }

    public function test_other_user_can_discover_and_join_study_group_via_invite_code(): void
    {
        $creator = User::factory()->create();
        $joiner = User::factory()->create();
        $token1 = $creator->createToken('test')->plainTextToken;
        $token2 = $joiner->createToken('test')->plainTextToken;

        $createRes = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson('/api/study-groups', [
                'name' => 'Private Calculus Group',
                'is_public' => false,
                'max_members' => 2,
            ]);
        $createRes->assertStatus(201);
        $inviteCode = $createRes->json('data.invite_code');
        $groupId = $createRes->json('data.id');

        $this->flushHeaders();
        app('auth')->forgetGuards();

        // Join via invite code
        $joinRes = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson('/api/study-groups/join', [
                'invite_code' => $inviteCode,
            ]);

        $joinRes->assertStatus(200)
            ->assertJsonPath('data.id', $groupId)
            ->assertJsonPath('data.members_count', 2);

        // Max members capacity enforced for 3rd user
        $thirdUser = User::factory()->create();
        $token3 = $thirdUser->createToken('test')->plainTextToken;
        $this->flushHeaders();
        app('auth')->forgetGuards();

        $fullRes = $this->withHeader('Authorization', 'Bearer '.$token3)
            ->postJson('/api/study-groups/join', [
                'invite_code' => $inviteCode,
            ]);
        $fullRes->assertStatus(422);
    }

    public function test_admin_can_manage_members_and_non_admin_is_blocked(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        $tokenAdmin = $admin->createToken('test')->plainTextToken;
        $tokenMember = $member->createToken('test')->plainTextToken;

        $createRes = $this->withHeader('Authorization', 'Bearer '.$tokenAdmin)
            ->postJson('/api/study-groups', ['name' => 'OS Study Group']);
        $groupId = $createRes->json('data.id');

        // Admin adds member
        $addRes = $this->withHeader('Authorization', 'Bearer '.$tokenAdmin)
            ->postJson("/api/study-groups/{$groupId}/members", [
                'user_id' => $member->id,
                'role' => 'member',
            ]);
        $addRes->assertStatus(200)
            ->assertJsonPath('data.members_count', 2);

        // Regular member cannot add outsider
        $this->flushHeaders();
        app('auth')->forgetGuards();
        $unauthAdd = $this->withHeader('Authorization', 'Bearer '.$tokenMember)
            ->postJson("/api/study-groups/{$groupId}/members", [
                'user_id' => $outsider->id,
            ]);
        $unauthAdd->assertStatus(403);

        // Admin promotes member to moderator
        $this->flushHeaders();
        app('auth')->forgetGuards();
        $roleRes = $this->withHeader('Authorization', 'Bearer '.$tokenAdmin)
            ->putJson("/api/study-groups/{$groupId}/members/{$member->id}", [
                'role' => 'moderator',
            ]);
        $roleRes->assertStatus(200);
        $this->assertDatabaseHas('study_group_members', [
            'study_group_id' => $groupId,
            'user_id' => $member->id,
            'role' => 'moderator',
        ]);
    }

    public function test_members_can_share_notes_and_materials_with_ownership_isolation(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token1 = $user1->createToken('test')->plainTextToken;

        $semester = Semester::create([
            'user_id' => $user1->id,
            'name' => 'Ganjil 2026',
            'start_date' => '2026-09-01',
            'end_date' => '2027-01-31',
            'is_active' => true,
        ]);
        $course = Course::create([
            'semester_id' => $semester->id,
            'name' => 'Database Systems',
            'code' => 'IF3103',
            'credits' => 3,
        ]);
        $note = Note::create([
            'user_id' => $user1->id,
            'course_id' => $course->id,
            'title' => 'Normalization Cheat Sheet',
            'content' => '# BCNF Notes',
        ]);
        $material = Material::create([
            'course_id' => $course->id,
            'title' => 'SQL Indexing Slides',
            'type' => 'slide',
            'url' => 'https://example.com/slides.pdf',
        ]);

        $otherNote = Note::create([
            'user_id' => $user2->id,
            'title' => 'Private Note',
            'content' => 'Secret',
        ]);

        $groupRes = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson('/api/study-groups', ['name' => 'DB Research Group']);
        $groupId = $groupRes->json('data.id');

        // Share owned note
        $shareNoteRes = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson("/api/study-groups/{$groupId}/share-note", ['note_id' => $note->id]);
        $shareNoteRes->assertStatus(200)
            ->assertJsonCount(1, 'data.shared_notes');

        // Share owned material
        $shareMatRes = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson("/api/study-groups/{$groupId}/share-material", ['material_id' => $material->id]);
        $shareMatRes->assertStatus(200)
            ->assertJsonCount(1, 'data.shared_materials');

        // Cannot share someone else's note
        $failRes = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson("/api/study-groups/{$groupId}/share-note", ['note_id' => $otherNote->id]);
        $failRes->assertStatus(404);
    }

    public function test_outsider_cannot_access_private_study_group(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $tokenOwner = $owner->createToken('test')->plainTextToken;
        $tokenOutsider = $outsider->createToken('test')->plainTextToken;

        $createRes = $this->withHeader('Authorization', 'Bearer '.$tokenOwner)
            ->postJson('/api/study-groups', ['name' => 'Secret Group', 'is_public' => false]);
        $groupId = $createRes->json('data.id');

        $this->flushHeaders();
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$tokenOutsider)
            ->getJson("/api/study-groups/{$groupId}")
            ->assertStatus(404);
    }
}
