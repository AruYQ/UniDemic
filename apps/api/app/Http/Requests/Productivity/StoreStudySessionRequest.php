<?php

namespace App\Http\Requests\Productivity;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudySessionRequest extends FormRequest
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
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'task_id' => ['nullable', 'integer', 'exists:productivity_tasks,id'],
            'type' => ['nullable', 'in:pomodoro,custom,stopwatch'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'started_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
