<?php

namespace Tests\Feature\Learning;

use App\Models\Course;
use App\Models\Note;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_note(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $semester = $user->semesters()->create(['name' => 'Semester 1']);
        $course = $semester->courses()->create(['name' => 'Computer Networks', 'credits' => 3]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/notes', [
                'course_id' => $course->id,
                'title' => 'TCP 3-Way Handshake',
                'content' => '# TCP Handshake\nSYN, SYN-ACK, ACK process explained.',
                'tags' => ['networking', 'tcp', 'exam-prep'],
                'is_pinned' => true,
                'color' => '#6C5CE7',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'TCP 3-Way Handshake')
            ->assertJsonPath('data.is_pinned', true)
            ->assertJsonPath('data.color', '#6C5CE7')
            ->assertJsonPath('data.tags.0', 'networking');

        $this->assertDatabaseHas('notes', [
            'user_id' => $user->id,
            'title' => 'TCP 3-Way Handshake',
        ]);
    }

    public function test_user_can_list_and_search_notes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $user->notes()->create([
            'title' => 'Binary Search Tree',
            'content' => 'BST property: left < root < right',
            'tags' => ['dsa', 'tree'],
            'is_pinned' => true,
        ]);

        $user->notes()->create([
            'title' => 'Graph Traversal BFS and DFS',
            'content' => 'Breadth first search uses queues, depth first search uses recursion or stacks',
            'tags' => ['dsa', 'graph'],
            'is_pinned' => false,
        ]);

        // Search by query
        $searchRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/notes?search=Binary');
        $searchRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Binary Search Tree');

        // Filter by tag
        $tagRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/notes?tag=graph');
        $tagRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Graph Traversal BFS and DFS');

        // Filter pinned
        $pinnedRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/notes?is_pinned=true');
        $pinnedRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Binary Search Tree');
    }

    public function test_user_can_link_and_unlink_notes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $note1 = $user->notes()->create([
            'title' => 'Asymmetric Cryptography',
            'content' => 'Public and private key pairs.',
        ]);

        $note2 = $user->notes()->create([
            'title' => 'RSA Algorithm',
            'content' => 'Details of mathematical RSA encryption.',
        ]);

        // Link note2 to note1
        $linkRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/notes/{$note1->id}/link/{$note2->id}");

        $linkRes->assertStatus(200)
            ->assertJsonCount(1, 'data.linked_notes')
            ->assertJsonPath('data.linked_notes.0.id', $note2->id);

        $this->assertDatabaseHas('note_links', [
            'note_id' => $note1->id,
            'linked_note_id' => $note2->id,
        ]);

        // Unlink note2 from note1
        $unlinkRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/notes/{$note1->id}/link/{$note2->id}");

        $unlinkRes->assertStatus(200)
            ->assertJsonCount(0, 'data.linked_notes');

        $this->assertDatabaseMissing('note_links', [
            'note_id' => $note1->id,
            'linked_note_id' => $note2->id,
        ]);
    }

    public function test_user_cannot_access_other_users_note(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $note = $user1->notes()->create([
            'title' => 'Private Notes User 1',
            'content' => 'Secret thoughts',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/notes/{$note->id}");

        $response->assertStatus(404);
    }
}
