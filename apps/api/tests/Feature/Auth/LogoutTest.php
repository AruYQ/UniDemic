<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);

        $this->assertCount(0, $user->tokens);
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    public function test_user_can_list_and_revoke_specific_tokens(): void
    {
        $user = User::factory()->create();
        $token1 = $user->createToken('phone')->plainTextToken;
        $user->createToken('laptop');

        $this->assertCount(2, $user->tokens);

        // List tokens
        $listResponse = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->getJson('/api/auth/tokens');

        $listResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $tokenIdToRevoke = $user->tokens()->where('name', 'laptop')->first()->id;

        // Revoke token
        $revokeResponse = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->deleteJson('/api/auth/tokens/'.$tokenIdToRevoke);

        $revokeResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Device session revoked successfully',
            ]);

        $this->assertCount(1, $user->fresh()->tokens);
    }
}
