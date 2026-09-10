<?php

use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CourseScheduleController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SemesterController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniDemic Platform
|--------------------------------------------------------------------------
*/

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'UniDemic API',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Common API registration callback
$registerApiRoutes = function () {
    // Public authentication routes (throttled against brute force)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle:10,1');
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1');
    });

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        // Auth session & token management
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/tokens', [AuthController::class, 'tokens']);
            Route::delete('/tokens/{id}', [AuthController::class, 'revokeToken']);
        });

        // User profile endpoints
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

        // Academic Core: Semesters
        Route::get('/semesters/active', [SemesterController::class, 'active']);
        Route::post('/semesters/{id}/activate', [SemesterController::class, 'activate']);
        Route::apiResource('semesters', SemesterController::class);

        // Academic Core: Courses
        Route::apiResource('courses', CourseController::class);

        // Course Schedules
        Route::get('/courses/{course_id}/schedules', [CourseScheduleController::class, 'index']);
        Route::post('/courses/{course_id}/schedules', [CourseScheduleController::class, 'store']);
        Route::get('/schedules', [CourseScheduleController::class, 'index']);
        Route::put('/schedules/{id}', [CourseScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [CourseScheduleController::class, 'destroy']);

        // Course Assignments
        Route::get('/courses/{course_id}/assignments', [AssignmentController::class, 'index']);
        Route::post('/courses/{course_id}/assignments', [AssignmentController::class, 'store']);
        Route::get('/assignments', [AssignmentController::class, 'index']);
        Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
        Route::put('/assignments/{id}', [AssignmentController::class, 'update']);
        Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);

        // Course Exams
        Route::get('/courses/{course_id}/exams', [ExamController::class, 'index']);
        Route::post('/courses/{course_id}/exams', [ExamController::class, 'store']);
        Route::get('/exams', [ExamController::class, 'index']);
        Route::get('/exams/{id}', [ExamController::class, 'show']);
        Route::put('/exams/{id}', [ExamController::class, 'update']);
        Route::delete('/exams/{id}', [ExamController::class, 'destroy']);

        // Backward compatibility
        Route::get('/user', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user(),
            ]);
        });
    });
};

// Register directly at /api/... and /api/v1/...
$registerApiRoutes();

Route::prefix('v1')->group(function () use ($registerApiRoutes) {
    $registerApiRoutes();
});
