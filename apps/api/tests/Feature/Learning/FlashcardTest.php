<?php

namespace Tests\Feature\Learning;

use App\Models\Flashcard;
use App\Models\FlashcardDeck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlashcardTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_deck_and_cards(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Create deck
        $deckRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/flashcard-decks', [
                'name' => 'Operating Systems Terminology',
                'description' => 'Key definitions for midterms',
            ]);

        $deckRes->assertStatus(201)
            ->assertJsonPath('data.name', 'Operating Systems Terminology');

        $deckId = $deckRes->json('data.id');

        // Add card
        $cardRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/flashcard-decks/{$deckId}/cards", [
                'question' => 'What is a Race Condition?',
                'answer' => 'A situation where multiple processes access and manipulate shared data concurrently and the outcome depends on execution order.',
            ]);

        $cardRes->assertStatus(201)
            ->assertJsonPath('data.question', 'What is a Race Condition?')
            ->assertJsonPath('data.ease_factor', 2.5)
            ->assertJsonPath('data.repetitions', 0);
    }

    public function test_sm2_spaced_repetition_review(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $deck = $user->flashcardDecks()->create([
            'name' => 'Japanese Vocabulary',
        ]);

        $card = $deck->cards()->create([
            'question' => 'Neko (猫)',
            'answer' => 'Cat',
            'ease_factor' => 2.50,
            'interval' => 0,
            'repetitions' => 0,
        ]);

        // Review 1: Good (rating: 3)
        $review1 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/flashcards/{$card->id}/review", [
                'rating' => 3,
            ]);

        $review1->assertStatus(200)
            ->assertJsonPath('data.repetitions', 1)
            ->assertJsonPath('data.interval', 1);

        // Review 2: Easy (rating: 4)
        $review2 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/flashcards/{$card->id}/review", [
                'rating' => 4,
            ]);

        $review2->assertStatus(200)
            ->assertJsonPath('data.repetitions', 2)
            ->assertJsonPath('data.interval', 6);

        // Review 3: Again / Failed (rating: 1)
        $review3 = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/flashcards/{$card->id}/review", [
                'rating' => 1,
            ]);

        $review3->assertStatus(200)
            ->assertJsonPath('data.repetitions', 0)
            ->assertJsonPath('data.interval', 1);
    }

    public function test_user_cannot_access_other_users_deck(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $deck = $user1->flashcardDecks()->create([
            'name' => 'Secret Deck',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/flashcard-decks/{$deck->id}");

        $response->assertStatus(404);
    }
}
