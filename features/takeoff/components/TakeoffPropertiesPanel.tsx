'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeMeasurementMetrics } from '@/lib/takeoff/geometry';
import { TAKEOFF_DISCIPLINES } from '@/lib/takeoff/palette';
import {
  REVIEW_STATUS_LABELS,
} from '@/lib/takeoff/review';
import type {
  TakeoffLayer,
  TakeoffMeasurement,
  TakeoffReviewStatus,
  TakeoffSheet,
} from '@/types/takeoff';

export interface TakeoffBoqOption {
  id: string;
  wbs_code: string;
  item_code: string;
  description: string;
  unit: string;
}

interface TakeoffPropertiesPanelProps {
  measurement: TakeoffMeasurement | null;
  layers: TakeoffLayer[];
  sheet: TakeoffSheet | null;
  canEdit: boolean;
  selectionCount?: number;
  boqOptions?: TakeoffBoqOption[];
  assignedBoqId?: string | null;
  onAssignBoq?: (boqId: string | null) => void;
  onChange: (patch: {
    name?: string | null;
    layer_id?: string | null;
    discipline?: string | null;
    color?: string;
    unit?: string;
    notes?: string | null;
    review_status?: TakeoffReviewStatus;
  }) => void;
  onDeletePoint?: () => void;
}

export function TakeoffPropertiesPanel({
  measurement,
  layers,
  sheet,
  canEdit,
  selectionCount = 0,
  boqOptions = [],
  assignedBoqId = null,
  onAssignBoq,
  onChange,
  onDeletePoint,
}: TakeoffPropertiesPanelProps): React.JSX.Element {
  const activeScale =
    sheet?.scales.find((s) => s.is_active) ??
    (sheet?.pixels_per_meter
      ? {
          id: 'active',
          name: 'Active',
          pixels_per_meter: sheet.pixels_per_meter,
          is_active: true,
        }
      : null);

  if (!measurement) {
    return (
      <div className="flex flex-1 flex-col bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Measurement Properties
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {selectionCount > 1
            ? `${selectionCount} measurements selected.`
            : 'Select a measurement or draw a new one to edit properties.'}
        </p>
      </div>
    );
  }

  const live = computeMeasurementMetrics(
    measurement.tool_type,
    measurement.geometry,
    measurement.pixels_per_meter ?? sheet?.pixels_per_meter ?? null
  );

  return (
    <div className="flex max-h-[55%] flex-col overflow-hidden bg-muted/20">
      <div className="border-b p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Measurement Properties
        </p>
        {selectionCount > 1 ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Showing primary of {selectionCount} selected
          </p>
        ) : null}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        <Field label="Name">
          <Input
            className="h-8 text-xs"
            disabled={!canEdit}
            value={measurement.name ?? ''}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Layer">
          <select
            className="h-8 w-full rounded-md border bg-background px-2"
            disabled={!canEdit}
            value={measurement.layer_id ?? ''}
            onChange={(e) =>
              onChange({ layer_id: e.target.value || null })
            }
          >
            <option value="">Unassigned</option>
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Discipline">
          <select
            className="h-8 w-full rounded-md border bg-background px-2"
            disabled={!canEdit}
            value={measurement.discipline ?? ''}
            onChange={(e) =>
              onChange({ discipline: e.target.value || null })
            }
          >
            <option value="">Unassigned</option>
            {TAKEOFF_DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Color">
          <Input
            type="color"
            className="h-8 w-full"
            disabled={!canEdit}
            value={measurement.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </Field>
        <Field label="Unit">
          <Input
            className="h-8 text-xs"
            disabled={!canEdit}
            value={measurement.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            className="h-8 w-full rounded-md border bg-background px-2"
            disabled={!canEdit}
            value={measurement.review_status ?? 'draft'}
            onChange={(e) =>
              onChange({
                review_status: e.target.value as TakeoffReviewStatus,
              })
            }
          >
            {(Object.keys(REVIEW_STATUS_LABELS) as TakeoffReviewStatus[]).map(
              (s) => (
                <option key={s} value={s}>
                  {REVIEW_STATUS_LABELS[s]}
                </option>
              )
            )}
          </select>
        </Field>
        <Field label="Assigned BOQ">
          <select
            className="h-8 w-full rounded-md border bg-background px-2"
            disabled={!canEdit || !onAssignBoq}
            value={assignedBoqId ?? ''}
            onChange={(e) =>
              onAssignBoq?.(e.target.value ? e.target.value : null)
            }
          >
            <option value="">— Unassigned —</option>
            {boqOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.wbs_code} / {b.item_code} — {b.description.slice(0, 40)}
                {b.unit ? ` (${b.unit})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tool">
          <p className="rounded-md border bg-background px-2 py-1.5 capitalize">
            {measurement.tool_type}
          </p>
        </Field>
        <Field label="Scale">
          <p className="rounded-md border bg-background px-2 py-1.5">
            {activeScale
              ? `${activeScale.name} (${activeScale.pixels_per_meter.toFixed(2)} px/m)`
              : 'Not calibrated'}
          </p>
        </Field>
        <Field label="Quantity">
          <div className="space-y-1 rounded-md border bg-background px-2 py-1.5">
            {measurement.tool_type === 'circle' ? (
              <>
                <p>
                  Radius{' '}
                  {live.radius_px != null &&
                  (measurement.pixels_per_meter ?? sheet?.pixels_per_meter)
                    ? (
                        live.radius_px /
                        (measurement.pixels_per_meter ??
                          sheet!.pixels_per_meter!)
                      ).toFixed(3)
                    : '—'}{' '}
                  m
                </p>
                <p>Diameter {live.diameter_m?.toFixed(3) ?? '—'} m</p>
                <p>Circumference {live.length_m?.toFixed(3) ?? '—'} m</p>
                <p>Area {live.area_m2?.toFixed(3) ?? '—'} m²</p>
              </>
            ) : (
              <p>
                {live.length_m != null
                  ? `${live.length_m.toFixed(3)} m`
                  : null}
                {live.area_m2 != null
                  ? `${live.length_m != null ? ' · ' : ''}${live.area_m2.toFixed(3)} m²`
                  : null}
                {live.count_value != null
                  ? `Count ${live.count_value}`
                  : null}
                {live.length_m == null &&
                live.area_m2 == null &&
                live.count_value == null
                  ? '—'
                  : null}
              </p>
            )}
          </div>
        </Field>
        <Field label="Notes">
          <textarea
            className="min-h-[64px] w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            disabled={!canEdit}
            value={measurement.notes ?? ''}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </Field>
        <Field label="Created By">
          <p className="rounded-md border bg-background px-2 py-1.5">
            {measurement.created_by_name ?? '—'}
          </p>
        </Field>
        <Field label="Created Date">
          <p className="rounded-md border bg-background px-2 py-1.5">
            {new Date(measurement.created_at).toLocaleString()}
          </p>
        </Field>
        {canEdit && onDeletePoint ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={onDeletePoint}
          >
            Delete last point
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
