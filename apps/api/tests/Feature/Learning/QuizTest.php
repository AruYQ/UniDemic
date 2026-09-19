<?php

namespace Tests\Feature\Learning;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_quiz_and_questions(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Create quiz
        $quizRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/quizzes', [
                'title' => 'Software Engineering Basics',
                'description' => 'Quiz on Agile, Scrum, and Testing',
                'time_limit_minutes' => 30,
            ]);

        $quizRes->assertStatus(201)
            ->assertJsonPath('data.title', 'Software Engineering Basics')
            ->assertJsonPath('data.time_limit_minutes', 30);

        $quizId = $quizRes->json('data.id');

        // Add question
        $qRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/quizzes/{$quizId}/questions", [
                'type' => 'multiple_choice',
                'question' => 'Which of the following is not a Scrum ceremony?',
                'options' => ['Daily Standup', 'Sprint Review', 'Waterfall Planning', 'Sprint Retrospective'],
                'correct_answer' => 'Waterfall Planning',
                'explanation' => 'Waterfall planning is part of the traditional sequential SDLC model, not Scrum.',
            ]);

        $qRes->assertStatus(201)
            ->assertJsonPath('data.question', 'Which of the following is not a Scrum ceremony?')
            ->assertJsonPath('data.correct_answer', 'Waterfall Planning');
    }

    public function test_user_can_submit_quiz_attempt_and_get_score(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $quiz = $user->quizzes()->create([
            'title' => 'Biology 101',
        ]);

        $q1 = $quiz->questions()->create([
            'type' => 'true_false',
            'question' => 'Mitochondria is the powerhouse of the cell.',
            'options' => ['True', 'False'],
            'correct_answer' => 'True',
            'order' => 1,
        ]);

        $q2 = $quiz->questions()->create([
            'type' => 'multiple_choice',
            'question' => 'What is the chemical formula of water?',
            'options' => ['CO2', 'H2O', 'NaCl', 'O2'],
            'correct_answer' => 'H2O',
            'order' => 2,
        ]);

        // Submit attempt with 1 correct and 1 incorrect
        $submitRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/quizzes/{$quiz->id}/attempt", [
                'answers' => [
                    [
                        'question_id' => $q1->id,
                        'user_answer' => 'True',
                    ],
                    [
                        'question_id' => $q2->id,
                        'user_answer' => 'CO2', // Wrong
                    ],
                ],
            ]);

        $submitRes->assertStatus(201)
            ->assertJsonPath('data.total_questions', 2)
            ->assertJsonPath('data.correct_answers', 1)
            ->assertJsonPath('data.score', 50);

        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'correct_answers' => 1,
            'total_questions' => 2,
        ]);

        // Check attempt history
        $historyRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/quizzes/{$quiz->id}/attempts");

        $historyRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.score', 50);
    }

    public function test_user_cannot_access_other_users_quiz(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token2 = $user2->createToken('test')->plainTextToken;

        $quiz = $user1->quizzes()->create([
            'title' => 'Secret Quiz',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/quizzes/{$quiz->id}");

        $response->assertStatus(404);
    }

    public function test_user_can_create_quiz_with_nested_questions(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/quizzes', [
                'title' => 'Network Fundamentals',
                'description' => 'OSI model and protocols',
                'time_limit_minutes' => 20,
                'questions' => [
                    [
                        'type' => 'multiple_choice',
                        'question' => 'Which layer is HTTP?',
                        'options' => ['Application', 'Transport', 'Network', 'Data Link'],
                        'correct_answer' => 'Application',
                    ],
                    [
                        'type' => 'true_false',
                        'question' => 'TCP is a connectionless protocol.',
                        'correct_answer' => 'false',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Network Fundamentals')
            ->assertJsonPath('data.questions_count', 2)
            ->assertJsonCount(2, 'data.questions');

        $quizId = $response->json('data.id');
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quizId,
            'question' => 'Which layer is HTTP?',
            'correct_answer' => 'Application',
        ]);
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quizId,
            'question' => 'TCP is a connectionless protocol.',
            'correct_answer' => 'false',
        ]);
    }

    public function test_quiz_attempt_normalizes_answer_representations(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $quiz = $user->quizzes()->create([
            'title' => 'Normalization Test Quiz',
            'time_limit_minutes' => 10,
        ]);

        // Question 1: correct_answer is 'C' (letter), user submits option text 'Merge Sort'
        $q1 = $quiz->questions()->create([
            'type' => 'multiple_choice',
            'question' => 'Which sort is O(N log N)?',
            'options' => ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'],
            'correct_answer' => 'C',
            'order' => 1,
        ]);

        // Question 2: correct_answer is 'true', user submits 'Benar' (Indonesian truthy)
        $q2 = $quiz->questions()->create([
            'type' => 'true_false',
            'question' => 'Array index lookup is O(1).',
            'options' => ['Benar', 'Salah'],
            'correct_answer' => 'true',
            'order' => 2,
        ]);

        // Question 3: correct_answer is option text 'Dijkstra', user submits letter 'A'
        $q3 = $quiz->questions()->create([
            'type' => 'multiple_choice',
            'question' => 'Shortest path algorithm?',
            'options' => ['Dijkstra', 'Kruskal', 'Prim', 'Floyd'],
            'correct_answer' => 'Dijkstra',
            'order' => 3,
        ]);

        $res = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/quizzes/{$quiz->id}/attempt", [
                'answers' => [
                    ['question_id' => $q1->id, 'user_answer' => 'Merge Sort'],
                    ['question_id' => $q2->id, 'user_answer' => 'Benar'],
                    ['question_id' => $q3->id, 'user_answer' => 'A'],
                ],
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.total_questions', 3)
            ->assertJsonPath('data.correct_answers', 3)
            ->assertJsonPath('data.score', 100);
    }
}
