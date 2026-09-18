<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Semester;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Attendance;
use App\Models\GradeComponent;
use App\Models\Grade;
use App\Models\Exam;
use App\Models\Assignment;
use App\Models\Task;
use App\Models\TaskSubtask;
use App\Models\Goal;
use App\Models\StudySession;
use App\Models\Material;
use App\Models\Note;
use App\Models\FlashcardDeck;
use App\Models\Flashcard;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizAttempt;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Akun Mahasiswa Demo
        $demoUsers = [
            [
                'name' => 'Budi Mahasiswa',
                'email' => 'test@example.com',
                'password' => Hash::make('password'),
                'university' => 'Institut Teknologi UniDemic',
                'major' => 'Teknik Informatika',
                'student_id' => '220101001',
                'bio' => 'Mahasiswa semester 5 yang antusias mendalami arsitektur perangkat lunak, AI, dan algoritma.',
            ],
            [
                'name' => 'Aru Mahasiswa',
                'email' => 'budi@unidemic.id',
                'password' => Hash::make('password123'),
                'university' => 'Institut Teknologi UniDemic',
                'major' => 'Teknik Informatika',
                'student_id' => '220101002',
                'bio' => 'Teknik Informatika 2022. Pembelajar aktif.',
            ],
        ];

        foreach ($demoUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            $this->seedUserData($user);
        }

        $this->command->info('Database UniDemic berhasil di-seed lengkap untuk seluruh modul!');
    }

    private function seedUserData(User $user): void
    {
        // 2. Semester Aktif
        $semester = Semester::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Semester Ganjil 2026/2027'],
            [
                'start_date' => Carbon::now()->subMonths(1)->startOfMonth()->toDateString(),
                'end_date' => Carbon::now()->addMonths(4)->endOfMonth()->toDateString(),
                'is_active' => true,
            ]
        );

        // 3. Mata Kuliah (Courses)
        $coursesData = [
            [
                'code' => 'IF3101',
                'name' => 'Algoritma & Pemrograman',
                'lecturer' => 'Dr. Eng. Rian Pratama, S.T., M.T.',
                'credits' => 3,
                'classroom' => 'Lab Komputer 3',
                'color' => '#6B7FD7',
            ],
            [
                'code' => 'IF3102',
                'name' => 'Sistem Operasi',
                'lecturer' => 'Prof. Hendra Kusuma, Ph.D.',
                'credits' => 3,
                'classroom' => 'Gedung B 204',
                'color' => '#4ECDC4',
            ],
            [
                'code' => 'IF3103',
                'name' => 'Basis Data Lanjut',
                'lecturer' => 'Siti Nurhaliza, M.T.',
                'credits' => 3,
                'classroom' => 'Gedung C 101',
                'color' => '#F7B731',
            ],
            [
                'code' => 'IF3104',
                'name' => 'Jaringan Komputer',
                'lecturer' => 'Agus Setiawan, M.Kom.',
                'credits' => 3,
                'classroom' => 'Lab Jaringan 1',
                'color' => '#E05B5B',
            ],
        ];

        $courses = [];
        foreach ($coursesData as $c) {
            $courses[$c['code']] = Course::firstOrCreate(
                ['semester_id' => $semester->id, 'code' => $c['code']],
                array_merge($c, ['semester_id' => $semester->id])
            );
        }

        // 4. Jadwal Kuliah (Course Schedules)
        $schedules = [
            ['course_id' => $courses['IF3101']->id, 'day' => 'Senin', 'start_time' => '08:00', 'end_time' => '10:30', 'room' => 'Lab Komputer 3'],
            ['course_id' => $courses['IF3102']->id, 'day' => 'Selasa', 'start_time' => '10:30', 'end_time' => '13:00', 'room' => 'Gedung B 204'],
            ['course_id' => $courses['IF3103']->id, 'day' => 'Rabu', 'start_time' => '13:30', 'end_time' => '16:00', 'room' => 'Gedung C 101'],
            ['course_id' => $courses['IF3104']->id, 'day' => 'Kamis', 'start_time' => '08:00', 'end_time' => '10:30', 'room' => 'Lab Jaringan 1'],
        ];
        foreach ($schedules as $s) {
            CourseSchedule::firstOrCreate(
                ['course_id' => $s['course_id'], 'day' => $s['day']],
                $s
            );
        }

        // 5. Kehadiran (Attendances)
        $attendances = [
            ['course_id' => $courses['IF3101']->id, 'date' => Carbon::now()->subWeeks(2)->toDateString(), 'status' => 'present', 'notes' => 'Hadir tepat waktu'],
            ['course_id' => $courses['IF3101']->id, 'date' => Carbon::now()->subWeeks(1)->toDateString(), 'status' => 'present', 'notes' => 'Hadir aktif bertanya'],
            ['course_id' => $courses['IF3102']->id, 'date' => Carbon::now()->subWeeks(2)->toDateString(), 'status' => 'present', 'notes' => 'Hadir'],
            ['course_id' => $courses['IF3102']->id, 'date' => Carbon::now()->subWeeks(1)->toDateString(), 'status' => 'permission', 'notes' => 'Izin delegasi lomba'],
            ['course_id' => $courses['IF3103']->id, 'date' => Carbon::now()->subWeeks(1)->toDateString(), 'status' => 'present', 'notes' => 'Hadir sesi lab'],
        ];
        foreach ($attendances as $att) {
            Attendance::firstOrCreate(
                ['course_id' => $att['course_id'], 'date' => $att['date']],
                $att
            );
        }

        // 6. Komponen Nilai & Nilai (Grade Components & Grades)
        $compUts = GradeComponent::firstOrCreate(
            ['course_id' => $courses['IF3101']->id, 'name' => 'UTS'],
            ['weight' => 30.00]
        );
        $compTugas = GradeComponent::firstOrCreate(
            ['course_id' => $courses['IF3101']->id, 'name' => 'Tugas & Kuis'],
            ['weight' => 30.00]
        );
        $compUas = GradeComponent::firstOrCreate(
            ['course_id' => $courses['IF3101']->id, 'name' => 'UAS'],
            ['weight' => 40.00]
        );

        Grade::firstOrCreate(
            ['course_id' => $courses['IF3101']->id, 'name' => 'Tugas 1 - Big O Analysis'],
            [
                'grade_component_id' => $compTugas->id,
                'score' => 95.00,
                'weight' => 10.00,
            ]
        );
        Grade::firstOrCreate(
            ['course_id' => $courses['IF3101']->id, 'name' => 'Tugas 2 - Sorting Algorithms'],
            [
                'grade_component_id' => $compTugas->id,
                'score' => 88.00,
                'weight' => 10.00,
            ]
        );
        Grade::firstOrCreate(
            ['course_id' => $courses['IF3101']->id, 'name' => 'Ujian Tengah Semester (UTS)'],
            [
                'grade_component_id' => $compUts->id,
                'score' => 90.00,
                'weight' => 30.00,
            ]
        );

        // 7. Ujian (Exams)
        $exams = [
            [
                'course_id' => $courses['IF3101']->id,
                'type' => 'UTS',
                'date' => Carbon::now()->addWeeks(3)->toDateString(),
                'time' => '08:00 - 10:00',
                'location' => 'Lab Komputer 3',
                'topics' => 'Kompleksitas Big-O, Sorting, Searching, Stack & Queue',
            ],
            [
                'course_id' => $courses['IF3102']->id,
                'type' => 'UTS',
                'date' => Carbon::now()->addWeeks(3)->addDay()->toDateString(),
                'time' => '10:30 - 12:30',
                'location' => 'Gedung B 204',
                'topics' => 'Process Scheduling, Paging, Synchronization, Deadlock',
            ],
        ];
        foreach ($exams as $ex) {
            Exam::firstOrCreate(
                ['course_id' => $ex['course_id'], 'type' => $ex['type']],
                $ex
            );
        }

        // 8. Tugas Kuliah (Assignments)
        $assignments = [
            [
                'course_id' => $courses['IF3101']->id,
                'title' => 'Implementasi Red-Black Tree & AVL Tree',
                'description' => 'Buat implementasi rotasi kiri dan kanan serta uji operasi insert & delete.',
                'deadline' => Carbon::now()->addDays(4)->setHour(23)->setMinute(59),
                'priority' => 'high',
                'progress' => 0,
                'is_completed' => false,
            ],
            [
                'course_id' => $courses['IF3102']->id,
                'title' => 'Simulasi CPU Scheduling Algorithm (Round Robin)',
                'description' => 'Program simulasi kalkulasi turnaround time dan waiting time.',
                'deadline' => Carbon::now()->addDays(7)->setHour(23)->setMinute(59),
                'priority' => 'medium',
                'progress' => 40,
                'is_completed' => false,
            ],
            [
                'course_id' => $courses['IF3103']->id,
                'title' => 'Normalisasi Skema Toko Online 3NF',
                'description' => 'Susun relasi tabel dan hapus dependensi transitif.',
                'deadline' => Carbon::now()->subDays(2)->setHour(23)->setMinute(59),
                'priority' => 'medium',
                'progress' => 100,
                'is_completed' => true,
            ],
        ];
        foreach ($assignments as $a) {
            Assignment::firstOrCreate(
                ['course_id' => $a['course_id'], 'title' => $a['title']],
                $a
            );
        }

        // 9. Produktivitas: Tasks & Subtasks
        $tasks = [
            [
                'user_id' => $user->id,
                'course_id' => $courses['IF3101']->id,
                'title' => 'Selesaikan Review Notasi Big-O',
                'description' => 'Kuasai konsep kompleksitas waktu dan ruang sebelum kuis minggu depan.',
                'priority' => 'high',
                'deadline' => Carbon::now()->addDays(2),
                'label' => 'Belajar',
                'progress' => 100,
                'is_completed' => true,
                'completed_at' => Carbon::now()->subHours(2),
            ],
            [
                'user_id' => $user->id,
                'course_id' => $courses['IF3102']->id,
                'title' => 'Praktikum Modul 3: Paging & Virtual Memory',
                'description' => 'Kerjakan modul praktikum dan analisis page replacement policy (LRU vs FIFO).',
                'priority' => 'urgent',
                'deadline' => Carbon::now()->addDays(3),
                'label' => 'Tugas',
                'progress' => 60,
                'is_completed' => false,
            ],
            [
                'user_id' => $user->id,
                'course_id' => $courses['IF3103']->id,
                'title' => 'Diskusi Kelompok: Perancangan Skema Toko Online',
                'description' => 'Finalisasi normalisasi bentuk 3NF dan BCNF pada ERD proyek.',
                'priority' => 'medium',
                'deadline' => Carbon::now()->addDays(5),
                'label' => 'Proyek',
                'progress' => 25,
                'is_completed' => false,
            ],
        ];

        foreach ($tasks as $t) {
            $taskModel = Task::firstOrCreate(
                ['user_id' => $user->id, 'title' => $t['title']],
                $t
            );

            // Tambahkan subtask
            if ($taskModel->title === 'Praktikum Modul 3: Paging & Virtual Memory') {
                TaskSubtask::firstOrCreate(
                    ['task_id' => $taskModel->id, 'title' => 'Baca panduan praktikum Bab 3'],
                    ['is_done' => true, 'order' => 1]
                );
                TaskSubtask::firstOrCreate(
                    ['task_id' => $taskModel->id, 'title' => 'Implementasi algoritma FIFO Page Replacement'],
                    ['is_done' => true, 'order' => 2]
                );
                TaskSubtask::firstOrCreate(
                    ['task_id' => $taskModel->id, 'title' => 'Implementasi algoritma LRU Page Replacement'],
                    ['is_done' => false, 'order' => 3]
                );
            }
        }

        // 10. Produktivitas: Goals & Study Sessions
        $goals = [
            [
                'user_id' => $user->id,
                'title' => 'IPK Semester Target 3.85',
                'description' => 'Mempertahankan konsistensi nilai A pada semua mata kuliah semester ini.',
                'type' => 'semester',
                'target_value' => 3.85,
                'current_value' => 3.78,
                'unit' => 'IPK',
                'start_date' => Carbon::now()->subMonths(1)->toDateString(),
                'end_date' => Carbon::now()->addMonths(4)->toDateString(),
                'is_completed' => false,
            ],
            [
                'user_id' => $user->id,
                'title' => 'Belajar Fokus 20 Jam Minggu Ini',
                'description' => 'Menggunakan timer Pomodoro minimal 4 sesi sehari.',
                'type' => 'weekly',
                'target_value' => 20.00,
                'current_value' => 14.50,
                'unit' => 'Jam',
                'start_date' => Carbon::now()->startOfWeek()->toDateString(),
                'end_date' => Carbon::now()->endOfWeek()->toDateString(),
                'is_completed' => false,
            ],
        ];
        foreach ($goals as $g) {
            Goal::firstOrCreate(
                ['user_id' => $user->id, 'title' => $g['title']],
                $g
            );
        }

        $sessions = [
            ['user_id' => $user->id, 'course_id' => $courses['IF3101']->id, 'type' => 'pomodoro', 'duration_minutes' => 50, 'notes' => 'Review Big-O dan rekursi', 'is_completed' => true],
            ['user_id' => $user->id, 'course_id' => $courses['IF3102']->id, 'type' => 'pomodoro', 'duration_minutes' => 25, 'notes' => 'Simulasi CPU Scheduling', 'is_completed' => true],
            ['user_id' => $user->id, 'course_id' => $courses['IF3103']->id, 'type' => 'stopwatch', 'duration_minutes' => 45, 'notes' => 'Desain ERD Toko Online', 'is_completed' => true],
        ];
        foreach ($sessions as $ses) {
            StudySession::firstOrCreate(
                ['user_id' => $user->id, 'notes' => $ses['notes']],
                array_merge($ses, [
                    'started_at' => Carbon::now()->subHours(5),
                    'ended_at' => Carbon::now()->subHours(4),
                ])
            );
        }

        // ==========================================
        // 11. PHASE 5: MATERI KULIAH (Materials)
        // ==========================================
        $materials = [
            [
                'course_id' => $courses['IF3101']->id,
                'title' => 'Slide 01 - Pengantar Algoritma & Kompleksitas',
                'type' => 'slide',
                'url' => 'https://unidemic.id/materi/slide-01-algoritma.pdf',
                'description' => 'Pengenalan notasi Asimptotik Big-O, Omega, Theta, serta analisis rekursi.',
            ],
            [
                'course_id' => $courses['IF3101']->id,
                'title' => 'Diktat Bab 2 - Analisis Efisiensi Algoritma Sorting',
                'type' => 'pdf',
                'url' => 'https://unidemic.id/materi/diktat-sorting.pdf',
                'description' => 'Perbandingan mendalam kompleksitas waktu Bubble, Merge, Quick, dan Heap Sort.',
            ],
            [
                'course_id' => $courses['IF3101']->id,
                'title' => 'Panduan Tugas Proyek Graf & Minimum Spanning Tree',
                'type' => 'doc',
                'url' => 'https://unidemic.id/materi/tugas-graf.docx',
                'description' => 'Spesifikasi tugas besar implementasi algoritma Kruskal dan Prim dalam bahasa Python.',
            ],
            [
                'course_id' => $courses['IF3101']->id,
                'title' => 'Dokumentasi Resmi Python Data Structures & Collections',
                'type' => 'link',
                'url' => 'https://docs.python.org/3/tutorial/datastructures.html',
                'description' => 'Dokumentasi resmi modul Python untuk Stack, Queue, Set, dan Deque.',
            ],
            [
                'course_id' => $courses['IF3102']->id,
                'title' => 'Slide 04 - Arsitektur Memori & Manajemen Proses OS',
                'type' => 'slide',
                'url' => 'https://unidemic.id/materi/slide-04-os.pdf',
                'description' => 'Konsep Paging, Segmentasi, Page Replacement (FIFO, LRU), dan Thrashing.',
            ],
        ];

        foreach ($materials as $m) {
            Material::firstOrCreate(
                ['course_id' => $m['course_id'], 'title' => $m['title']],
                $m
            );
        }

        // ==========================================
        // 12. PHASE 5: CATATAN TERHUBUNG (Notes)
        // ==========================================
        $note1 = Note::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Konsep Notasi Big-O dan Kompleksitas Waktu'],
            [
                'course_id' => $courses['IF3101']->id,
                'content' => "# Pengantar Notasi Big-O\n\nNotasi Big-O digunakan untuk mengukur efisiensi algoritma seiring bertambahnya ukuran input \$N.\n\n## Klasifikasi Kompleksitas Waktu:\n- **O(1)** : Waktu konstan (Akses array by index)\n- **O(log N)** : Waktu logaritmik (Binary Search)\n- **O(N)** : Waktu linier (Linear Search)\n- **O(N log N)** : Waktu linier-logaritmik (Merge Sort & Heap Sort)\n- **O(N^2)** : Waktu kuadratik (Bubble & Insertion Sort)\n\n> **Prinsip Utama:** Selalu usahakan mengoptimalkan algoritma dari kuadratik \$O(N^2)\$ menjadi \$O(N \\log N)\$ bila menangani dataset ribuan hingga jutaan data!",
                'tags' => ['algoritma', 'big-o', 'kompleksitas'],
                'is_pinned' => true,
                'color' => '#6B7FD7',
            ]
        );

        $note2 = Note::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Algoritma Sorting: Divide and Conquer vs Iteratif'],
            [
                'course_id' => $courses['IF3101']->id,
                'content' => "# Analisis Algoritma Pengurutan (Sorting)\n\n## 1. Merge Sort\n- Menggunakan paradigma **Divide and Conquer**.\n- Membagi array menjadi 2 subarray, mengurutkan secara rekursif, lalu menggabungkannya.\n- Kompleksitas Waktu: Selalu **O(N log N)** pada *best*, *average*, maupun *worst case*.\n- Space Complexity: \$O(N)\$ (membutuhkan memori tambahan).\n\n## 2. Quick Sort\n- Memilih elemen *pivot* dan mempartisi array di sekitar pivot.\n- Average case: \$O(N \\log N)\$, tetapi *worst case* dapat terdegradasi menjadi \$O(N^2)\$ bila pivot yang dipilih buruk.",
                'tags' => ['sorting', 'merge-sort', 'quick-sort'],
                'is_pinned' => false,
                'color' => '#4ECDC4',
            ]
        );

        $note3 = Note::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Struktur Data Hirarkis: Binary Search Tree (BST)'],
            [
                'course_id' => $courses['IF3101']->id,
                'content' => "# Binary Search Tree (BST)\n\nSetiap simpul (node) pada BST memiliki maksimal dua anak (*left* dan *right*):\n- Subtree kiri selalu memiliki nilai **lebih kecil** dari root.\n- Subtree kanan selalu memiliki nilai **lebih besar** dari root.\n\n## Efisiensi Operasi Search:\n- Pohon Seimbang (Balanced BST): **O(log N)**\n- Pohon Condong (Degenerate BST): **O(N)** mirip linked list.\n\n> Gunakan Red-Black Tree atau AVL Tree untuk menjamin pohon selalu seimbang!",
                'tags' => ['tree', 'bst', 'struktur-data'],
                'is_pinned' => false,
                'color' => '#F7B731',
            ]
        );

        // Tautkan relasi timbal balik (Note Links)
        DB::table('note_links')->insertOrIgnore([
            ['note_id' => $note2->id, 'linked_note_id' => $note1->id],
            ['note_id' => $note3->id, 'linked_note_id' => $note1->id],
        ]);

        // ==========================================
        // 13. PHASE 5: FLASHCARD (SuperMemo SM-2)
        // ==========================================
        $deck1 = FlashcardDeck::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Struktur Data & Kompleksitas Big-O'],
            [
                'course_id' => $courses['IF3101']->id,
                'description' => 'Latihan hafalan konsep array, stack, queue, dan notasi Big-O.',
            ]
        );

        $cardsDeck1 = [
            [
                'question' => 'Berapa time complexity dari Binary Search pada sorted array?',
                'answer' => 'O(log N) pada array yang telah terurut.',
            ],
            [
                'question' => 'Apa prinsip kerja utama struktur data Stack?',
                'answer' => 'LIFO (Last In First Out) — elemen yang terakhir masuk adalah yang pertama keluar.',
            ],
            [
                'question' => 'Operasi push dan pop pada Stack memiliki time complexity berapa?',
                'answer' => 'O(1) konstan, karena hanya memanipulasi elemen teratas (top).',
            ],
            [
                'question' => 'Struktur data apa yang beroperasi dengan prinsip FIFO (First In First Out)?',
                'answer' => 'Queue (Antrean) — elemen yang pertama kali dimasukkan akan diproses pertama kali.',
            ],
            [
                'question' => 'Kapan QuickSort mengalami worst-case time complexity O(N^2)?',
                'answer' => 'Saat pemilihan pivot selalu menghasilkan partisi yang paling timpang (misal selalu memilih elemen terkecil atau terbesar pada array yang sudah terurut).',
            ],
        ];

        foreach ($cardsDeck1 as $cd) {
            Flashcard::firstOrCreate(
                ['deck_id' => $deck1->id, 'question' => $cd['question']],
                array_merge($cd, [
                    'ease_factor' => 2.50,
                    'interval' => 0,
                    'repetitions' => 0,
                    'next_review_at' => Carbon::now(), // Langsung due untuk direview
                ])
            );
        }

        $deck2 = FlashcardDeck::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Konsep Dasar Sistem Operasi'],
            [
                'course_id' => $courses['IF3102']->id,
                'description' => 'Review konsep deadlock, synchronization, dan virtual memory.',
            ]
        );

        $cardsDeck2 = [
            [
                'question' => 'Apa yang dimaksud dengan kondisi Deadlock?',
                'answer' => 'Kondisi di mana dua atau lebih proses saling menunggu resource yang sedang dipegang oleh proses lain tanpa pernah melepaskannya.',
            ],
            [
                'question' => 'Sebutkan 4 syarat mutlak (Coffman conditions) terjadinya Deadlock!',
                'answer' => "1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait",
            ],
            [
                'question' => 'Apa perbedaan mendasar antara Process dan Thread?',
                'answer' => 'Process memiliki address space terisolasi dan mandiri, sedangkan Thread berbagi address space dalam satu process yang sama (ringan / lightweight).',
            ],
        ];

        foreach ($cardsDeck2 as $cd) {
            Flashcard::firstOrCreate(
                ['deck_id' => $deck2->id, 'question' => $cd['question']],
                array_merge($cd, [
                    'ease_factor' => 2.50,
                    'interval' => 0,
                    'repetitions' => 0,
                    'next_review_at' => Carbon::now(),
                ])
            );
        }

        // ==========================================
        // 14. PHASE 5: KUIS LATIHAN INTERAKTIF (Quizzes)
        // ==========================================
        $quiz1 = Quiz::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Simulasi Kuis 1: Analisis Kompleksitas & Algoritma'],
            [
                'course_id' => $courses['IF3101']->id,
                'description' => 'Uji pemahaman dasar kompleksitas waktu, notasi Big-O, dan struktur data.',
                'time_limit_minutes' => 15,
            ]
        );

        $questionsQuiz1 = [
            [
                'type' => 'multiple_choice',
                'question' => 'Manakah algoritma sorting berikut yang memiliki average time complexity O(N log N)?',
                'options' => ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'],
                'correct_answer' => 'C',
                'explanation' => 'Merge Sort membagi array menjadi dua bagian dan menggabungkannya kembali dalam O(N log N) di semua kasus.',
                'order' => 1,
            ],
            [
                'type' => 'true_false',
                'question' => 'Operasi pengaksesan elemen array berdasarkan indeks membutuhkan waktu O(1).',
                'options' => ['Benar', 'Salah'],
                'correct_answer' => 'Benar',
                'explanation' => 'Array menyimpan data pada blok memori berurutan (contiguous memory), sehingga kalkulasi offset memori berlangsung seketika O(1).',
                'order' => 2,
            ],
            [
                'type' => 'short_answer',
                'question' => 'Struktur data linier yang menyisipkan dan menghapus elemen dari satu ujung saja disebut apa?',
                'options' => null,
                'correct_answer' => 'Stack',
                'explanation' => 'Stack (tumpukan) hanya mengizinkan manipulasi elemen di satu ujung yang disebut top of stack (prinsip LIFO).',
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Algoritma mana yang paling efisien mencari lintasan terpendek (shortest path) dari satu titik asal pada graf dengan bobot non-negatif?',
                'options' => ['Dijkstra', 'Kruskal', 'Prim', 'Floyd-Warshall'],
                'correct_answer' => 'A',
                'explanation' => 'Algoritma Dijkstra efisien mencari lintasan terpendek single-source pada graf berbobot non-negatif.',
                'order' => 4,
            ],
        ];

        foreach ($questionsQuiz1 as $q) {
            QuizQuestion::firstOrCreate(
                ['quiz_id' => $quiz1->id, 'question' => $q['question']],
                $q
            );
        }

        // Seed sample attempt agar nilai kuis terbaik muncul di kartu
        QuizAttempt::firstOrCreate(
            ['user_id' => $user->id, 'quiz_id' => $quiz1->id],
            [
                'score' => 100.00,
                'total_questions' => 4,
                'correct_answers' => 4,
                'answers' => [
                    ['question_id' => 1, 'user_answer' => 'C', 'is_correct' => true],
                    ['question_id' => 2, 'user_answer' => 'Benar', 'is_correct' => true],
                    ['question_id' => 3, 'user_answer' => 'Stack', 'is_correct' => true],
                    ['question_id' => 4, 'user_answer' => 'A', 'is_correct' => true],
                ],
                'completed_at' => Carbon::now()->subDay(),
            ]
        );

        $quiz2 = Quiz::firstOrCreate(
            ['user_id' => $user->id, 'title' => 'Review Kuis: Manajemen Memori & Proses OS'],
            [
                'course_id' => $courses['IF3102']->id,
                'description' => 'Review konsep memori virtual, scheduling CPU, dan sinkronisasi proses.',
                'time_limit_minutes' => 10,
            ]
        );

        $questionsQuiz2 = [
            [
                'type' => 'true_false',
                'question' => 'Virtual Memory memungkinkan komputer mengeksekusi program yang ukurannya melampaui kapasitas RAM fisik.',
                'options' => ['Benar', 'Salah'],
                'correct_answer' => 'Benar',
                'explanation' => 'OS memanfaatkan swap space di storage sekunder untuk menampung page memori yang tidak aktif di RAM.',
                'order' => 1,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Bagian sistem operasi yang bertugas memilih proses di Ready Queue untuk dialokasikan ke CPU disebut:',
                'options' => ['CPU Scheduler (Short-term Scheduler)', 'Long-term Scheduler', 'Swapper', 'Dispatcher'],
                'correct_answer' => 'A',
                'explanation' => 'Short-term scheduler beroperasi cepat memilih proses yang siap dieksekusi dan mengalokasikannya ke core CPU.',
                'order' => 2,
            ],
        ];

        foreach ($questionsQuiz2 as $q) {
            QuizQuestion::firstOrCreate(
                ['quiz_id' => $quiz2->id, 'question' => $q['question']],
                $q
            );
        }
    }
}
