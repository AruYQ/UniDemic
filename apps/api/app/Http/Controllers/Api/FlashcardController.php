<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\ReviewFlashcardRequest;
use App\Http\Requests\Learning\StoreFlashcardDeckRequest;
use App\Http\Requests\Learning\StoreFlashcardRequest;
use App\Http\Requests\Learning\UpdateFlashcardDeckRequest;
use App\Http\Requests\Learning\UpdateFlashcardRequest;
use App\Http\Resources\FlashcardDeckResource;
use App\Http\Resources\FlashcardResource;
use App\Models\Course;
use App\Models\Flashcard;
use App\Models\FlashcardDeck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlashcardController extends Controller
{
    /**
     * Get user-owned flashcard deck or abort with 404.
     */
    protected function getUserDeck(Request $request, int $id): FlashcardDeck
    {
        return FlashcardDeck::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
    }

    /**
     * Get user-owned flashcard or abort with 404.
     */
    protected function getUserCard(Request $request, int $id): Flashcard
    {
        return Flashcard::where('id', $id)
            ->whereHas('deck', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Display a listing of user's flashcard decks.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = FlashcardDeck::where('user_id', $user->id)
            ->with(['course'])
            ->withCount('cards')
            ->withCount(['cards as due_cards_count' => function ($q) {
                $q->where(function ($sub) {
                    $sub->whereNull('next_review_at')
                        ->orWhere('next_review_at', '<=', now());
                });
            }]);

        if ($request->has('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        $decks = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => FlashcardDeckResource::collection($decks),
        ]);
    }

    /**
     * Store a newly created flashcard deck.
     */
    public function store(StoreFlashcardDeckRequest $request): JsonResponse
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
        $deck = FlashcardDeck::create($validated);
        $deck->load('course');

        return response()->json([
            'success' => true,
            'message' => 'Flashcard deck created successfully',
            'data' => new FlashcardDeckResource($deck),
        ], 201);
    }

    /**
     * Display the specified deck and its cards.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $deck = $this->getUserDeck($request, $id);
        $deck->load(['course', 'cards']);

        return response()->json([
            'success' => true,
            'data' => new FlashcardDeckResource($deck),
        ]);
    }

    /**
     * Update the specified deck.
     */
    public function update(UpdateFlashcardDeckRequest $request, int $id): JsonResponse
    {
        $deck = $this->getUserDeck($request, $id);
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

        $deck->update($validated);
        $deck->load('course');

        return response()->json([
            'success' => true,
            'message' => 'Flashcard deck updated successfully',
            'data' => new FlashcardDeckResource($deck),
        ]);
    }

    /**
     * Remove the specified deck.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $deck = $this->getUserDeck($request, $id);
        $deck->delete();

        return response()->json([
            'success' => true,
            'message' => 'Flashcard deck deleted successfully',
        ]);
    }

    /**
     * Get cards due for review in a deck.
     */
    public function dueCards(Request $request, int $id): JsonResponse
    {
        $deck = $this->getUserDeck($request, $id);
        $cards = $deck->dueCards()->get();

        return response()->json([
            'success' => true,
            'data' => FlashcardResource::collection($cards),
        ]);
    }

    /**
     * Add a flashcard to a deck.
     */
    public function storeCard(StoreFlashcardRequest $request, int $deck_id): JsonResponse
    {
        $deck = $this->getUserDeck($request, $deck_id);
        $card = $deck->cards()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Flashcard added successfully',
            'data' => new FlashcardResource($card),
        ], 201);
    }

    /**
     * Update a specific flashcard.
     */
    public function updateCard(UpdateFlashcardRequest $request, int $id): JsonResponse
    {
        $card = $this->getUserCard($request, $id);
        $card->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Flashcard updated successfully',
            'data' => new FlashcardResource($card),
        ]);
    }

    /**
     * Remove a specific flashcard.
     */
    public function destroyCard(Request $request, int $id): JsonResponse
    {
        $card = $this->getUserCard($request, $id);
        $card->delete();

        return response()->json([
            'success' => true,
            'message' => 'Flashcard deleted successfully',
        ]);
    }

    /**
     * Record a review rating for a flashcard (SuperMemo SM-2 Spaced Repetition).
     */
    public function review(ReviewFlashcardRequest $request, int $id): JsonResponse
    {
        $card = $this->getUserCard($request, $id);
        $rating = (int) $request->validated('rating');

        $card->applyReview($rating);

        return response()->json([
            'success' => true,
            'message' => 'Flashcard review recorded successfully',
            'data' => new FlashcardResource($card->fresh()),
        ]);
    }
}
