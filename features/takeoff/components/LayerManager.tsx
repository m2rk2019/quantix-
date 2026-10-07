'use client';

import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TakeoffLayer } from '@/types/takeoff';

interface LayerManagerProps {
  layers: TakeoffLayer[];
  canEdit: boolean;
  onChange: (
    layerId: string,
    patch: Partial<
      Pick<TakeoffLayer, 'is_visible' | 'is_locked' | 'color' | 'opacity'>
    >
  ) => void;
}

export function LayerManager({
  layers,
  canEdit,
  onChange,
}: LayerManagerProps): React.JSX.Element {
  return (
    <div className="border-t">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Layers
      </p>
      <ul className="max-h-48 space-y-1 overflow-y-auto px-2 pb-2">
        {layers.map((layer) => (
          <li
            key={layer.id}
            className={cn(
              'flex items-center gap-1 rounded-md border bg-background px-1.5 py-1 text-[11px]',
              !layer.is_visible && 'opacity-60'
            )}
          >
            <button
              type="button"
              className="rounded p-0.5 hover:bg-muted"
              disabled={!canEdit}
              title={layer.is_visible ? 'Hide' : 'Show'}
              onClick={() =>
                onChange(layer.id, { is_visible: !layer.is_visible })
              }
            >
              {layer.is_visible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              className="rounded p-0.5 hover:bg-muted"
              disabled={!canEdit}
              title={layer.is_locked ? 'Unlock' : 'Lock'}
              onClick={() =>
                onChange(layer.id, { is_locked: !layer.is_locked })
              }
            >
              {layer.is_locked ? (
                <Lock className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              type="color"
              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
              disabled={!canEdit}
              value={layer.color}
              title="Color"
              onChange={(e) => onChange(layer.id, { color: e.target.value })}
            />
            <span className="min-w-0 flex-1 truncate" title={layer.name}>
              {layer.name}
            </span>
            <Input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              className="h-5 w-14 p-0"
              disabled={!canEdit}
              value={layer.opacity}
              title={`Opacity ${Math.round(layer.opacity * 100)}%`}
              onChange={(e) =>
                onChange(layer.id, { opacity: Number(e.target.value) })
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
