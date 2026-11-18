<?php

namespace App\Http\Requests\Communication;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
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
            'content' => ['required', 'string'],
            'type' => ['nullable', 'string', 'in:text,image,file,academic_ref,system'],
            'reply_to_id' => ['nullable', 'integer', 'exists:messages,id'],
            'reference_type' => ['nullable', 'string', 'in:course,assignment,exam,material,note,task,quiz'],
            'reference_id' => ['nullable', 'integer'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:25600'], // max 25MB per file
        ];
    }
}
