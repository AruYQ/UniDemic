<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamRequest extends FormRequest
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
            'type' => ['sometimes', 'required', 'string', 'max:50'],
            'date' => ['sometimes', 'required', 'date'],
            'time' => ['nullable', 'string', 'max:20'],
            'location' => ['nullable', 'string', 'max:100'],
            'topics' => ['nullable', 'string'],
        ];
    }
}
