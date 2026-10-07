'use client';

interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutArc extends ChartSlice {
  path: string;
}

function buildDonutArcs(
  slices: ChartSlice[],
  center: number,
  radius: number,
  innerRadius: number
): DonutArc[] {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const arcs: DonutArc[] = [];
  let angle = -Math.PI / 2;

  for (const slice of slices) {
    if (slice.value <= 0) {
      continue;
    }

    const sweep = total > 0 ? (slice.value / total) * Math.PI * 2 : 0;
    const start = angle;
    const end = angle + sweep;
    angle = end;

    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const ix1 = center + innerRadius * Math.cos(end);
    const iy1 = center + innerRadius * Math.sin(end);
    const ix2 = center + innerRadius * Math.cos(start);
    const iy2 = center + innerRadius * Math.sin(start);
    const large = sweep > Math.PI ? 1 : 0;

    arcs.push({
      ...slice,
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${ix2} ${iy2} Z`,
    });
  }

  return arcs;
}

interface SimpleDonutChartProps {
  slices: ChartSlice[];
  size?: number;
}

export function SimpleDonutChart({
  slices,
  size = 200,
}: SimpleDonutChartProps): React.JSX.Element {
  const radius = size / 2 - 12;
  const innerRadius = radius * 0.55;
  const center = size / 2;
  const arcs = buildDonutArcs(slices, center, radius, innerRadius);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.path} fill={arc.color} />
        ))}
        <circle cx={center} cy={center} r={innerRadius - 1} fill="var(--background)" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {slices.map((slice) => (
          <span key={slice.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: slice.color }}
            />
            {slice.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  items: BarItem[];
  maxValue?: number;
  height?: number;
}

export function SimpleBarChart({
  items,
  maxValue,
  height = 220,
}: SimpleBarChartProps): React.JSX.Element {
  const max = maxValue ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-2" style={{ minHeight: height }}>
      {items.map((item) => {
        const width = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span className="shrink-0 tabular-nums">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
