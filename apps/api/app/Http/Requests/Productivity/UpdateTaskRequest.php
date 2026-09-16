<?php

namespace App\Http\Requests\Productivity;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
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
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'deadline' => ['nullable', 'date'],
            'label' => ['nullable', 'string', 'max:50'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurrence_pattern' => ['nullable', 'in:daily,weekly,monthly'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'is_completed' => ['nullable', 'boolean'],
        ];
    }
}
