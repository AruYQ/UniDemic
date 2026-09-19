<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Communication\StoreCourseChannelRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseDiscussionController extends Controller
{
    /**
     * Get user-owned or accessible course or abort with 404.
     */
    protected function getCourse(Request $request, int $courseId): Course
    {
        return Course::where('id', $courseId)
            ->whereHas('semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Display a listing of discussion channels for a course, auto-provisioning defaults if empty.
     */
    public function index(Request $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);
        $user = $request->user();

        $channels = Conversation::where('type', 'course')
            ->where('course_id', $course->id)
            ->with(['participants.user', 'lastMessage.user', 'course'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Auto-provision standard channels if none exist
        if ($channels->isEmpty()) {
            $defaultChannels = [
                ['name' => '#general', 'description' => 'Diskusi umum seputar perkuliahan ' . $course->name],
                ['name' => '#tugas', 'description' => 'Tanya jawab dan koordinasi tugas perkuliahan'],
                ['name' => '#ujian', 'description' => 'Persiapan, kisi-kisi, dan review UTS/UAS'],
                ['name' => '#resources', 'description' => 'Bahan referensi, buku, dan materi pendukung'],
            ];

            DB::transaction(function () use ($course, $user, $defaultChannels) {
                foreach ($defaultChannels as $ch) {
                    $conv = Conversation::create([
                        'type' => 'course',
                        'course_id' => $course->id,
                        'name' => $ch['name'],
                        'description' => $ch['description'],
                        'created_by' => $user->id,
                    ]);

                    $conv->participants()->create([
                        'user_id' => $user->id,
                        'role' => 'admin',
                        'joined_at' => now(),
                        'last_read_at' => now(),
                    ]);
                }
            });

            $channels = Conversation::where('type', 'course')
                ->where('course_id', $course->id)
                ->with(['participants.user', 'lastMessage.user', 'course'])
                ->orderBy('created_at', 'asc')
                ->get();
        } else {
            // Ensure the user is a participant of existing channels
            foreach ($channels as $channel) {
                $isParticipant = $channel->participants()->where('user_id', $user->id)->exists();
                if (!$isParticipant) {
                    $channel->participants()->create([
                        'user_id' => $user->id,
                        'role' => 'member',
                        'joined_at' => now(),
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => ConversationResource::collection($channels),
        ]);
    }

    /**
     * Create a new custom discussion channel for the course.
     */
    public function store(StoreCourseChannelRequest $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);
        $user = $request->user();
        $validated = $request->validated();

        $name = trim($validated['name']);
        if (!str_starts_with($name, '#')) {
            $name = '#' . $name;
        }

        $channel = DB::transaction(function () use ($course, $user, $name, $validated) {
            $conv = Conversation::create([
                'type' => 'course',
                'course_id' => $course->id,
                'name' => $name,
                'description' => $validated['description'] ?? null,
                'created_by' => $user->id,
            ]);

            $conv->participants()->create([
                'user_id' => $user->id,
                'role' => 'admin',
                'joined_at' => now(),
                'last_read_at' => now(),
            ]);

            return $conv;
        });

        $channel->load(['participants.user', 'lastMessage.user', 'course']);

        return response()->json([
            'success' => true,
            'message' => 'Course discussion channel created successfully',
            'data' => new ConversationResource($channel),
        ], 201);
    }
}
