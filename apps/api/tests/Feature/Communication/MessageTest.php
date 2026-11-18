<?php

namespace Tests\Feature\Communication;

use App\Models\Conversation;
use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_message_in_conversation(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token1 = $user1->createToken('test')->plainTextToken;

        $conv = Conversation::create(['type' => 'direct', 'created_by' => $user1->id]);
        $conv->participants()->create(['user_id' => $user1->id, 'role' => 'admin', 'joined_at' => now()]);
        $conv->participants()->create(['user_id' => $user2->id, 'role' => 'member', 'joined_at' => now()]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson("/api/conversations/{$conv->id}/messages", [
                'content' => 'Hey, did you review the project requirements?',
                'type' => 'text',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.content', 'Hey, did you review the project requirements?')
            ->assertJsonPath('data.user.id', $user1->id);

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conv->id,
            'user_id' => $user1->id,
            'content' => 'Hey, did you review the project requirements?',
        ]);

        $conv->refresh();
        $this->assertNotNull($conv->last_message_at);
    }

    public function test_user_can_reply_to_message(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $conv = Conversation::create(['type' => 'direct', 'created_by' => $user1->id]);
        $conv->participants()->create(['user_id' => $user1->id, 'role' => 'admin', 'joined_at' => now()]);
        $conv->participants()->create(['user_id' => $user2->id, 'role' => 'member', 'joined_at' => now()]);

        $msg1 = $conv->messages()->create([
            'user_id' => $user1->id,
            'content' => 'Can you work on the database schema?',
        ]);

        $replyRes = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson("/api/conversations/{$conv->id}/messages", [
                'content' => 'Yes, I will finish it tonight!',
                'reply_to_id' => $msg1->id,
            ]);

        $replyRes->assertStatus(201)
            ->assertJsonPath('data.reply_to_id', $msg1->id)
            ->assertJsonPath('data.reply_to.content', 'Can you work on the database schema?');
    }

    public function test_user_can_send_message_with_academic_reference(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Database Systems', 'code' => 'IF3101', 'credits' => 3]);
        $assignment = $course->assignments()->create([
            'title' => 'ERD & Normalization Assignment',
            'deadline' => '2026-09-30 23:59:00',
        ]);

        $conv = Conversation::create(['type' => 'group', 'name' => 'Study Group', 'created_by' => $user->id]);
        $conv->participants()->create(['user_id' => $user->id, 'role' => 'admin', 'joined_at' => now()]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/conversations/{$conv->id}/messages", [
                'content' => 'Hey everyone, check this assignment!',
                'type' => 'academic_ref',
                'reference_type' => 'assignment',
                'reference_id' => $assignment->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.reference_type', 'assignment')
            ->assertJsonPath('data.reference_id', $assignment->id)
            ->assertJsonPath('data.reference_data.title', 'ERD & Normalization Assignment');
    }

    public function test_user_can_send_message_with_file_attachment(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $conv = Conversation::create(['type' => 'group', 'name' => 'Project', 'created_by' => $user->id]);
        $conv->participants()->create(['user_id' => $user->id, 'role' => 'admin', 'joined_at' => now()]);

        $file = UploadedFile::fake()->create('schema_v1.pdf', 1024, 'application/pdf');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/conversations/{$conv->id}/messages", [
                'content' => 'Here is the preliminary ERD diagram',
                'files' => [$file],
            ]);

        $response->assertStatus(201)
            ->assertJsonCount(1, 'data.attachments')
            ->assertJsonPath('data.attachments.0.file_name', 'schema_v1.pdf');

        $this->assertDatabaseHas('message_attachments', [
            'file_name' => 'schema_v1.pdf',
        ]);
    }

    public function test_user_can_toggle_message_reaction(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $conv = Conversation::create(['type' => 'group', 'name' => 'General', 'created_by' => $user->id]);
        $conv->participants()->create(['user_id' => $user->id, 'role' => 'admin', 'joined_at' => now()]);

        $msg = $conv->messages()->create([
            'user_id' => $user->id,
            'content' => 'Awesome progress today!',
        ]);

        // Add reaction 👍
        $addRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/messages/{$msg->id}/reactions", [
                'emoji' => '👍',
            ]);
        $addRes->assertStatus(200)
            ->assertJsonCount(1, 'data.reactions')
            ->assertJsonPath('data.reactions.0.emoji', '👍');

        // Toggle same reaction -> remove
        $removeRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/messages/{$msg->id}/reactions", [
                'emoji' => '👍',
            ]);
        $removeRes->assertStatus(200)
            ->assertJsonCount(0, 'data.reactions');
    }

    public function test_user_cannot_send_message_to_unjoined_conversation(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $conv = Conversation::create(['type' => 'direct', 'created_by' => $user1->id]);
        $conv->participants()->create(['user_id' => $user1->id, 'role' => 'admin', 'joined_at' => now()]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->postJson("/api/conversations/{$conv->id}/messages", [
                'content' => 'Hello?',
            ]);

        $response->assertStatus(404);
    }
}
