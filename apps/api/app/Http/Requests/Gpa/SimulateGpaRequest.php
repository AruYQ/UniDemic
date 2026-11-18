<?php

namespace App\Http\Requests\Gpa;

use Illuminate\Foundation\Http\FormRequest;

class SimulateGpaRequest extends FormRequest
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
            'current_gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
            'current_credits' => ['nullable', 'integer', 'min:0', 'max:300'],
            'simulations' => ['required', 'array', 'min:1'],
            'simulations.*.course_id' => ['nullable', 'integer'],
            'simulations.*.course_name' => ['nullable', 'string', 'max:255'],
            'simulations.*.credits' => ['required', 'integer', 'min:1', 'max:12'],
            'simulations.*.target_grade' => ['required', 'string', 'in:A,A-,B+,B,B-,C+,C,D,E'],
        ];
    }
}
