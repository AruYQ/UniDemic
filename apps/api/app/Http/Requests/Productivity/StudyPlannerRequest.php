<?php

namespace App\Http\Requests\Productivity;

use Illuminate\Foundation\Http\FormRequest;

class StudyPlannerRequest extends FormRequest
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
            'start_date' => ['nullable', 'date'],
            'days_ahead' => ['nullable', 'integer', 'min:1', 'max:30'],
            'max_hours_per_day' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }
}
