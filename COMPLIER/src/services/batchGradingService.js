// ============================================================================
// Elite IDE - Real Automated Batch Grading Engine
// Real live compiler execution against test suites, edge cases, and plagiarism check
// for college lab practicals and university coding exams.
// ============================================================================

import { supabase } from '../supabase';

export const DEFAULT_SAMPLE_TEST_SUITE = [
  { id: 1, name: 'Standard Case 1', input: '5\n1 2 3 4 5', expected: '15', weight: 20 },
  { id: 2, name: 'Negative Values', input: '3\n-10 20 -5', expected: '5', weight: 20 },
  { id: 3, name: 'Boundary Zero', input: '4\n0 0 0 0', expected: '0', weight: 20 },
  { id: 4, name: 'Single Element', input: '1\n42', expected: '42', weight: 20 },
  { id: 5, name: 'Large Numbers (Stress)', input: '3\n1000000 2000000 3000000', expected: '6000000', weight: 20 }
];

export const INITIAL_STUDENT_COHORT = [
  { rollNo: '24CS001', name: 'Aarav Sharma', language: 'python', submissionCode: 'import sys\ndata = sys.stdin.read().split()\nif data:\n    nums = [int(x) for x in data[1:]]\n    print(sum(nums))' },
  { rollNo: '24CS002', name: 'Bhavna Reddy', language: 'python', submissionCode: 'import sys\ndata = sys.stdin.read().split()\nif data:\n    n = int(data[0])\n    ans = sum(int(x) for x in data[1:n+1])\n    print(ans)' },
  { rollNo: '24CS003', name: 'Chaitanya Kumar', language: 'python', submissionCode: '# Buggy submission\nprint(0)' },
  { rollNo: '24CS004', name: 'Divya Patel', language: 'python', submissionCode: 'import sys\nvals = [int(x) for x in sys.stdin.read().split()[1:]]\ns = 0\nfor v in vals:\n    s += v\nprint(s)' },
  { rollNo: '24CS005', name: 'Farhan Ali', language: 'python', submissionCode: 'import sys\ndata = sys.stdin.read().split()\nif data:\n    nums = [int(x) for x in data[1:]]\n    print(sum(nums))' } // Similar code to 24CS001
];

/**
 * Fetch real students from Supabase live exam systems
 */
export async function fetchLiveSupabaseStudents() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('college_systems')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(40);

    if (error || !data) return [];

    const realStudents = data
      .filter(s => s.roll_number)
      .map(s => ({
        rollNo: s.roll_number,
        name: s.student_name || `Student ${s.roll_number}`,
        language: s.active_language || 'python',
        submissionCode: s.last_submitted_code || 'import sys\nprint("Exam submitted")'
      }));

    return realStudents;
  } catch (e) {
    console.warn('Supabase students fetch error:', e);
    return [];
  }
}

/**
 * Real Live Execution Batch Grading Runner
 * Executes code against every test case in real-time
 */
export async function runBatchGrading({
  testSuite = DEFAULT_SAMPLE_TEST_SUITE,
  students = INITIAL_STUDENT_COHORT,
  onProgress = () => {}
}) {
  const results = [];
  const totalWeight = testSuite.reduce((sum, t) => sum + (t.weight || 20), 0);

  for (let sIndex = 0; sIndex < students.length; sIndex++) {
    const student = students[sIndex];
    onProgress({
      current: sIndex + 1,
      total: students.length,
      currentRoll: student.rollNo,
      currentName: student.name
    });

    let passedTests = 0;
    let earnedScore = 0;
    const testDetails = [];

    for (const test of testSuite) {
      let isPass = false;
      let actualOutput = '';

      try {
        let resData = null;

        // Try /api/run
        try {
          const res = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: student.language || 'python',
              code: student.submissionCode,
              stdin: test.input || ''
            })
          });
          if (res.ok) {
            resData = await res.json();
          }
        } catch (e) {}

        // Direct Wandbox fallback if server is loaded
        if (!resData || resData.status === 'ERROR') {
          const wbRes = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              compiler: 'cpython-3.12.7',
              code: student.submissionCode,
              stdin: test.input || ''
            })
          });
          if (wbRes.ok) {
            const wb = await wbRes.json();
            resData = {
              stdout: wb.program_output || '',
              code: parseInt(wb.status || '0', 10)
            };
          }
        }

        actualOutput = (resData?.stdout || '').trim();
        const expected = (test.expected || '').trim();

        if (actualOutput === expected || (resData?.code === 0 && actualOutput.includes(expected))) {
          isPass = true;
          passedTests++;
          earnedScore += (test.weight || 20);
        }
      } catch (execErr) {
        actualOutput = `Error: ${execErr.message}`;
      }

      testDetails.push({
        testId: test.id,
        testName: test.name,
        passed: isPass,
        expected: test.expected,
        actual: actualOutput || '[No output]',
        weight: test.weight || 20
      });
    }

    const percentage = Math.round((earnedScore / totalWeight) * 100);

    // Plagiarism Detection: Check similarity with previous submissions
    let plagiarismFlag = false;
    let plagiarizedWith = null;

    const normalizedCode = student.submissionCode.replace(/\s+/g, '').replace(/#.*$/gm, '');
    for (let prevIndex = 0; prevIndex < sIndex; prevIndex++) {
      const prevStudent = students[prevIndex];
      const prevNormalized = prevStudent.submissionCode.replace(/\s+/g, '').replace(/#.*$/gm, '');
      if (normalizedCode.length > 20 && normalizedCode === prevNormalized) {
        plagiarismFlag = true;
        plagiarizedWith = prevStudent.rollNo;
        break;
      }
    }

    results.push({
      rollNo: student.rollNo,
      name: student.name,
      earnedScore,
      totalWeight,
      percentage,
      passedTests,
      totalTests: testSuite.length,
      status: percentage >= 50 ? 'PASSED' : 'FAILED',
      grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'F',
      plagiarismFlag,
      plagiarizedWith,
      testDetails
    });
  }

  return results;
}

/**
 * Export results directly to CSV
 */
export function exportGradingToCsv(results, filename = 'student_grades_report.csv') {
  if (!results || results.length === 0) return;

  const headers = ['Roll Number', 'Student Name', 'Score', 'Total Weight', 'Percentage', 'Passed Tests', 'Grade', 'Status', 'Plagiarism Flag', 'Matched With'];
  const rows = results.map(r => [
    `"${r.rollNo}"`,
    `"${r.name}"`,
    r.earnedScore,
    r.totalWeight,
    `${r.percentage}%`,
    `${r.passedTests}/${r.totalTests}`,
    r.grade,
    r.status,
    r.plagiarismFlag ? 'YES (ALERT)' : 'CLEAN',
    r.plagiarizedWith ? `"${r.plagiarizedWith}"` : 'None'
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
