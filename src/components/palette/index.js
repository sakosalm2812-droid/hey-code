export { PaletteProvider, usePalette } from './PaletteProvider.jsx';
export { Palette } from './Palette.jsx';
export { buildCommandIndex, resolveCommandRow, getCapabilityAvailabilityForRow } from './commandIndex.js';
export { rankRows, scoreRow, subsequenceScore } from './scoring.js';
export { getRowAvailability, getRowsAvailability, filterEnabledRows, partitionRowsByAvailability } from './availability.js';

export default {
  PaletteProvider,
  usePalette,
  Palette,
  buildCommandIndex,
  resolveCommandRow,
  getCapabilityAvailabilityForRow,
  rankRows,
  scoreRow,
  subsequenceScore,
  getRowAvailability,
  getRowsAvailability,
  filterEnabledRows,
  partitionRowsByAvailability,
};