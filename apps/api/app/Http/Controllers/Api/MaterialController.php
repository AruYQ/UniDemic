<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\StoreMaterialRequest;
use App\Http\Requests\Learning\UpdateMaterialRequest;
use App\Http\Requests\Learning\UploadMaterialFileRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Course;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    /**
     * Get user-owned course or abort with 404.
     */
    protected function getCourse(Request $request, int $courseId): Course
    {
        return Course::where('id', $courseId)
            ->whereHas('semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Get user-owned material or abort with 404.
     */
    protected function getMaterial(Request $request, int $id): Material
    {
        return Material::where('id', $id)
            ->whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();
    }

    /**
     * Display a listing of materials for a course or all courses of the user.
     */
    public function index(Request $request, ?int $course_id = null): JsonResponse
    {
        $courseId = $course_id ?? $request->query('course_id');

        $query = Material::whereHas('course.semester', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with('course');

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        $materials = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => MaterialResource::collection($materials),
        ]);
    }

    /**
     * Store a newly created material.
     */
    public function store(StoreMaterialRequest $request, ?int $course_id = null): JsonResponse
    {
        $targetCourseId = $course_id ?? $request->input('course_id');
        if (!$targetCourseId) {
            return response()->json([
                'success' => false,
                'message' => 'course_id is required',
            ], 422);
        }

        $course = $this->getCourse($request, (int) $targetCourseId);
        $validated = $request->validated();

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('materials', 'public');
            $validated['file_path'] = $path;
            $validated['file_size'] = $file->getSize();
        }

        $material = $course->materials()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Material created successfully',
            'data' => new MaterialResource($material),
        ], 201);
    }

    /**
     * Display the specified material.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $material = $this->getMaterial($request, $id);
        $material->load('course');

        return response()->json([
            'success' => true,
            'data' => new MaterialResource($material),
        ]);
    }

    /**
     * Update the specified material.
     */
    public function update(UpdateMaterialRequest $request, int $id): JsonResponse
    {
        $material = $this->getMaterial($request, $id);
        $validated = $request->validated();

        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($material->file_path) {
                Storage::disk('public')->delete($material->file_path);
            }
            $file = $request->file('file');
            $path = $file->store('materials', 'public');
            $validated['file_path'] = $path;
            $validated['file_size'] = $file->getSize();
        }

        $material->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Material updated successfully',
            'data' => new MaterialResource($material->fresh()),
        ]);
    }

    /**
     * Remove the specified material.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $material = $this->getMaterial($request, $id);

        if ($material->file_path) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material deleted successfully',
        ]);
    }

    /**
     * Upload a file attachment for learning materials.
     */
    public function uploadFile(UploadMaterialFileRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $folder = $request->input('folder', 'materials');

        $path = $file->store($folder, 'public');
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'file_path' => $path,
                'file_url' => $url,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
            ],
        ]);
    }
}
