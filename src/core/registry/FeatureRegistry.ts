// Auto-discovery Feature Registry
// Scans src/features/*/manifest.ts and src/engines/*/manifest.ts and builds the feature list dynamically.

export interface FeatureManifest {
  id: string;
  name: string;
  path: string;
  icon: any;
  component: () => Promise<{ default: React.ComponentType<any> }>;
}

// Registered engine names (for verification)
export const registeredEngines: string[] = [
  'agentFamilies',
  'agentWorkforce',
  'autonomous',
  'continuousIntelligence',
  'crossDevice',
  'digup',
  'entity',
  'guidanceWorld',
  'modes',
  'modelSocket',
  'nativeMessaging',
  'neverCutOff',
  'ownerConsole',
  'performanceQuality',
  'selfImprovement',
  'safetyTrio',
  'situationalAwareness',
];

// Import all manifest files using Vite's import.meta.glob
const manifestModules = import.meta.glob('../../features/*/manifest.ts', { eager: true });
const engineManifestModules = import.meta.glob('../../engines/*/manifest.ts', { eager: true });

export const Features: FeatureManifest[] = [
  ...Object.values(manifestModules).map((mod: any) => mod.default).filter(Boolean),
  ...Object.values(engineManifestModules).map((mod: any) => mod.default).filter(Boolean),
];

// Helper to get feature by id
export function getFeature(id: string): FeatureManifest | undefined {
  return Features.find((f) => f.id === id);
}

// Helper to get feature by path
export function getFeatureByPath(path: string): FeatureManifest | undefined {
  return Features.find((f) => f.path === path);
}

export default Features;