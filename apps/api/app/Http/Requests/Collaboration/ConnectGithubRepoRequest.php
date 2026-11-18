<?php

namespace App\Http\Requests\Collaboration;

use Illuminate\Foundation\Http\FormRequest;

class ConnectGithubRepoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'repo_owner' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'repo_name' => ['required', 'string', 'max:150', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'default_branch' => ['nullable', 'string', 'max:100'],
            'access_token' => ['nullable', 'string', 'max:255'],
            'webhook_secret' => ['nullable', 'string', 'max:255'],
        ];
    }
}
