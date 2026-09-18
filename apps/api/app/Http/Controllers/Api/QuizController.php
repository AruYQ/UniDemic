<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\StoreQuizQuestionRequest;
use App\Http\Requests\Learning\StoreQuizRequest;
use App\Http\Requests\Learning\SubmitQuizAttemptRequest;
use App\Http\Requests\Learning\UpdateQuizQuestionRequest;
use App\Http\Requests\Learning\UpdateQuizRequest;
use App\Http\Resources\QuizAttemptResource;
use App\Http\Resources\QuizQuestionResource;
use App\Http\Resources\QuizResource;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    /**
     * Get user-owned quiz or abort with 404.
     */
    protected function getUserQuiz(Request $request, int $id): Quiz
    {
        return Quiz::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
    }

    /**
     * Get user-owned quiz question or abort with 404.
     */
    protected function getUserQuestion(Request $request, int $id): QuizQuestion
    {
        return QuizQuestion::where('id', $id)
            ->whereHas('quiz', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Display a listing of user quizzes.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Quiz::where('user_id', $user->id)
            ->with('course')
            ->withCount(['questions', 'attempts']);

        if ($request->has('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        $quizzes = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => QuizResource::collection($quizzes),
        ]);
    }

    /**
     * Store a newly created quiz.
     */
    public function store(StoreQuizRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (!empty($validated['course_id'])) {
            $courseExists = Course::where('id', $validated['course_id'])
                ->whereHas('semester', fn ($q) => $q->where('user_id', $user->id))
                ->exists();
            if (!$courseExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or unauthorized',
                ], 404);
            }
        }

        $validated['user_id'] = $user->id;
        $quiz = Quiz::create($validated);
        $quiz->load('course');

        return response()->json([
            'success' => true,
            'message' => 'Quiz created successfully',
            'data' => new QuizResource($quiz),
        ], 201);
    }

    /**
     * Display the specified quiz with questions.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $id);
        $quiz->load(['course', 'questions']);

        return response()->json([
            'success' => true,
            'data' => new QuizResource($quiz),
        ]);
    }

    /**
     * Update the specified quiz.
     */
    public function update(UpdateQuizRequest $request, int $id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $id);
        $user = $request->user();
        $validated = $request->validated();

        if (array_key_exists('course_id', $validated) && !empty($validated['course_id'])) {
            $courseExists = Course::where('id', $validated['course_id'])
                ->whereHas('semester', fn ($q) => $q->where('user_id', $user->id))
                ->exists();
            if (!$courseExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or unauthorized',
                ], 404);
            }
        }

        $quiz->update($validated);
        $quiz->load(['course', 'questions']);

        return response()->json([
            'success' => true,
            'message' => 'Quiz updated successfully',
            'data' => new QuizResource($quiz),
        ]);
    }

    /**
     * Remove the specified quiz.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $id);
        $quiz->delete();

        return response()->json([
            'success' => true,
            'message' => 'Quiz deleted successfully',
        ]);
    }

    /**
     * Add a question to a quiz.
     */
    public function storeQuestion(StoreQuizQuestionRequest $request, int $quiz_id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $quiz_id);
        $validated = $request->validated();

        if (!isset($validated['order'])) {
            $maxOrder = $quiz->questions()->max('order') ?? 0;
            $validated['order'] = $maxOrder + 1;
        }

        $question = $quiz->questions()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Quiz question added successfully',
            'data' => new QuizQuestionResource($question),
        ], 201);
    }

    /**
     * Update a specific quiz question.
     */
    public function updateQuestion(UpdateQuizQuestionRequest $request, int $id): JsonResponse
    {
        $question = $this->getUserQuestion($request, $id);
        $question->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Quiz question updated successfully',
            'data' => new QuizQuestionResource($question),
        ]);
    }

    /**
     * Remove a quiz question.
     */
    public function destroyQuestion(Request $request, int $id): JsonResponse
    {
        $question = $this->getUserQuestion($request, $id);
        $question->delete();

        return response()->json([
            'success' => true,
            'message' => 'Quiz question deleted successfully',
        ]);
    }

    /**
     * Submit an attempt for a quiz and calculate the score.
     */
    public function submitAttempt(SubmitQuizAttemptRequest $request, int $id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $id);
        $questions = $quiz->questions()->get()->keyBy('id');
        $userAnswers = $request->validated('answers');

        $totalQuestions = $questions->count();
        $correctCount = 0;
        $detailedAnswers = [];

        foreach ($userAnswers as $answerItem) {
            $questionId = $answerItem['question_id'];
            $userAns = $answerItem['user_answer'] ?? null;

            if ($questions->has($questionId)) {
                $question = $questions->get($questionId);
                $isCorrect = trim(strtolower((string) $userAns)) === trim(strtolower((string) $question->correct_answer));

                if ($isCorrect) {
                    $correctCount++;
                }

                $detailedAnswers[] = [
                    'question_id' => $question->id,
                    'question' => $question->question,
                    'user_answer' => $userAns,
                    'correct_answer' => $question->correct_answer,
                    'is_correct' => $isCorrect,
                    'explanation' => $question->explanation,
                ];
            }
        }

        $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100, 2) : 0.00;

        $attempt = $quiz->attempts()->create([
            'user_id' => $request->user()->id,
            'score' => $score,
            'total_questions' => $totalQuestions,
            'correct_answers' => $correctCount,
            'answers' => $detailedAnswers,
            'completed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quiz attempt submitted successfully',
            'data' => new QuizAttemptResource($attempt),
        ], 201);
    }

    /**
     * List all attempts for a quiz.
     */
    public function attempts(Request $request, int $id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $id);
        $attempts = $quiz->attempts()->where('user_id', $request->user()->id)->orderByDesc('completed_at')->get();

        return response()->json([
            'success' => true,
            'data' => QuizAttemptResource::collection($attempts),
        ]);
    }

    /**
     * Get a specific quiz attempt.
     */
    public function attemptShow(Request $request, int $id, int $attempt_id): JsonResponse
    {
        $quiz = $this->getUserQuiz($request, $id);
        $attempt = $quiz->attempts()
            ->where('id', $attempt_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => new QuizAttemptResource($attempt),
        ]);
    }
}
