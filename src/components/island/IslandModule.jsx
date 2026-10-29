/**
 * IslandModule — renders a registered island module by type.
 * Looks up the module component from the registry and passes props.
 */

import { ISLAND_MODULES } from './islandModules.jsx';

/**
 * Renders a module by its type string.
 * @param {Object} props
 * @param {string} props.type - Module type (e.g., 'approval', 'mission-progress')
 * @param {Object} props.activity - The primary activity
 * @param {Array} props.allActivities - All activities for context modules
 * @param {Function} props.onAction - Action callback for interactive modules
 */
export function IslandModule({ type, activity, allActivities, onAction }) {
  const ModuleComponent = ISLAND_MODULES[type];

  if (!ModuleComponent) {
    // Unknown module type - render a fallback
    return (
      <div className="island-module island-module-unknown" data-module={type}>
        <div className="island-module-header">
          <span className="island-module-title">Unknown Module: {type}</span>
        </div>
        <div className="island-module-body">
          <p className="island-module-message">
            No renderer registered for module type "{type}".
          </p>
        </div>
      </div>
    );
  }

  return (
    <ModuleComponent
      activity={activity}
      allActivities={allActivities}
      onAction={onAction}
    />
  );
}

/**
 * Renders multiple modules in priority order.
 * @param {Object} props
 * @param {Array<string>} props.moduleTypes - Array of module type strings
 * @param {Object} props.activity - The primary activity
 * @param {Array} props.allActivities - All activities for context
 * @param {Function} props.onAction - Action callback
 */
export function IslandModuleStack({ moduleTypes, activity, allActivities, onAction }) {
  if (!moduleTypes || moduleTypes.length === 0) {
    return null;
  }

  return (
    <div className="island-module-stack">
      {moduleTypes.map((type, index) => (
        <div key={type} className="island-module-wrapper">
          <IslandModule
            type={type}
            activity={activity}
            allActivities={allActivities}
            onAction={onAction}
          />
        </div>
      ))}
    </div>
  );
}

export default IslandModule;