
    import { verify } from 'file:///C:/Users/DELL/Documents/hey/src/core/actionVerificationEngine.js';
    const verdict = verify({
      action_id: 'act-subproc',
      expected: 42,
      actual: 42,
      criteria: [{ type: 'equals' }]
    });
    process.send({ verdict });
  