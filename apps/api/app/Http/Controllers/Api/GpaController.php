<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gpa\SimulateGpaRequest;
use App\Models\Course;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GpaController extends Controller
{
    /**
     * Map numeric score (0-100) to standard letter grade and 4.0 point scale.
     */
    public static function scoreToLetterAndPoint(float $score): array
    {
        if ($score >= 85) return ['letter' => 'A', 'point' => 4.00];
        if ($score >= 80) return ['letter' => 'A-', 'point' => 3.70];
        if ($score >= 75) return ['letter' => 'B+', 'point' => 3.30];
        if ($score >= 70) return ['letter' => 'B', 'point' => 3.00];
        if ($score >= 65) return ['letter' => 'B-', 'point' => 2.70];
        if ($score >= 60) return ['letter' => 'C+', 'point' => 2.30];
        if ($score >= 55) return ['letter' => 'C', 'point' => 2.00];
        if ($score >= 40) return ['letter' => 'D', 'point' => 1.00];
        return ['letter' => 'E', 'point' => 0.00];
    }

    /**
     * Map letter grade to standard 4.0 point scale.
     */
    public static function letterToPoint(string $letter): float
    {
        return match (strtoupper(trim($letter))) {
            'A' => 4.00,
            'A-' => 3.70,
            'B+' => 3.30,
            'B' => 3.00,
            'B-' => 2.70,
            'C+' => 2.30,
            'C' => 2.00,
            'D' => 1.00,
            default => 0.00,
        };
    }

    /**
     * Calculate score breakdown for a single course.
     */
    public function calculateCourseScore(Course $course): ?array
    {
        $grades = $course->grades;
        if ($grades->isEmpty()) {
            return null;
        }

        $components = $course->gradeComponents;
        if ($components->isNotEmpty()) {
            $totalWeight = 0;
            $weightedScoreSum = 0;

            foreach ($components as $component) {
                $componentGrades = $grades->where('grade_component_id', $component->id);
                if ($componentGrades->isNotEmpty()) {
                    $compAvg = $componentGrades->avg('score');
                    $weightedScoreSum += ($compAvg * ($component->weight / 100));
                    $totalWeight += $component->weight;
                }
            }

            $independentGrades = $grades->whereNull('grade_component_id');
            foreach ($independentGrades as $ig) {
                $w = $ig->weight ?? 10;
                $weightedScoreSum += ($ig->score * ($w / 100));
                $totalWeight += $w;
            }

            $finalScore = $totalWeight > 0 ? ($weightedScoreSum / ($totalWeight / 100)) : $grades->avg('score');
        } else {
            $hasCustomWeights = $grades->whereNotNull('weight')->count() > 0;
            if ($hasCustomWeights) {
                $totalWeight = $grades->sum('weight');
                $weightedScoreSum = $grades->sum(fn ($g) => $g->score * ($g->weight ?? 1));
                $finalScore = $totalWeight > 0 ? ($weightedScoreSum / $totalWeight) : $grades->avg('score');
            } else {
                $finalScore = $grades->avg('score');
            }
        }

        $finalScore = round((float) $finalScore, 2);
        $scale = self::scoreToLetterAndPoint($finalScore);

        return [
            'course_id' => $course->id,
            'course_name' => $course->name,
            'credits' => (int) $course->credits,
            'final_score' => $finalScore,
            'letter_grade' => $scale['letter'],
            'grade_point' => (float) $scale['point'],
        ];
    }

    /**
     * Get Course GPA, final score, and letter grade.
     */
    public function courseGpa(Request $request, int $id): JsonResponse
    {
        $course = Course::where('id', $id)
            ->whereHas('semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['grades', 'gradeComponents'])
            ->firstOrFail();

        $summary = $this->calculateCourseScore($course);

        if ($summary === null) {
            return response()->json([
                'success' => true,
                'data' => [
                    'course_id' => $course->id,
                    'course_name' => $course->name,
                    'credits' => (int) $course->credits,
                    'final_score' => 0.00,
                    'letter_grade' => 'N/A',
                    'grade_point' => 0.00,
                ],
                'message' => 'No grades recorded yet for this course',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get Semester GPA (IPS).
     */
    public function semesterGpa(Request $request, int $id): JsonResponse
    {
        $semester = Semester::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['courses.grades', 'courses.gradeComponents'])
            ->firstOrFail();

        $courseSummaries = [];
        $totalCredits = 0;
        $totalQualityPoints = 0;

        foreach ($semester->courses as $course) {
            $summary = $this->calculateCourseScore($course);
            if ($summary !== null) {
                $courseSummaries[] = $summary;
                $totalCredits += $course->credits;
                $totalQualityPoints += ($summary['grade_point'] * $course->credits);
            }
        }

        $gpa = $totalCredits > 0 ? round($totalQualityPoints / $totalCredits, 2) : 0.00;

        return response()->json([
            'success' => true,
            'data' => [
                'semester_id' => $semester->id,
                'semester_name' => $semester->name,
                'total_credits' => $totalCredits,
                'gpa' => (float) $gpa,
                'courses' => $courseSummaries,
            ],
        ]);
    }

    /**
     * Helper to compute cumulative GPA across all semesters of user.
     */
    protected function getUserCumulativeData(User $user): array
    {
        $semesters = $user->semesters()
            ->with(['courses.grades', 'courses.gradeComponents'])
            ->get();

        $totalCredits = 0;
        $totalQualityPoints = 0;
        $semesterDetails = [];

        foreach ($semesters as $semester) {
            $semCredits = 0;
            $semQualityPoints = 0;

            foreach ($semester->courses as $course) {
                $summary = $this->calculateCourseScore($course);
                if ($summary !== null) {
                    $semCredits += $course->credits;
                    $semQualityPoints += ($summary['grade_point'] * $course->credits);
                }
            }

            $semGpa = $semCredits > 0 ? round($semQualityPoints / $semCredits, 2) : 0.00;
            $totalCredits += $semCredits;
            $totalQualityPoints += $semQualityPoints;

            $semesterDetails[] = [
                'semester_id' => $semester->id,
                'name' => $semester->name,
                'credits' => $semCredits,
                'gpa' => (float) $semGpa,
            ];
        }

        $cumGpa = $totalCredits > 0 ? round($totalQualityPoints / $totalCredits, 2) : 0.00;

        return [
            'total_credits' => $totalCredits,
            'cumulative_gpa' => (float) $cumGpa,
            'semesters' => $semesterDetails,
        ];
    }

    /**
     * Get Cumulative GPA (IPK).
     */
    public function cumulativeGpa(Request $request): JsonResponse
    {
        $data = $this->getUserCumulativeData($request->user());

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Simulate future/hypothetical grades and return projected GPA.
     */
    public function simulate(SimulateGpaRequest $request): JsonResponse
    {
        $user = $request->user();
        $currentGpa = $request->input('current_gpa');
        $currentCredits = $request->input('current_credits');

        if ($currentGpa === null || $currentCredits === null) {
            $userStats = $this->getUserCumulativeData($user);
            $currentGpa = $currentGpa !== null ? (float) $currentGpa : (float) $userStats['cumulative_gpa'];
            $currentCredits = $currentCredits !== null ? (int) $currentCredits : (int) $userStats['total_credits'];
        } else {
            $currentGpa = (float) $currentGpa;
            $currentCredits = (int) $currentCredits;
        }

        $simulations = $request->input('simulations');
        $additionalCredits = 0;
        $simQualityPoints = 0;
        $details = [];

        foreach ($simulations as $sim) {
            $targetGrade = strtoupper(trim($sim['target_grade']));
            $point = self::letterToPoint($targetGrade);
            $credits = (int) $sim['credits'];
            $additionalCredits += $credits;
            $simQualityPoints += ($point * $credits);

            $courseName = $sim['course_name'] ?? null;
            if (!$courseName && !empty($sim['course_id'])) {
                $c = Course::find($sim['course_id']);
                $courseName = $c?->name;
            }

            $details[] = [
                'course_name' => $courseName ?? 'Hypothetical Course',
                'credits' => $credits,
                'target_grade' => $targetGrade,
                'grade_point' => $point,
            ];
        }

        $totalCredits = $currentCredits + $additionalCredits;
        $currentQualityPoints = $currentGpa * $currentCredits;
        $simulatedGpa = $totalCredits > 0 ? round(($currentQualityPoints + $simQualityPoints) / $totalCredits, 2) : 0.00;

        return response()->json([
            'success' => true,
            'data' => [
                'current_gpa' => (float) $currentGpa,
                'simulated_gpa' => (float) $simulatedGpa,
                'current_credits' => $currentCredits,
                'additional_credits' => $additionalCredits,
                'total_credits' => $totalCredits,
                'details' => $details,
            ],
        ]);
    }
}
