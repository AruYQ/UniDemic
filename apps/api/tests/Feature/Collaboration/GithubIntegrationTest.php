<?php

namespace Tests\Feature\Collaboration;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GithubIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_connect_github_repo_without_exposing_secrets(): void
    {
        $owner = User::factory()->create();
        $token = $owner->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/projects', ['name' => 'UniDemic Platform']);
        $projectId = $projRes->json('data.id');

        $connectRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/github/connect", [
                'repo_owner' => 'AruYQ',
                'repo_name' => 'UniDemic',
                'default_branch' => 'develop',
                'access_token' => 'ghp_supersecret_token_123',
                'webhook_secret' => 'whsec_my_secret_456',
            ]);

        $connectRes->assertStatus(200)
            ->assertJsonPath('data.full_name', 'AruYQ/UniDemic')
            ->assertJsonPath('data.has_access_token', true)
            ->assertJsonPath('data.has_webhook_secret', true)
            ->assertJsonMissing(['access_token' => 'ghp_supersecret_token_123'])
            ->assertJsonMissing(['webhook_secret' => 'whsec_my_secret_456']);
    }

    public function test_sync_fetches_commits_prs_and_issues_idempotently(): void
    {
        Http::fake([
            'api.github.com/repos/AruYQ/UniDemic/commits*' => Http::response([
                [
                    'sha' => 'abc123def456',
                    'html_url' => 'https://github.com/AruYQ/UniDemic/commit/abc123def456',
                    'commit' => [
                        'message' => "feat(api): add collaboration backend\n\nDetailed description",
                        'author' => [
                            'name' => 'Rekis',
                            'date' => '2026-11-17T03:00:00Z',
                        ],
                    ],
                    'author' => [
                        'login' => 'rekis-0103',
                        'avatar_url' => 'https://avatars.githubusercontent.com/u/1',
                    ],
                ],
            ], 200),
            'api.github.com/repos/AruYQ/UniDemic/pulls*' => Http::response([
                [
                    'number' => 12,
                    'title' => 'feat(api): implement Phase 7 collaboration',
                    'state' => 'open',
                    'merged_at' => null,
                    'html_url' => 'https://github.com/AruYQ/UniDemic/pull/12',
                    'updated_at' => '2026-11-17T03:05:00Z',
                    'user' => [
                        'login' => 'rekis-0103',
                        'avatar_url' => 'https://avatars.githubusercontent.com/u/1',
                    ],
                ],
            ], 200),
            'api.github.com/repos/AruYQ/UniDemic/issues*' => Http::response([
                [
                    'number' => 5,
                    'title' => 'Add Kanban drag-and-drop API',
                    'state' => 'closed',
                    'html_url' => 'https://github.com/AruYQ/UniDemic/issues/5',
                    'updated_at' => '2026-11-17T02:00:00Z',
                    'user' => [
                        'login' => 'AruYQ',
                        'avatar_url' => 'https://avatars.githubusercontent.com/u/2',
                    ],
                ],
            ], 200),
        ]);

        $owner = User::factory()->create();
        $token = $owner->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/projects', ['name' => 'UniDemic Sync']);
        $projectId = $projRes->json('data.id');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/github/connect", [
                'repo_owner' => 'AruYQ',
                'repo_name' => 'UniDemic',
            ]);

        // First sync
        $syncRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/github/sync");

        $syncRes->assertStatus(200)
            ->assertJsonCount(3, 'data.activities');

        // Second sync must remain idempotent (still 3 rows total)
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/github/sync")
            ->assertStatus(200);

        $activitiesRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson("/api/projects/{$projectId}/github/activities");
        $activitiesRes->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_github_webhook_verifies_hmac_signature_and_stores_push_event(): void
    {
        $owner = User::factory()->create();
        $token = $owner->createToken('test')->plainTextToken;

        $projRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/projects', ['name' => 'Webhook Project']);
        $projectId = $projRes->json('data.id');

        $secret = 'my_webhook_hmac_secret';
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/projects/{$projectId}/github/connect", [
                'repo_owner' => 'AruYQ',
                'repo_name' => 'UniDemic',
                'webhook_secret' => $secret,
            ]);

        $payload = json_encode([
            'sender' => ['avatar_url' => 'https://avatars.githubusercontent.com/u/1'],
            'commits' => [
                [
                    'id' => 'deadbeef001',
                    'message' => 'fix(api): handle edge case in Kanban move',
                    'url' => 'https://github.com/AruYQ/UniDemic/commit/deadbeef001',
                    'timestamp' => '2026-11-17T03:30:00Z',
                    'author' => ['username' => 'rekis-0103'],
                ],
            ],
        ]);

        // Missing signature -> 401
        $this->call('POST', "/api/webhooks/github/{$projectId}", [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_GITHUB_EVENT' => 'push',
        ], $payload)->assertStatus(401);

        // Invalid signature -> 403
        $this->call('POST', "/api/webhooks/github/{$projectId}", [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_GITHUB_EVENT' => 'push',
            'HTTP_X_HUB_SIGNATURE_256' => 'sha256=invalidsignature',
        ], $payload)->assertStatus(403);

        // Valid HMAC signature -> 200 & stored in DB
        $validSignature = 'sha256='.hash_hmac('sha256', $payload, $secret);
        $this->call('POST', "/api/webhooks/github/{$projectId}", [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_GITHUB_EVENT' => 'push',
            'HTTP_X_HUB_SIGNATURE_256' => $validSignature,
        ], $payload)->assertStatus(200)
            ->assertJsonPath('processed', 1);

        $this->assertDatabaseHas('project_github_activities', [
            'type' => 'commit',
            'external_id' => 'deadbeef001',
            'title' => 'fix(api): handle edge case in Kanban move',
        ]);
    }
}
