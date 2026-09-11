<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Get user-owned course or abort with 404.
     */
    protected function getCourse(Request $request, int $courseId): Course
    {
        return Course::where('id', $courseId)
            ->whereHas('semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Get user-owned attendance or abort with 404.
     */
    protected function getAttendance(Request $request, int $id): Attendance
    {
        return Attendance::where('id', $id)
            ->whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * List attendance records for a course or for all courses of the user.
     */
    public function index(Request $request, ?int $course_id = null): JsonResponse
    {
        $courseId = $course_id ?? $request->query('course_id');

        $query = Attendance::whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with('course')
            ->orderBy('date', 'desc');

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $attendances = $query->get();

        return response()->json([
            'success' => true,
            'data' => AttendanceResource::collection($attendances),
        ]);
    }

    /**
     * Record a new attendance entry for a course.
     */
    public function store(StoreAttendanceRequest $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);

        $attendance = $course->attendances()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'data' => new AttendanceResource($attendance),
        ], 201);
    }

    /**
     * Display the specified attendance record.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $attendance = $this->getAttendance($request, $id);
        $attendance->load('course');

        return response()->json([
            'success' => true,
            'data' => new AttendanceResource($attendance),
        ]);
    }

    /**
     * Update an attendance record.
     */
    public function update(UpdateAttendanceRequest $request, int $id): JsonResponse
    {
        $attendance = $this->getAttendance($request, $id);
        $attendance->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully',
            'data' => new AttendanceResource($attendance->fresh()),
        ]);
    }

    /**
     * Remove an attendance record.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $attendance = $this->getAttendance($request, $id);
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance deleted successfully',
        ]);
    }

    /**
     * Get attendance summary, percentage, and warning calculation for a course.
     */
    public function summary(Request $request, int $course_id): JsonResponse
    {
        $course = $this->getCourse($request, $course_id);

        $attendances = $course->attendances;
        $total = $attendances->count();
        $present = $attendances->where('status', 'present')->count();
        $absent = $attendances->where('status', 'absent')->count();
        $permission = $attendances->whereIn('status', ['permission', 'sick'])->count();

        $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 100.00;
        $minPercentage = 75.00;

        // Standard semester meeting count is 14
        $assumedTotal = max(14, $total);
        $maxAbsencesAllowed = (int) floor($assumedTotal * 0.25);
        $remainingSafeAbsences = max(0, $maxAbsencesAllowed - $absent);
        $warning = $percentage < $minPercentage || ($remainingSafeAbsences <= 1 && $total > 0);

        return response()->json([
            'success' => true,
            'data' => [
                'course_id' => $course->id,
                'course_name' => $course->name,
                'total_classes' => $total,
                'present_count' => $present,
                'absent_count' => $absent,
                'permission_count' => $permission,
                'attendance_percentage' => (float) $percentage,
                'minimum_percentage' => (float) $minPercentage,
                'warning' => $warning,
                'remaining_safe_absences' => $remainingSafeAbsences,
            ],
        ]);
    }
}
