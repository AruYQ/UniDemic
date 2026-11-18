<?php

namespace App\Http\Requests\Communication;

use Illuminate\Foundation\Http\FormRequest;

class StoreConversationRequest extends FormRequest
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
            'type' => ['required', 'in:direct,group,course'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
            'name' => ['nullable', 'string', 'max:255', 'required_if:type,group,course'],
            'description' => ['nullable', 'string'],
            'course_id' => ['nullable', 'required_if:type,course', 'integer', 'exists:courses,id'],
        ];
    }
}
