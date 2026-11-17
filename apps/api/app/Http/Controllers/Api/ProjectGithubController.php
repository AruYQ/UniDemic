<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesProjectAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Collaboration\ConnectGithubRepoRequest;
use App\Http\Resources\ProjectGithubActivityResource;
use App\Http\Resources\ProjectGithubRepoResource;
use App\Models\ProjectGithubRepo;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ProjectGithubController extends Controller
{
    use AuthorizesProjectAccess;

    /**
     * Connect or update a GitHub repository for a project workspace.
     */
    public function connect(ConnectGithubRepoRequest $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);

        if (!$project->isManager((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Only project managers can connect a GitHub repository',
            ], 403);
        }

        $validated = $request->validated();
        $fullName = "{$validated['repo_owner']}/{$validated['repo_name']}";

        $attributes = [
            'repo_owner' => $validated['repo_owner'],
            'repo_name' => $validated['repo_name'],
            'full_name' => $fullName,
            'default_branch' => $validated['default_branch'] ?? 'main',
            'html_url' => "https://github.com/{$fullName}",
        ];

        if (array_key_exists('access_token', $validated)) {
            $attributes['access_token'] = $validated['access_token'];
        }

        if (array_key_exists('webhook_secret', $validated)) {
            $attributes['webhook_secret'] = $validated['webhook_secret'];
        }

        $repo = ProjectGithubRepo::updateOrCreate(
            ['project_id' => $project->id],
            $attributes
        );

        return response()->json([
            'success' => true,
            'message' => 'GitHub repository connected successfully',
            'data' => new ProjectGithubRepoResource($repo),
        ]);
    }

    /**
     * Disconnect the GitHub repository from the project.
     */
    public function disconnect(Request $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);

        if (!$project->isManager((int) $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Only project managers can disconnect the GitHub repository',
            ], 403);
        }

        $project->githubRepo()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'GitHub repository disconnected successfully',
        ]);
    }

    /**
     * List synced GitHub activities (commits, PRs, issues, releases) for a project.
     */
    public function activities(Request $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);
        $repo = $project->githubRepo;

        if (!$repo) {
            return response()->json([
                'success' => false,
                'message' => 'No GitHub repository connected to this project',
            ], 404);
        }

        $query = $repo->activities();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $activities = $query->limit((int) $request->query('limit', 50))->get();

        return response()->json([
            'success' => true,
            'data' => ProjectGithubActivityResource::collection($activities),
        ]);
    }

    /**
     * Sync recent commits, pull requests, and issues from GitHub REST API.
     */
    public function sync(Request $request, int $project_id): JsonResponse
    {
        $project = $this->findAccessibleProject($request, $project_id);
        $repo = $project->githubRepo;

        if (!$repo) {
            return response()->json([
                'success' => false,
                'message' => 'No GitHub repository connected to this project',
            ], 404);
        }

        $headers = [
            'Accept' => 'application/vnd.github+json',
            'User-Agent' => 'UniDemic-API',
        ];

        if (!empty($repo->access_token)) {
            $headers['Authorization'] = 'Bearer ' . $repo->access_token;
        }

        $baseUrl = "https://api.github.com/repos/{$repo->full_name}";
        $client = Http::withHeaders($headers)->timeout(10);

        $syncedCount = 0;

        // 1. Fetch recent commits
        $commitsResponse = $client->get("{$baseUrl}/commits", ['per_page' => 15]);
        if ($commitsResponse->failed()) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync repository from GitHub API',
            ], 502);
        }

        foreach ($commitsResponse->json() ?? [] as $commit) {
            if (!isset($commit['sha'])) {
                continue;
            }
            $message = $commit['commit']['message'] ?? 'Commit';
            $headline = strtok($message, "\n") ?: $message;

            $repo->activities()->updateOrCreate(
                ['type' => 'commit', 'external_id' => $commit['sha']],
                [
                    'title' => mb_substr($headline, 0, 255),
                    'author_name' => $commit['author']['login'] ?? ($commit['commit']['author']['name'] ?? null),
                    'author_avatar' => $commit['author']['avatar_url'] ?? null,
                    'url' => $commit['html_url'] ?? null,
                    'state' => 'committed',
                    'occurred_at' => isset($commit['commit']['author']['date'])
                        ? Carbon::parse($commit['commit']['author']['date'])
                        : now(),
                ]
            );
            $syncedCount++;
        }

        // 2. Fetch recent pull requests
        $pullsResponse = $client->get("{$baseUrl}/pulls", ['state' => 'all', 'per_page' => 10]);
        if ($pullsResponse->successful()) {
            foreach ($pullsResponse->json() ?? [] as $pr) {
                if (!isset($pr['number'])) {
                    continue;
                }
                $state = !empty($pr['merged_at']) ? 'merged' : ($pr['state'] ?? 'open');

                $repo->activities()->updateOrCreate(
                    ['type' => 'pull_request', 'external_id' => (string) $pr['number']],
                    [
                        'title' => mb_substr($pr['title'] ?? 'Pull Request', 0, 255),
                        'author_name' => $pr['user']['login'] ?? null,
                        'author_avatar' => $pr['user']['avatar_url'] ?? null,
                        'url' => $pr['html_url'] ?? null,
                        'state' => $state,
                        'occurred_at' => isset($pr['updated_at']) ? Carbon::parse($pr['updated_at']) : now(),
                    ]
                );
                $syncedCount++;
            }
        }

        // 3. Fetch recent issues (GitHub issues endpoint returns PRs too; skip PR items)
        $issuesResponse = $client->get("{$baseUrl}/issues", ['state' => 'all', 'per_page' => 10]);
        if ($issuesResponse->successful()) {
            foreach ($issuesResponse->json() ?? [] as $issue) {
                if (!isset($issue['number']) || isset($issue['pull_request'])) {
                    continue;
                }

                $repo->activities()->updateOrCreate(
                    ['type' => 'issue', 'external_id' => (string) $issue['number']],
                    [
                        'title' => mb_substr($issue['title'] ?? 'Issue', 0, 255),
                        'author_name' => $issue['user']['login'] ?? null,
                        'author_avatar' => $issue['user']['avatar_url'] ?? null,
                        'url' => $issue['html_url'] ?? null,
                        'state' => $issue['state'] ?? 'open',
                        'occurred_at' => isset($issue['updated_at']) ? Carbon::parse($issue['updated_at']) : now(),
                    ]
                );
                $syncedCount++;
            }
        }

        $repo->update(['last_synced_at' => now()]);
        $repo->load(['activities' => fn ($q) => $q->limit(30)]);

        return response()->json([
            'success' => true,
            'message' => "Synced {$syncedCount} GitHub activities successfully",
            'data' => new ProjectGithubRepoResource($repo),
        ]);
    }

    /**
     * Receive GitHub Webhook events (push, pull_request, issues, release) with HMAC-SHA256 verification.
     */
    public function webhook(Request $request, int $project_id): JsonResponse
    {
        $repo = ProjectGithubRepo::where('project_id', $project_id)->first();
        if (!$repo || empty($repo->webhook_secret)) {
            return response()->json(['success' => false, 'message' => 'Webhook not configured'], 404);
        }

        $signature = $request->header('X-Hub-Signature-256');
        if (!$signature) {
            return response()->json(['success' => false, 'message' => 'Missing signature'], 401);
        }

        $expectedSignature = 'sha256=' . hash_hmac('sha256', $request->getContent(), $repo->webhook_secret);
        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 403);
        }

        $event = $request->header('X-GitHub-Event');
        $payload = $request->all();
        $processed = 0;

        if ($event === 'push' && !empty($payload['commits'])) {
            foreach ($payload['commits'] as $commit) {
                if (empty($commit['id'])) {
                    continue;
                }
                $headline = strtok($commit['message'] ?? 'Commit', "\n") ?: 'Commit';
                $repo->activities()->updateOrCreate(
                    ['type' => 'commit', 'external_id' => $commit['id']],
                    [
                        'title' => mb_substr($headline, 0, 255),
                        'author_name' => $commit['author']['username'] ?? ($commit['author']['name'] ?? null),
                        'author_avatar' => $payload['sender']['avatar_url'] ?? null,
                        'url' => $commit['url'] ?? null,
                        'state' => 'committed',
                        'occurred_at' => isset($commit['timestamp']) ? Carbon::parse($commit['timestamp']) : now(),
                    ]
                );
                $processed++;
            }
        } elseif ($event === 'pull_request' && !empty($payload['pull_request'])) {
            $pr = $payload['pull_request'];
            $state = !empty($pr['merged']) ? 'merged' : ($pr['state'] ?? 'open');
            $repo->activities()->updateOrCreate(
                ['type' => 'pull_request', 'external_id' => (string) ($pr['number'] ?? $payload['number'])],
                [
                    'title' => mb_substr($pr['title'] ?? 'Pull Request', 0, 255),
                    'author_name' => $pr['user']['login'] ?? null,
                    'author_avatar' => $pr['user']['avatar_url'] ?? null,
                    'url' => $pr['html_url'] ?? null,
                    'state' => $state,
                    'occurred_at' => now(),
                ]
            );
            $processed++;
        } elseif ($event === 'issues' && !empty($payload['issue'])) {
            $issue = $payload['issue'];
            $repo->activities()->updateOrCreate(
                ['type' => 'issue', 'external_id' => (string) $issue['number']],
                [
                    'title' => mb_substr($issue['title'] ?? 'Issue', 0, 255),
                    'author_name' => $issue['user']['login'] ?? null,
                    'author_avatar' => $issue['user']['avatar_url'] ?? null,
                    'url' => $issue['html_url'] ?? null,
                    'state' => $issue['state'] ?? 'open',
                    'occurred_at' => now(),
                ]
            );
            $processed++;
        }

        $repo->update(['last_synced_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Webhook processed',
            'processed' => $processed,
        ]);
    }
}
