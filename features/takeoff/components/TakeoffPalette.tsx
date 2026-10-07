'use client';

import { TAKEOFF_PALETTE_GROUPS, presetsByGroup } from '@/lib/takeoff/palette';
import type { TakeoffPalettePreset } from '@/lib/takeoff/palette';
import { cn } from '@/lib/utils';

interface TakeoffPaletteProps {
  activePresetKey: string | null;
  onSelect: (preset: TakeoffPalettePreset) => void;
  disabled?: boolean;
}

export function TakeoffPalette({
  activePresetKey,
  onSelect,
  disabled,
}: TakeoffPaletteProps): React.JSX.Element {
  return (
    <div className="flex max-h-28 gap-3 overflow-x-auto border-b bg-muted/20 px-3 py-2">
      {TAKEOFF_PALETTE_GROUPS.map((group) => (
        <div key={group} className="min-w-[180px] shrink-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group}
          </p>
          <div className="flex flex-wrap gap-1">
            {presetsByGroup(group).map((preset) => (
              <button
                key={preset.key}
                type="button"
                disabled={disabled}
                title={`${preset.name} · ${preset.tool} · ${preset.unit}`}
                onClick={() => onSelect(preset)}
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]',
                  activePresetKey === preset.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-background hover:bg-muted',
                  disabled && 'opacity-50'
                )}
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: preset.color }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
