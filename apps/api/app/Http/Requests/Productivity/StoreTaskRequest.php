<?php

namespace App\Http\Requests\Productivity;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'deadline' => ['nullable', 'date'],
            'label' => ['nullable', 'string', 'max:50'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurrence_pattern' => ['nullable', 'in:daily,weekly,monthly'],
            'subtasks' => ['nullable', 'array'],
            'subtasks.*.title' => ['required_with:subtasks', 'string', 'max:255'],
            'subtasks.*.order' => ['nullable', 'integer'],
        ];
    }
}
