<?php

namespace App\Http\Requests\Learning;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizQuestionRequest extends FormRequest
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
            'type' => ['required', 'in:multiple_choice,true_false,short_answer'],
            'question' => ['required', 'string'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string'],
            'correct_answer' => ['required', 'string'],
            'explanation' => ['nullable', 'string'],
            'order' => ['nullable', 'integer'],
        ];
    }
}
