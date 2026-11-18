<?php

namespace App\Http\Requests\Learning;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:300'],
            'questions' => ['nullable', 'array'],
            'questions.*.type' => ['required_with:questions', 'in:multiple_choice,true_false,short_answer'],
            'questions.*.question' => ['required_with:questions', 'string'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.correct_answer' => ['required_with:questions', 'string'],
            'questions.*.explanation' => ['nullable', 'string'],
            'questions.*.order' => ['nullable', 'integer'],
        ];
    }
}
