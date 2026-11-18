<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamRequest extends FormRequest
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
            'type' => ['required', 'string', 'max:50'],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'string', 'max:20'],
            'location' => ['nullable', 'string', 'max:100'],
            'topics' => ['nullable', 'string'],
        ];
    }
}
