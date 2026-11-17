<?php

namespace App\Http\Requests\Collaboration;

use Illuminate\Foundation\Http\FormRequest;

class ReorderProjectTasksRequest extends FormRequest
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
            'tasks' => ['required', 'array', 'min:1'],
            'tasks.*.id' => ['required', 'integer', 'exists:project_tasks,id'],
            'tasks.*.status' => ['required', 'string', 'in:todo,in_progress,done'],
            'tasks.*.position' => ['required', 'integer', 'min:0'],
        ];
    }
}
