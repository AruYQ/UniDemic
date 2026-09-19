<?php

namespace Tests\Feature\Communication;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_direct_conversation(): void
    {
        $user1 = User::factory()->create(['name' => 'Alice']);
        $user2 = User::factory()->create(['name' => 'Bob']);
        $token1 = $user1->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson('/api/conversations', [
                'type' => 'direct',
                'participant_ids' => [$user2->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'direct')
            ->assertJsonPath('data.name', 'Bob')
            ->assertJsonCount(2, 'data.participants');

        $this->assertDatabaseHas('conversations', [
            'type' => 'direct',
            'created_by' => $user1->id,
        ]);
    }

    public function test_direct_conversation_is_reused_without_duplication(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token1 = $user1->createToken('test')->plainTextToken;
        $token2 = $user2->createToken('test')->plainTextToken;

        // User 1 creates DM with User 2
        $res1 = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson('/api/conversations', [
                'type' => 'direct',
                'participant_ids' => [$user2->id],
            ]);
        $res1->assertStatus(201);
        $convId1 = $res1->json('data.id');

        // User 2 creates DM with User 1 -> should return existing conversation
        $this->flushHeaders();
        app('auth')->forgetGuards();
        $res2 = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson('/api/conversations', [
                'type' => 'direct',
                'participant_ids' => [$user1->id],
            ]);
        $res2->assertStatus(200);
        $convId2 = $res2->json('data.id');

        $this->assertEquals($convId1, $convId2);
        $this->assertEquals(1, Conversation::where('type', 'direct')->count());
    }

    public function test_user_can_create_group_conversation_with_participants(): void
    {
        $admin = User::factory()->create(['name' => 'Leader']);
        $member1 = User::factory()->create(['name' => 'Member 1']);
        $member2 = User::factory()->create(['name' => 'Member 2']);
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/conversations', [
                'type' => 'group',
                'name' => 'Database Final Project Team',
                'description' => 'Coordination for schema, api, and tests',
                'participant_ids' => [$member1->id, $member2->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'group')
            ->assertJsonPath('data.name', 'Database Final Project Team')
            ->assertJsonCount(3, 'data.participants');

        $this->assertDatabaseHas('conversations', [
            'type' => 'group',
            'name' => 'Database Final Project Team',
            'created_by' => $admin->id,
        ]);
    }

    public function test_user_can_list_conversations_with_unread_count(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token1 = $user1->createToken('test')->plainTextToken;

        $conv = Conversation::create([
            'type' => 'direct',
            'created_by' => $user2->id,
            'last_message_at' => now(),
        ]);
        $conv->participants()->create(['user_id' => $user1->id, 'role' => 'member', 'joined_at' => now(), 'last_read_at' => now()->subMinutes(5)]);
        $conv->participants()->create(['user_id' => $user2->id, 'role' => 'admin', 'joined_at' => now(), 'last_read_at' => now()]);

        // Message sent by user 2 after user 1 last read
        $conv->messages()->create([
            'user_id' => $user2->id,
            'content' => 'Hello there!',
            'created_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->getJson('/api/conversations');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.unread_count', 1);
    }

    public function test_user_can_add_and_remove_participants_in_group(): void
    {
        $admin = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $conv = Conversation::create([
            'type' => 'group',
            'name' => 'Study Club',
            'created_by' => $admin->id,
        ]);
        $conv->participants()->create(['user_id' => $admin->id, 'role' => 'admin', 'joined_at' => now()]);

        // Add user2 and user3
        $addRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/conversations/{$conv->id}/participants", [
                'user_ids' => [$user2->id, $user3->id],
            ]);

        $addRes->assertStatus(200)
            ->assertJsonCount(3, 'data.participants');

        // Remove user2
        $removeRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/conversations/{$conv->id}/participants/{$user2->id}");

        $removeRes->assertStatus(200);
        $this->assertEquals(2, $conv->participants()->count());
    }

    public function test_user_cannot_access_other_users_conversation(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $unauthorizedUser = User::factory()->create();
        $unauthTok = $unauthorizedUser->createToken('test')->plainTextToken;

        $conv = Conversation::create(['type' => 'direct', 'created_by' => $user1->id]);
        $conv->participants()->create(['user_id' => $user1->id, 'role' => 'admin', 'joined_at' => now()]);
        $conv->participants()->create(['user_id' => $user2->id, 'role' => 'member', 'joined_at' => now()]);

        $response = $this->withHeader('Authorization', 'Bearer '.$unauthTok)
            ->getJson("/api/conversations/{$conv->id}");

        $response->assertStatus(404);
    }
}
