export function validateGeneratedForgeResponse(data) {
  const artifact = data?.artifact;
  if (!artifact || typeof artifact !== 'object' || data.validation?.valid !== true || typeof data.projectId !== 'string' || !data.projectId) throw new Error('Forge did not return a validated, saved artifact.');
  if (!Array.isArray(artifact.files) || !artifact.files.length || artifact.files.length > 250 || !artifact.files.some(file => typeof file?.content === 'string' && file.content.trim())) throw new Error('Forge returned no usable artifact files.');
  const paths = new Set();
  let total = 0;
  for (const file of artifact.files) {
    if (!file || typeof file.path !== 'string' || !file.path || file.path.length > 180 || file.path.startsWith('/') || file.path.includes('\\') || file.path.split('/').some(part => !part || part === '.' || part === '..') || /^[a-z]:/i.test(file.path) || paths.has(file.path)) throw new Error('Forge returned an invalid or duplicate file path.');
    if (typeof file.content !== 'string' || file.content.length > 2000000) throw new Error('Forge returned an invalid or oversized artifact file.');
    paths.add(file.path); total += file.content.length;
  }
  if (total > 6000000) throw new Error('Forge returned an oversized artifact.');
  return data;
}
