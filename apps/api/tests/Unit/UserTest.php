<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_casts_preferences_as_array(): void
    {
        $user = User::factory()->create([
            'preferences' => [
                'theme' => 'dark',
                'notifications' => true,
            ],
        ]);

        $this->assertIsArray($user->preferences);
        $this->assertEquals('dark', $user->preferences['theme']);
    }

    public function test_user_password_is_hidden(): void
    {
        $user = User::factory()->create();

        $this->assertArrayNotHasKey('password', $user->toArray());
        $this->assertArrayNotHasKey('remember_token', $user->toArray());
    }

    public function test_user_has_api_tokens(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token');

        $this->assertNotNull($token->plainTextToken);
        $this->assertCount(1, $user->tokens);
    }
}
