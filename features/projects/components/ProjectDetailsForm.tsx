'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ProjectStatusBadge } from '@/features/projects/components/ProjectStatusBadge';
import {
  CONTRACT_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  DEFAULT_UNIT_SYSTEM_OPTIONS,
  MEASUREMENT_SYSTEM_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ROUNDING_RULE_OPTIONS,
} from '@/lib/constants/project-options';
import { formatDateTime } from '@/lib/format';
import { updateProjectDetails } from '@/services/projects/update-project-details';
import type {
  ContractType,
  CurrencyCode,
  DefaultUnitSystem,
  MeasurementSystem,
  ProjectDetailsRecord,
  ProjectType,
  RoundingRule,
  UpdateProjectDetailsInput,
} from '@/types/project';

interface FormState {
  project_name: string;
  client_name: string;
  owner: string;
  consultant: string;
  contractor: string;
  description: string;
  location: string;
  project_type: ProjectType | '';
  contract_type: ContractType | '';
  currency: CurrencyCode;
  vat_percent: string;
  markup_percent: string;
  contingency_percent: string;
  indirect_cost_percent: string;
  rounding_rule: RoundingRule;
  measurement_system: MeasurementSystem;
  default_unit_system: DefaultUnitSystem;
}

function projectToFormState(project: ProjectDetailsRecord): FormState {
  return {
    project_name: project.project_name,
    client_name: project.client_name,
    owner: project.owner ?? '',
    consultant: project.consultant ?? '',
    contractor: project.contractor ?? '',
    description: project.description ?? '',
    location: project.location ?? '',
    project_type: project.project_type ?? '',
    contract_type: project.contract_type ?? '',
    currency: project.currency,
    vat_percent: String(project.vat_percent),
    markup_percent: String(project.markup_percent),
    contingency_percent: String(project.contingency_percent),
    indirect_cost_percent: String(project.indirect_cost_percent),
    rounding_rule: project.rounding_rule,
    measurement_system: project.measurement_system,
    default_unit_system: project.default_unit_system,
  };
}

function parsePercentInput(value: string): number | null {
  if (value.trim() === '') {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

interface ProjectDetailsFormProps {
  project: ProjectDetailsRecord;
  canEdit: boolean;
}

export function ProjectDetailsForm({
  project,
  canEdit,
}: ProjectDetailsFormProps): React.JSX.Element {
  const router = useRouter();
  const savedState = useMemo(() => projectToFormState(project), [project]);
  const [form, setForm] = useState<FormState>(savedState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const readOnly = !canEdit;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setIsDirty(true);
      setErrors((current) => {
        if (!(key in current)) {
          return current;
        }
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    []
  );

  function handleReset(): void {
    setForm(savedState);
    setErrors({});
    setFormError(null);
    setIsDirty(false);
  }

  function validate(): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (!form.project_name.trim()) {
      nextErrors.project_name = 'Project name is required';
    }

    if (!form.client_name.trim()) {
      nextErrors.client_name = 'Client name is required';
    }

    if (!form.currency) {
      nextErrors.currency = 'Currency is required';
    }

    const percentFields = [
      { key: 'vat_percent', label: 'VAT %' },
      { key: 'markup_percent', label: 'Markup %' },
      { key: 'contingency_percent', label: 'Contingency %' },
      { key: 'indirect_cost_percent', label: 'Indirect Cost %' },
    ] as const;

    for (const { key, label } of percentFields) {
      const parsed = parsePercentInput(form[key]);
      if (parsed === null || parsed < 0 || parsed > 100) {
        nextErrors[key] = `${label} must be between 0 and 100`;
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (readOnly) {
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: UpdateProjectDetailsInput = {
      project_name: form.project_name.trim(),
      client_name: form.client_name.trim(),
      location: form.location,
      description: form.description,
      owner: form.owner,
      consultant: form.consultant,
      contractor: form.contractor,
      project_type: form.project_type,
      contract_type: form.contract_type,
      currency: form.currency,
      vat_percent: parsePercentInput(form.vat_percent) ?? 0,
      markup_percent: parsePercentInput(form.markup_percent) ?? 0,
      contingency_percent: parsePercentInput(form.contingency_percent) ?? 0,
      indirect_cost_percent: parsePercentInput(form.indirect_cost_percent) ?? 0,
      rounding_rule: form.rounding_rule,
      measurement_system: form.measurement_system,
      default_unit_system: form.default_unit_system,
    };

    const result = await updateProjectDetails(project.id, payload);
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? 'Something went wrong');
      return;
    }

    setIsDirty(false);
    router.refresh();
  }

  function handleCancel(): void {
    if (isDirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    handleReset();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="project_code">Project Code</Label>
          <Input
            id="project_code"
            value={project.project_code}
            disabled
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_name">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="project_name"
            value={form.project_name}
            onChange={(event) => updateField('project_name', event.target.value)}
            disabled={readOnly || isSubmitting}
            className={errors.project_name ? 'border-destructive' : undefined}
          />
          {errors.project_name && (
            <p className="text-sm text-destructive">{errors.project_name}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Stakeholders and parties involved in the project.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_name">
              Client Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client_name"
              value={form.client_name}
              onChange={(event) => updateField('client_name', event.target.value)}
              disabled={readOnly || isSubmitting}
              className={errors.client_name ? 'border-destructive' : undefined}
            />
            {errors.client_name && (
              <p className="text-sm text-destructive">{errors.client_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <Input
              id="owner"
              value={form.owner}
              onChange={(event) => updateField('owner', event.target.value)}
              disabled={readOnly || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consultant">Consultant</Label>
            <Input
              id="consultant"
              value={form.consultant}
              onChange={(event) => updateField('consultant', event.target.value)}
              disabled={readOnly || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractor">Contractor</Label>
            <Input
              id="contractor"
              value={form.contractor}
              onChange={(event) => updateField('contractor', event.target.value)}
              disabled={readOnly || isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Scope, location, and contract classification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={readOnly || isSubmitting}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                disabled={readOnly || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <Select
                value={form.project_type || 'none'}
                onValueChange={(value) =>
                  updateField(
                    'project_type',
                    value === 'none' ? '' : (value as ProjectType)
                  )
                }
                disabled={readOnly || isSubmitting}
              >
                <SelectTrigger id="project_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {PROJECT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select
                value={form.contract_type || 'none'}
                onValueChange={(value) =>
                  updateField(
                    'contract_type',
                    value === 'none' ? '' : (value as ContractType)
                  )
                }
                disabled={readOnly || isSubmitting}
              >
                <SelectTrigger id="contract_type">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {CONTRACT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimate Settings</CardTitle>
          <CardDescription>
            Currency, overhead percentages, and rounding for this estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency">
              Currency <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.currency}
              onValueChange={(value) =>
                updateField('currency', value as CurrencyCode)
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger
                id="currency"
                className={errors.currency ? 'border-destructive' : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency}</p>
            )}
          </div>

          {(
            [
              { key: 'vat_percent', label: 'VAT %' },
              { key: 'markup_percent', label: 'Markup %' },
              { key: 'contingency_percent', label: 'Contingency %' },
              { key: 'indirect_cost_percent', label: 'Indirect Cost %' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form[key]}
                onChange={(event) => updateField(key, event.target.value)}
                disabled={readOnly || isSubmitting}
                className={errors[key] ? 'border-destructive' : undefined}
              />
              {errors[key] && (
                <p className="text-sm text-destructive">{errors[key]}</p>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="rounding_rule">Rounding Rule</Label>
            <Select
              value={form.rounding_rule}
              onValueChange={(value) =>
                updateField('rounding_rule', value as RoundingRule)
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger id="rounding_rule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUNDING_RULE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Measurement and unit conventions for quantities.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="measurement_system">Measurement System</Label>
            <Select
              value={form.measurement_system}
              onValueChange={(value) =>
                updateField('measurement_system', value as MeasurementSystem)
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger id="measurement_system">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_SYSTEM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_unit_system">Default Unit System</Label>
            <Select
              value={form.default_unit_system}
              onValueChange={(value) =>
                updateField('default_unit_system', value as DefaultUnitSystem)
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger id="default_unit_system">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_UNIT_SYSTEM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Current project lifecycle status. Use lifecycle actions above to
            transition.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <ProjectStatusBadge status={project.status} />
          {project.approved_at && (
            <p className="text-sm text-muted-foreground">
              Approved {formatDateTime(project.approved_at)}
            </p>
          )}
          {project.submitted_at && project.status === 'for_review' && (
            <p className="text-sm text-muted-foreground">
              Submitted {formatDateTime(project.submitted_at)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit</CardTitle>
          <CardDescription>Record creation and modification history.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">{project.created_by_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created Date</p>
            <p className="font-medium">{formatDateTime(project.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Updated By</p>
            <p className="font-medium">
              {project.updated_by_name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Updated Date</p>
            <p className="font-medium">{formatDateTime(project.updated_at)}</p>
          </div>
        </CardContent>
      </Card>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={isSubmitting || !isDirty}
          >
            Reset
          </Button>
        </div>
      )}
    </form>
  );
}
