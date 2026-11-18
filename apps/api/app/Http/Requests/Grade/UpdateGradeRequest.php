<?php

namespace App\Http\Requests\Grade;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGradeRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'score' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'grade_component_id' => ['nullable', 'integer', 'exists:grade_components,id'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
