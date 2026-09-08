<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
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
