<?php

namespace App\Http\Requests\Collaboration;

use Illuminate\Foundation\Http\FormRequest;

class JoinStudyGroupRequest extends FormRequest
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
            'invite_code' => ['required_without:study_group_id', 'nullable', 'string', 'max:16'],
            'study_group_id' => ['required_without:invite_code', 'nullable', 'integer', 'exists:study_groups,id'],
        ];
    }
}
