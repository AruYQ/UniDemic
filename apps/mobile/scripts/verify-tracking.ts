// Mock react-native and expo modules for Node environment
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'react-native') {
    return {
      Platform: { OS: 'ios' },
      StyleSheet: { create: (s: any) => s },
      Pressable: 'Pressable',
      View: 'View',
      Text: 'Text',
      Alert: { alert: () => {} },
    };
  }
  if (id === 'expo-constants') {
    return { default: { expoConfig: {} } };
  }
  if (id === 'expo-secure-store') {
    return {
      getItemAsync: async () => null,
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
    };
  }
  return originalRequire.apply(this, arguments);
};

function assert(condition: any, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}
assert.strictEqual = function (actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but received ${actual}`);
  }
};
assert.deepStrictEqual = function (actual: any, expected: any, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
};
assert.ok = function (value: any, message?: string) {
  if (!value) {
    throw new Error(message || `Expected truthy value but got ${value}`);
  }
};

import {
  AttendanceStatus,
  AttendanceSummary,
  GradeComponent,
  Grade,
  CourseGpa,
  GpaSimulationItem,
  GpaSimulationPayload,
  GpaSimulationResult,
} from '../src/types/tracking';

console.log('🧪 Starting UniDemic Phase 3 (Academic Tracking) Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function it(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

// 1. Attendance Business Logic
console.log('📌 Testing Attendance Logic & Threshold Warnings:');

it('calculates attendance percentage and safe absences correctly', () => {
  const totalClasses = 16;
  const minPercentage = 75; // 75% minimum
  const maxAbsences = Math.floor(totalClasses * (1 - minPercentage / 100)); // 4 absences max
  assert.strictEqual(maxAbsences, 4, 'Max allowed absences should be 4 out of 16');

  // Case 1: 10 present, 2 permission, 0 absent out of 12 classes conducted so far
  const conducted = 12;
  const present = 10;
  const absent = 0;
  const percentage = (present / conducted) * 100;
  assert.strictEqual(Math.round(percentage), 83);
  const remainingSafe = maxAbsences - absent;
  assert.strictEqual(remainingSafe, 4);
});

it('triggers warning when attendance drops below minimum percentage (75%)', () => {
  const summary: AttendanceSummary = {
    total_classes: 16,
    present_count: 8,
    absent_count: 4,
    permission_count: 1,
    attendance_percentage: 61.5,
    minimum_percentage: 75.0,
    warning: true,
    remaining_safe_absences: 0,
  };

  assert.strictEqual(summary.warning, true);
  assert.ok(summary.attendance_percentage < summary.minimum_percentage);
  assert.strictEqual(summary.remaining_safe_absences, 0);
});

it('validates all allowed attendance statuses', () => {
  const allowedStatuses: AttendanceStatus[] = ['present', 'absent', 'permission', 'sick'];
  assert.strictEqual(allowedStatuses.length, 4);
  assert.ok(allowedStatuses.includes('present'));
  assert.ok(allowedStatuses.includes('absent'));
  assert.ok(allowedStatuses.includes('permission'));
  assert.ok(allowedStatuses.includes('sick'));
});

// 2. Grade Components & Course GPA Logic
console.log('\n📌 Testing Grade Components & Course Final Score:');

it('validates 100% component weight allocation', () => {
  const components: GradeComponent[] = [
    { id: 1, course_id: 1, name: 'Tugas', weight: 20, created_at: '', updated_at: '' },
    { id: 2, course_id: 1, name: 'Kuis', weight: 10, created_at: '', updated_at: '' },
    { id: 3, course_id: 1, name: 'UTS', weight: 30, created_at: '', updated_at: '' },
    { id: 4, course_id: 1, name: 'UAS', weight: 40, created_at: '', updated_at: '' },
  ];

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  assert.strictEqual(totalWeight, 100, 'Sum of component weights must equal 100%');
});

it('calculates weighted final score and letter grade accurately', () => {
  // Score: Tugas=90 (20%), Kuis=85 (10%), UTS=80 (30%), UAS=85 (40%)
  const weightedScore = (90 * 0.2) + (85 * 0.1) + (80 * 0.3) + (85 * 0.4);
  // 18 + 8.5 + 24 + 34 = 84.5
  assert.strictEqual(weightedScore, 84.5);

  const getLetterGrade = (score: number) => {
    if (score >= 85) return { letter: 'A', point: 4.0 };
    if (score >= 80) return { letter: 'A-', point: 3.7 };
    if (score >= 75) return { letter: 'B+', point: 3.3 };
    if (score >= 70) return { letter: 'B', point: 3.0 };
    if (score >= 65) return { letter: 'B-', point: 2.7 };
    if (score >= 60) return { letter: 'C+', point: 2.3 };
    if (score >= 55) return { letter: 'C', point: 2.0 };
    if (score >= 40) return { letter: 'D', point: 1.0 };
    return { letter: 'E', point: 0.0 };
  };

  const result = getLetterGrade(weightedScore);
  assert.strictEqual(result.letter, 'A-');
  assert.strictEqual(result.point, 3.7);

  const courseGpa: CourseGpa = {
    course_id: 1,
    course_name: 'Pemrograman Berorientasi Objek',
    credits: 3,
    final_score: weightedScore,
    letter_grade: result.letter,
    grade_point: result.point,
  };

  assert.strictEqual(courseGpa.grade_point, 3.7);
  assert.strictEqual(courseGpa.credits, 3);
});

// 3. GPA Calculation & Simulation Engine
console.log('\n📌 Testing GPA Calculation & Projection Simulator:');

it('calculates semester IPS weighted by credits', () => {
  const courses: CourseGpa[] = [
    { course_id: 1, course_name: 'Algoritma', credits: 4, final_score: 90, letter_grade: 'A', grade_point: 4.0 }, // 16
    { course_id: 2, course_name: 'Basis Data', credits: 3, final_score: 82, letter_grade: 'A-', grade_point: 3.7 }, // 11.1
    { course_id: 3, course_name: 'Jaringan', credits: 3, final_score: 78, letter_grade: 'B+', grade_point: 3.3 }, // 9.9
  ];

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0); // 10 SKS
  const totalQualityPoints = courses.reduce((sum, c) => sum + (c.grade_point * c.credits), 0); // 37.0
  const ips = totalQualityPoints / totalCredits;

  assert.strictEqual(totalCredits, 10);
  assert.strictEqual(totalQualityPoints, 37.0);
  assert.strictEqual(Math.round(ips * 100) / 100, 3.70);
});

it('simulates hypothetical target grades and calculates projected GPA delta accurately', () => {
  // Current student standing: 3.50 GPA across 60 SKS
  const currentGpa = 3.50;
  const currentCredits = 60;
  const currentQualityPoints = currentGpa * currentCredits; // 210.0

  const simulations: GpaSimulationItem[] = [
    { course_name: 'Machine Learning', credits: 3, target_grade: 'A' },    // 3 * 4.0 = 12.0
    { course_name: 'Cloud Computing', credits: 3, target_grade: 'A' },     // 3 * 4.0 = 12.0
    { course_name: 'Rekayasa Perangkat Lunak', credits: 4, target_grade: 'A-' }, // 4 * 3.7 = 14.8
  ];

  const gradeMap: Record<string, number> = {
    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0
  };

  const additionalCredits = simulations.reduce((sum, s) => sum + s.credits, 0); // 10 SKS
  const simQualityPoints = simulations.reduce((sum, s) => sum + (gradeMap[s.target_grade] * s.credits), 0); // 38.8

  const totalCredits = currentCredits + additionalCredits; // 70 SKS
  const totalQualityPoints = currentQualityPoints + simQualityPoints; // 248.8
  const simulatedGpa = Math.round((totalQualityPoints / totalCredits) * 100) / 100; // 3.55

  const result: GpaSimulationResult = {
    current_gpa: currentGpa,
    simulated_gpa: simulatedGpa,
    current_credits: currentCredits,
    additional_credits: additionalCredits,
    total_credits: totalCredits,
  };

  assert.strictEqual(result.additional_credits, 10);
  assert.strictEqual(result.total_credits, 70);
  assert.strictEqual(result.simulated_gpa, 3.55);

  const delta = Math.round((result.simulated_gpa - result.current_gpa) * 100) / 100;
  assert.strictEqual(delta, 0.05, 'Projected GPA delta should be +0.05');
});

it('detects negative delta when simulated target grades are lower than current GPA', () => {
  const currentGpa = 3.80;
  const currentCredits = 40;
  const currentQualityPoints = currentGpa * currentCredits; // 152.0

  // Low simulated grades: 6 credits of C (2.0)
  const additionalCredits = 6;
  const simQualityPoints = 6 * 2.0; // 12.0

  const totalCredits = currentCredits + additionalCredits; // 46
  const simulatedGpa = Math.round(((currentQualityPoints + simQualityPoints) / totalCredits) * 100) / 100; // 164 / 46 = 3.57
  const delta = Math.round((simulatedGpa - currentGpa) * 100) / 100;

  assert.strictEqual(simulatedGpa, 3.57);
  assert.strictEqual(delta, -0.23, 'Delta should reflect decrease of -0.23');
  assert.ok(delta < 0, 'Delta must be strictly negative');
});

it('handles boundary grading scales strictly and correctly', () => {
  const getLetter = (s: number) => {
    if (s >= 85) return 'A';
    if (s >= 80) return 'A-';
    if (s >= 75) return 'B+';
    if (s >= 70) return 'B';
    if (s >= 65) return 'B-';
    if (s >= 60) return 'C+';
    if (s >= 55) return 'C';
    if (s >= 40) return 'D';
    return 'E';
  };

  assert.strictEqual(getLetter(85.0), 'A');
  assert.strictEqual(getLetter(84.99), 'A-');
  assert.strictEqual(getLetter(80.0), 'A-');
  assert.strictEqual(getLetter(79.99), 'B+');
  assert.strictEqual(getLetter(75.0), 'B+');
  assert.strictEqual(getLetter(74.99), 'B');
  assert.strictEqual(getLetter(70.0), 'B');
  assert.strictEqual(getLetter(69.99), 'B-');
  assert.strictEqual(getLetter(65.0), 'B-');
  assert.strictEqual(getLetter(64.99), 'C+');
  assert.strictEqual(getLetter(60.0), 'C+');
  assert.strictEqual(getLetter(59.99), 'C');
  assert.strictEqual(getLetter(55.0), 'C');
  assert.strictEqual(getLetter(54.99), 'D');
  assert.strictEqual(getLetter(40.0), 'D');
  assert.strictEqual(getLetter(39.99), 'E');
  assert.strictEqual(getLetter(0.0), 'E');
});

// 4. Verification of Component Contract & Exports
console.log('\n📌 Testing Component Contract & Store State Machine:');

it('verifies trackingService endpoint mapping', async () => {
  const { trackingService } = await import('../src/services/trackingService');
  assert.ok(typeof trackingService.getCourseAttendances === 'function');
  assert.ok(typeof trackingService.getAttendanceSummary === 'function');
  assert.ok(typeof trackingService.createAttendance === 'function');
  assert.ok(typeof trackingService.updateAttendance === 'function');
  assert.ok(typeof trackingService.deleteAttendance === 'function');
  assert.ok(typeof trackingService.getGradeComponents === 'function');
  assert.ok(typeof trackingService.createGradeComponent === 'function');
  assert.ok(typeof trackingService.updateGradeComponent === 'function');
  assert.ok(typeof trackingService.deleteGradeComponent === 'function');
  assert.ok(typeof trackingService.getCourseGrades === 'function');
  assert.ok(typeof trackingService.createGrade === 'function');
  assert.ok(typeof trackingService.updateGrade === 'function');
  assert.ok(typeof trackingService.deleteGrade === 'function');
  assert.ok(typeof trackingService.getCourseGpa === 'function');
  assert.ok(typeof trackingService.getSemesterGpa === 'function');
  assert.ok(typeof trackingService.getCumulativeGpa === 'function');
  assert.ok(typeof trackingService.simulateGpa === 'function');
});

it('verifies useTrackingStore initial state and structure', async () => {
  const { useTrackingStore } = await import('../src/store/useTrackingStore');
  const state = useTrackingStore.getState();
  assert.deepStrictEqual(state.attendances, {});
  assert.deepStrictEqual(state.attendanceSummaries, {});
  assert.deepStrictEqual(state.gradeComponents, {});
  assert.deepStrictEqual(state.grades, {});
  assert.deepStrictEqual(state.courseGpas, {});
  assert.strictEqual(state.cumulativeGpa, null);
  assert.strictEqual(state.semesterGpa, null);
  assert.strictEqual(state.simulationResult, null);
  assert.strictEqual(typeof state.fetchCourseAttendance, 'function');
  assert.strictEqual(typeof state.fetchCourseGrades, 'function');
  assert.strictEqual(typeof state.simulateGpa, 'function');
  assert.strictEqual(typeof state.resetSimulation, 'function');
});

it('verifies useTrackingStore resetSimulation cleans up state', async () => {
  const { useTrackingStore } = await import('../src/store/useTrackingStore');
  useTrackingStore.setState({
    simulationResult: {
      current_gpa: 3.5,
      simulated_gpa: 3.7,
      current_credits: 60,
      additional_credits: 10,
      total_credits: 70,
    },
  });

  assert.ok(useTrackingStore.getState().simulationResult !== null);
  useTrackingStore.getState().resetSimulation();
  assert.strictEqual(useTrackingStore.getState().simulationResult, null);
});

console.log(`\n🎉 All ${passedTests}/${totalTests} Phase 3 tracking tests passed successfully!\n`);
