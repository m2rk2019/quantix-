export { ENGINEERING_MODULES, REQUIRED_DISCIPLINES, getModuleLabel } from '@/lib/ai-estimator/knowledge/modules';
export { ENGINEERING_WBS_TEMPLATES } from '@/lib/ai-estimator/knowledge/wbs-templates';
export {
  ENGINEERING_BOQ_CATALOG,
  getBoqCatalogForWbs,
  resolveBoqCatalogEntry,
} from '@/lib/ai-estimator/knowledge/boq-catalog';
export {
  MATERIAL_CONSUMPTION,
  LABOR_PRODUCTIVITY,
  EQUIPMENT_PRODUCTIVITY,
  getMaterialConsumption,
  getLaborProductivity,
  getEquipmentProductivity,
} from '@/lib/ai-estimator/knowledge/productivity';
export { TYPICAL_CREW_COMPOSITION, getCrewForWorkType } from '@/lib/ai-estimator/knowledge/crews';
export { STANDARD_CONSTRUCTION_SEQUENCE } from '@/lib/ai-estimator/knowledge/sequences';
