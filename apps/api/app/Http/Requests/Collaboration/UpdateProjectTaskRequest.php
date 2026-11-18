<?php

namespace App\Http\Requests\Collaboration;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectTaskRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'milestone_id' => ['nullable', 'integer', 'exists:project_milestones,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', 'string', 'in:todo,in_progress,done'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high,urgent'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'labels' => ['nullable', 'array'],
            'labels.*' => ['string', 'max:50'],
        ];
    }
}
