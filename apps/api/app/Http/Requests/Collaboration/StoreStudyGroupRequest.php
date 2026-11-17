<?php

namespace App\Http\Requests\Collaboration;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudyGroupRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'subject' => ['nullable', 'string', 'max:150'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'is_public' => ['sometimes', 'boolean'],
            'max_members' => ['nullable', 'integer', 'min:2', 'max:200'],
        ];
    }
}
