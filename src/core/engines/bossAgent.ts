// Boss Agent — Code grade and critique engine
// Provides graded feedback on engine outputs, suggesting improvements

export interface GradeResult {
  id: string;
  output: unknown;
  context: { engine: string };
  timestamp: string;
  score: number;
  suggestions: string[];
  status: 'acceptable' | 'warning' | 'failed';
}

export function grade(output: unknown, context: { engine: string }): GradeResult {
  const id = `grade-${Date.now()}`;
  let score = 5;
  const suggestions: string[] = [];
  let status: 'acceptable' | 'warning' | 'failed' = 'acceptable';

  if (output === undefined || output === null) {
    score = 0;
    suggestions.push('No output provided');
    status = 'failed';
  } else if (typeof output === 'string' && output.length > 1000) {
    score = 7;
    suggestions.push('Output is verbose, consider trimming');
  } else if (typeof output === 'object' && Object.keys(output).length === 0) {
    score = 1;
    suggestions.push('Empty output object');
    status = 'failed';
  } else {
    suggestions.push('Review for clarity and conciseness');
  }

  return {
    id,
    output,
    context: { engine: context.engine },
    timestamp: new Date().toISOString(),
    score,
    suggestions,
    status,
  };
}

export function review(code: string, engine: string): GradeResult {
  return grade(code, { engine });
}