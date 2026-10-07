'use client';

import { ChevronDown, ChevronRight, Search, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TAKEOFF_DISCIPLINES } from '@/lib/takeoff/palette';
import type { TakeoffDrawing, TakeoffSheet } from '@/types/takeoff';

interface DrawingExplorerProps {
  drawings: TakeoffDrawing[];
  sheets: TakeoffSheet[];
  activeDrawingId: string | null;
  activeSheetId: string | null;
  canEdit: boolean;
  onSelectSheet: (drawingId: string, sheetId: string) => void;
  onUpload: (files: FileList | null, discipline: string) => void;
}

export function DrawingExplorer({
  drawings,
  sheets,
  activeDrawingId,
  activeSheetId,
  canEdit,
  onSelectSheet,
  onUpload,
}: DrawingExplorerProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [uploadDiscipline, setUploadDiscipline] = useState('Architectural');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filteredSheets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sheets.filter((s) => {
      const drawing = drawings.find((d) => d.id === s.drawing_id);
      const disc = s.discipline || drawing?.discipline || 'General';
      if (disciplineFilter !== 'all' && disc !== disciplineFilter) return false;
      if (!q) return true;
      return (
        s.sheet_name.toLowerCase().includes(q) ||
        (drawing?.title ?? '').toLowerCase().includes(q) ||
        disc.toLowerCase().includes(q)
      );
    });
  }, [sheets, drawings, search, disciplineFilter]);

  const byDiscipline = useMemo(() => {
    const map = new Map<string, TakeoffSheet[]>();
    for (const s of filteredSheets) {
      const drawing = drawings.find((d) => d.id === s.drawing_id);
      const disc = s.discipline || drawing?.discipline || 'General';
      const list = map.get(disc) ?? [];
      list.push(s);
      map.set(disc, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredSheets, drawings]);

  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="space-y-2 border-b p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Drawing Explorer
        </p>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-7 text-xs"
            placeholder="Search sheets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">
            Filter by discipline
          </Label>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
          >
            <option value="all">All disciplines</option>
            {TAKEOFF_DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        {canEdit ? (
          <div className="space-y-1.5 rounded-md border border-dashed p-2">
            <Label className="text-[10px]">Upload discipline</Label>
            <select
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={uploadDiscipline}
              onChange={(e) => setUploadDiscipline(e.target.value)}
            >
              {TAKEOFF_DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground">
              <Upload className="h-3.5 w-3.5" />
              Upload PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onUpload(e.target.files, uploadDiscipline)}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {byDiscipline.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            No sheets. Upload a PDF to begin.
          </p>
        ) : (
          byDiscipline.map(([discipline, discSheets]) => {
            const isCollapsed = collapsed[discipline];
            return (
              <div key={discipline} className="mb-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs font-semibold"
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [discipline]: !prev[discipline],
                    }))
                  }
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {discipline}
                  <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                    {discSheets.length}
                  </span>
                </button>
                {!isCollapsed
                  ? discSheets.map((s) => {
                      const drawing = drawings.find((d) => d.id === s.drawing_id);
                      const active =
                        s.id === activeSheetId &&
                        s.drawing_id === activeDrawingId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onSelectSheet(s.drawing_id, s.id)}
                          className={cn(
                            'mb-1 flex w-full gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted'
                          )}
                        >
                          <div className="h-10 w-8 shrink-0 overflow-hidden rounded border bg-background">
                            {s.thumbnail_base64 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.thumbnail_base64}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                                {s.sheet_index + 1}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {s.sheet_name}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {drawing?.title ?? 'Drawing'}
                              {s.pixels_per_meter ? ' · calibrated' : ''}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
