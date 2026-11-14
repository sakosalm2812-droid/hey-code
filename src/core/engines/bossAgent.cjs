// Boss Agent — Code grade and critique engine
// Provides graded feedback on engine outputs, suggesting improvements

let gradeHistory = [];

export function grade(output, context = {}) {
  const critique = {
    id: `grade-${Date.now()}`,
    output,
    context,
    timestamp: new Date().toISOString(),
    score: 0,
    suggestions: [],
    status: 'acceptable'
  };

  // Basic grading logic
  if (!output) {
    critique.score = 0;
    critique.suggestions = ['No output provided'];
    critique.status = 'failed';
  } else if (typeof output === 'string' && output.length > 1000) {
    critique.score = 8;
    critique.suggestions = ['Output is verbose, consider trimming'];
  } else {
    critique.score = 5;
    critique.suggestions = ['Review for clarity and conciseness'];
  }

  gradeHistory.push(critique);
  if (gradeHistory.length > 100) gradeHistory.shift();

  return critique;
}

export function review(codeSnippet, language = 'typescript') {
  const review = {
    id: `review-${Date.now()}`,
    code: codeSnippet,
    language,
    timestamp: new Date().toISOString(),
    score: 5,
    issues: [],
    recommendations: []
  };

  // Basic static checks
  if (codeSnippet.includes('any')) {
    review.issues.push('Avoid `any` type — use specific types');
    review.recommendations.push('Define proper types');
  }
  if (codeSnippet.match(/console\.log\(/g)?.length > 3) {
    review.issues.push('Excessive console.log statements');
    review.recommendations.push('Use proper debugging tools');
  }

  review.score = Math.max(1, Math.min(10, review.score - review.issues.length * 1));
  return review;
}

export function assessQuality(engineName, output) {
  return grade(output, { engine: engineName });
}