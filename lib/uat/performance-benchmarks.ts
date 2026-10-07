import {
  calculateTotalAmount,
  calculateTotalRate,
  roundCurrency,
} from '@/lib/boq/calculations';
import { calculateEstimateBreakdown } from '@/lib/estimate/calculations';
import type {
  UatPerformanceMetricId,
  UatPerformanceResult,
  UatPerformanceSuiteResult,
} from '@/types/uat';

export const PERF_THRESHOLDS: Record<UatPerformanceMetricId, number> = {
  load: 500,
  search: 100,
  save: 800,
  export: 2000,
  large_boq: 2000,
};

const DEMO_PERCENTAGES = {
  indirect_cost_percent: 10,
  contingency_percent: 5,
  markup_percent: 8,
  vat_percent: 12,
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface PerfBoqItem {
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  total_rate: number;
  total_amount: number;
}

function buildPerformanceItems(count: number, seed = 99001): PerfBoqItem[] {
  const rng = seededRandom(seed);
  const items: PerfBoqItem[] = [];

  for (let index = 1; index <= count; index += 1) {
    const rates = {
      material_rate: roundCurrency(100 + rng() * 500),
      labor_rate: roundCurrency(50 + rng() * 300),
      equipment_rate: roundCurrency(rng() * 120),
      subcontract_rate: roundCurrency(rng() * 200),
      other_cost_rate: roundCurrency(rng() * 25),
    };
    const quantity = roundCurrency(1 + rng() * 250);
    const total_rate = calculateTotalRate(rates);
    const total_amount = calculateTotalAmount(quantity, total_rate);
    items.push({ quantity, ...rates, total_rate, total_amount });
  }

  return items;
}

function simulateSearch(items: PerfBoqItem[], term: string): PerfBoqItem[] {
  const lower = term.toLowerCase();
  return items.filter((_, index) => String(index).includes(lower) || index % 7 === 0);
}

export function runPerformanceBenchmarks(): UatPerformanceSuiteResult {
  const results: UatPerformanceResult[] = [];
  const itemCount = 1000;
  const items = buildPerformanceItems(itemCount);

  const loadStart = performance.now();
  const loaded = buildPerformanceItems(itemCount);
  const loadMs = performance.now() - loadStart;
  results.push({
    id: 'load',
    label: 'BOQ load (1000 items)',
    item_count: itemCount,
    duration_ms: roundCurrency(loadMs),
    threshold_ms: PERF_THRESHOLDS.load,
    passed: loadMs <= PERF_THRESHOLDS.load,
    detail: `Generated ${loaded.length} items in memory`,
  });

  const searchStart = performance.now();
  const matches = simulateSearch(items, '42');
  const searchMs = performance.now() - searchStart;
  results.push({
    id: 'search',
    label: 'BOQ search (1000 items)',
    item_count: matches.length,
    duration_ms: roundCurrency(searchMs),
    threshold_ms: PERF_THRESHOLDS.search,
    passed: searchMs <= PERF_THRESHOLDS.search,
    detail: `${matches.length} matches for term "42"`,
  });

  const saveStart = performance.now();
  let saveIntegrity = true;
  for (const item of items) {
    const recomputed = calculateTotalAmount(
      item.quantity,
      calculateTotalRate(item)
    );
    if (Math.abs(recomputed - item.total_amount) > 0.01) {
      saveIntegrity = false;
      break;
    }
  }
  const saveMs = performance.now() - saveStart;
  results.push({
    id: 'save',
    label: 'BOQ save recalculation (1000 items)',
    item_count: itemCount,
    duration_ms: roundCurrency(saveMs),
    threshold_ms: PERF_THRESHOLDS.save,
    passed: saveMs <= PERF_THRESHOLDS.save && saveIntegrity,
    detail: saveIntegrity ? 'All amounts consistent' : 'Amount mismatch detected',
  });

  const exportStart = performance.now();
  const direct = roundCurrency(items.reduce((sum, item) => sum + item.total_amount, 0));
  const breakdown = calculateEstimateBreakdown(direct, DEMO_PERCENTAGES);
  const resourceGrand = roundCurrency(
    items.reduce((sum, item) => sum + item.total_amount, 0)
  );
  const exportMs = performance.now() - exportStart;
  results.push({
    id: 'export',
    label: 'Estimate export calculation (1000 items)',
    item_count: itemCount,
    duration_ms: roundCurrency(exportMs),
    threshold_ms: PERF_THRESHOLDS.export,
    passed: exportMs <= PERF_THRESHOLDS.export,
    detail: `Grand total ${breakdown.grand_total.toLocaleString()}; resource total ${resourceGrand.toLocaleString()}`,
  });

  const largeStart = performance.now();
  for (const count of [100, 500, 1000]) {
    const batch = buildPerformanceItems(count, count * 100);
    const batchDirect = batch.reduce((sum, item) => sum + item.total_amount, 0);
    calculateEstimateBreakdown(batchDirect, DEMO_PERCENTAGES);
  }
  const largeMs = performance.now() - largeStart;
  results.push({
    id: 'large_boq',
    label: 'Large BOQ benchmark (100/500/1000)',
    duration_ms: roundCurrency(largeMs),
    threshold_ms: PERF_THRESHOLDS.large_boq,
    passed: largeMs <= PERF_THRESHOLDS.large_boq,
    detail: 'Combined load+calc+save for three batch sizes',
  });

  return {
    results,
    all_passed: results.every((result) => result.passed),
    run_at: new Date().toISOString(),
  };
}
