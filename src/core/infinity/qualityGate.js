const validators = new Map();

export function registerQualityValidator(id, validator) {
  if (!id || typeof validator !== "function") throw new Error("Quality validator id and function are required");
  validators.set(id, validator);
  return () => validators.delete(id);
}

export async function runQualityGate(output, context = {}, requested = []) {
  const ids = requested.length ? requested : Array.from(validators.keys());
  const checks = [];
  for (const id of ids) {
    const validator = validators.get(id);
    if (!validator) { checks.push({ id, ok: false, detail: 'The requested validator is not registered.', metadata: {} }); continue; }
    try {
      const result = await validator(output, context);
      checks.push({ id, ok: result?.ok === true, detail: result?.detail || (result?.ok === true ? 'Passed' : 'Validator returned no passing evidence.'), metadata: result?.metadata || {} });
    } catch (error) {
      checks.push({ id, ok: false, detail: error?.message || "Validator failed", metadata: {} });
    }
  }
  return { ok: checks.every((check) => check.ok), checks };
}

registerQualityValidator("non-empty", (output) => ({ ok: output != null && String(typeof output === "string" ? output : JSON.stringify(output)).trim().length > 0, detail: "Output must not be empty." }));
registerQualityValidator("requested-constraints", (_output, context) => ({ ok: !(context?.missingConstraints?.length), detail: context?.missingConstraints?.length ? `Missing: ${context.missingConstraints.join(", ")}` : "Requested constraints accounted for." }));
