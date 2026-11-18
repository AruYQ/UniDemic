<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\StoreNoteRequest;
use App\Http\Requests\Learning\UpdateNoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Course;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    /**
     * Get user-owned note or abort with 404.
     */
    protected function getUserNote(Request $request, int $id): Note
    {
        return Note::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
    }

    /**
     * Display a listing of user notes with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Note::where('user_id', $user->id)
            ->with(['course', 'linkedNotes', 'backlinks']);

        if ($request->has('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        if ($request->has('is_pinned')) {
            $query->where('is_pinned', filter_var($request->query('is_pinned'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('tag')) {
            $query->whereJsonContains('tags', $request->query('tag'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $notes = $query->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => NoteResource::collection($notes),
        ]);
    }

    /**
     * Store a newly created note.
     */
    public function store(StoreNoteRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Verify course ownership if course_id is provided
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

        $linkedNoteIds = $validated['linked_note_ids'] ?? [];
        unset($validated['linked_note_ids']);

        $validated['user_id'] = $user->id;
        $note = Note::create($validated);

        if (!empty($linkedNoteIds)) {
            // Only link to user-owned notes
            $validLinkedIds = Note::where('user_id', $user->id)
                ->whereIn('id', $linkedNoteIds)
                ->pluck('id')
                ->toArray();
            $note->linkedNotes()->sync($validLinkedIds);
        }

        $note->load(['course', 'linkedNotes', 'backlinks']);

        return response()->json([
            'success' => true,
            'message' => 'Note created successfully',
            'data' => new NoteResource($note),
        ], 201);
    }

    /**
     * Display the specified note.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $note = $this->getUserNote($request, $id);
        $note->load(['course', 'linkedNotes', 'backlinks']);

        return response()->json([
            'success' => true,
            'data' => new NoteResource($note),
        ]);
    }

    /**
     * Update the specified note.
     */
    public function update(UpdateNoteRequest $request, int $id): JsonResponse
    {
        $note = $this->getUserNote($request, $id);
        $user = $request->user();
        $validated = $request->validated();

        // Verify course ownership if course_id is updated
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

        if (array_key_exists('linked_note_ids', $validated)) {
            $linkedNoteIds = $validated['linked_note_ids'] ?? [];
            unset($validated['linked_note_ids']);

            $validLinkedIds = Note::where('user_id', $user->id)
                ->where('id', '!=', $note->id)
                ->whereIn('id', $linkedNoteIds)
                ->pluck('id')
                ->toArray();
            $note->linkedNotes()->sync($validLinkedIds);
        }

        $note->update($validated);
        $note->load(['course', 'linkedNotes', 'backlinks']);

        return response()->json([
            'success' => true,
            'message' => 'Note updated successfully',
            'data' => new NoteResource($note),
        ]);
    }

    /**
     * Remove the specified note.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $note = $this->getUserNote($request, $id);
        $note->delete();

        return response()->json([
            'success' => true,
            'message' => 'Note deleted successfully',
        ]);
    }

    /**
     * Link two notes together.
     */
    public function linkNote(Request $request, int $id, int $target_id): JsonResponse
    {
        $note = $this->getUserNote($request, $id);
        $targetNote = $this->getUserNote($request, $target_id);

        if ($note->id === $targetNote->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot link note to itself',
            ], 422);
        }

        $note->linkedNotes()->syncWithoutDetaching([$targetNote->id]);
        $note->load(['course', 'linkedNotes', 'backlinks']);

        return response()->json([
            'success' => true,
            'message' => 'Note linked successfully',
            'data' => new NoteResource($note),
        ]);
    }

    /**
     * Unlink two notes.
     */
    public function unlinkNote(Request $request, int $id, int $target_id): JsonResponse
    {
        $note = $this->getUserNote($request, $id);
        $note->linkedNotes()->detach($target_id);
        $note->load(['course', 'linkedNotes', 'backlinks']);

        return response()->json([
            'success' => true,
            'message' => 'Note unlinked successfully',
            'data' => new NoteResource($note),
        ]);
    }
}
