'use server';

import {
  buildCsvDownload,
  buildWorkbookBuffer,
  downloadFilename,
} from '@/lib/resource-library/export';
import {
  createCompanyResource,
  deleteCompanyResource,
  importCompanyResources,
  listAllCompanyResources,
  listCompanyResources,
  updateCompanyResource,
} from '@/services/resource-library/company-resources';
import {
  createCompanyResourceCategory,
  deleteCompanyResourceCategory,
  importCompanyResourceCategories,
  listAllCompanyResourceCategories,
  listCompanyResourceCategories,
  updateCompanyResourceCategory,
} from '@/services/resource-library/categories';
import {
  createCompanySupplier,
  deleteCompanySupplier,
  importCompanySuppliers,
  listAllCompanySuppliers,
  listCompanySuppliers,
  updateCompanySupplier,
} from '@/services/resource-library/suppliers';
import {
  createCompanyUnit,
  deleteCompanyUnit,
  importCompanyUnits,
  listAllCompanyUnits,
  listCompanyUnits,
  updateCompanyUnit,
} from '@/services/resource-library/units';
import type { RateLibraryCategory } from '@/types/rate-library';
import type {
  CompanyResourceListParams,
  CreateCompanyResourceCategoryInput,
  CreateCompanyResourceInput,
  CreateCompanySupplierInput,
  CreateCompanyUnitInput,
  ListQueryParams,
  ResourceCategoryListParams,
  UpdateCompanyResourceCategoryInput,
  UpdateCompanyResourceInput,
  UpdateCompanySupplierInput,
  UpdateCompanyUnitInput,
} from '@/types/resource-library';

export async function loadCompanySuppliersAction(params: ListQueryParams) {
  return listCompanySuppliers(params);
}

export async function createCompanySupplierAction(input: CreateCompanySupplierInput) {
  return createCompanySupplier(input);
}

export async function updateCompanySupplierAction(
  itemId: string,
  input: UpdateCompanySupplierInput
) {
  return updateCompanySupplier(itemId, input);
}

export async function deleteCompanySupplierAction(itemId: string) {
  return deleteCompanySupplier(itemId);
}

export async function importCompanySuppliersAction(items: CreateCompanySupplierInput[]) {
  return importCompanySuppliers(items);
}

export async function exportCompanySuppliersAction(format: 'csv' | 'xlsx') {
  const items = await listAllCompanySuppliers(false);
  const headers = ['Code', 'Name', 'Contact', 'Email', 'Phone', 'Notes', 'Active'];
  const rows = items.map((item) => [
    item.code,
    item.name,
    item.contact_person ?? '',
    item.email ?? '',
    item.phone ?? '',
    item.notes ?? '',
    item.is_active ? 'Active' : 'Inactive',
  ]);

  if (format === 'csv') {
    return {
      filename: downloadFilename('suppliers', 'csv'),
      mimeType: 'text/csv;charset=utf-8',
      content: buildCsvDownload(headers, rows),
    };
  }

  const buffer = await buildWorkbookBuffer('Suppliers', headers, rows);
  return {
    filename: downloadFilename('suppliers', 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: buffer.toString('base64'),
    encoding: 'base64' as const,
  };
}

export async function loadCompanyUnitsAction(params: ListQueryParams) {
  return listCompanyUnits(params);
}

export async function createCompanyUnitAction(input: CreateCompanyUnitInput) {
  return createCompanyUnit(input);
}

export async function updateCompanyUnitAction(itemId: string, input: UpdateCompanyUnitInput) {
  return updateCompanyUnit(itemId, input);
}

export async function deleteCompanyUnitAction(itemId: string) {
  return deleteCompanyUnit(itemId);
}

export async function importCompanyUnitsAction(items: CreateCompanyUnitInput[]) {
  return importCompanyUnits(items);
}

export async function exportCompanyUnitsAction(format: 'csv' | 'xlsx') {
  const items = await listAllCompanyUnits(false);
  const headers = ['Code', 'Symbol', 'Name', 'Description', 'Active'];
  const rows = items.map((item) => [
    item.code,
    item.symbol,
    item.name,
    item.description ?? '',
    item.is_active ? 'Active' : 'Inactive',
  ]);

  if (format === 'csv') {
    return {
      filename: downloadFilename('units', 'csv'),
      mimeType: 'text/csv;charset=utf-8',
      content: buildCsvDownload(headers, rows),
    };
  }

  const buffer = await buildWorkbookBuffer('Units', headers, rows);
  return {
    filename: downloadFilename('units', 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: buffer.toString('base64'),
    encoding: 'base64' as const,
  };
}

export async function loadCompanyResourceCategoriesAction(
  params: ResourceCategoryListParams
) {
  return listCompanyResourceCategories(params);
}

export async function createCompanyResourceCategoryAction(
  input: CreateCompanyResourceCategoryInput
) {
  return createCompanyResourceCategory(input);
}

export async function updateCompanyResourceCategoryAction(
  itemId: string,
  input: UpdateCompanyResourceCategoryInput
) {
  return updateCompanyResourceCategory(itemId, input);
}

export async function deleteCompanyResourceCategoryAction(itemId: string) {
  return deleteCompanyResourceCategory(itemId);
}

export async function importCompanyResourceCategoriesAction(
  items: CreateCompanyResourceCategoryInput[]
) {
  return importCompanyResourceCategories(items);
}

export async function exportCompanyResourceCategoriesAction(format: 'csv' | 'xlsx') {
  const items = await listAllCompanyResourceCategories(undefined, false);
  const headers = ['Code', 'Name', 'Resource Type', 'Description', 'Active'];
  const rows = items.map((item) => [
    item.code,
    item.name,
    item.resource_type,
    item.description ?? '',
    item.is_active ? 'Active' : 'Inactive',
  ]);

  if (format === 'csv') {
    return {
      filename: downloadFilename('resource_categories', 'csv'),
      mimeType: 'text/csv;charset=utf-8',
      content: buildCsvDownload(headers, rows),
    };
  }

  const buffer = await buildWorkbookBuffer('Resource Categories', headers, rows);
  return {
    filename: downloadFilename('resource_categories', 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: buffer.toString('base64'),
    encoding: 'base64' as const,
  };
}

export async function loadCompanyResourcesAction(params: CompanyResourceListParams) {
  return listCompanyResources(params);
}

export async function createCompanyResourceAction(input: CreateCompanyResourceInput) {
  return createCompanyResource(input);
}

export async function updateCompanyResourceAction(
  itemId: string,
  input: UpdateCompanyResourceInput
) {
  return updateCompanyResource(itemId, input);
}

export async function deleteCompanyResourceAction(itemId: string) {
  return deleteCompanyResource(itemId);
}

export async function importCompanyResourcesAction(items: CreateCompanyResourceInput[]) {
  return importCompanyResources(items);
}

export async function exportCompanyResourcesAction(
  category: RateLibraryCategory,
  format: 'csv' | 'xlsx'
) {
  const items = await listAllCompanyResources(category, false);
  const headers = [
    'Code',
    'Description',
    'Unit',
    'Unit Cost',
    'Supplier',
    'Category',
    'Active',
  ];
  const rows = items.map((item) => [
    item.code,
    item.description,
    item.unit_symbol ?? item.unit,
    item.unit_cost,
    item.supplier_name ?? '',
    item.resource_category_name ?? '',
    item.is_active ? 'Active' : 'Inactive',
  ]);

  if (format === 'csv') {
    return {
      filename: downloadFilename(`${category}_resources`, 'csv'),
      mimeType: 'text/csv;charset=utf-8',
      content: buildCsvDownload(headers, rows),
    };
  }

  const buffer = await buildWorkbookBuffer(
    `${category} Resources`,
    headers,
    rows
  );
  return {
    filename: downloadFilename(`${category}_resources`, 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: buffer.toString('base64'),
    encoding: 'base64' as const,
  };
}

export async function loadResourceLookupsAction(category: RateLibraryCategory) {
  const [suppliers, units, categories] = await Promise.all([
    listAllCompanySuppliers(true),
    listAllCompanyUnits(true),
    listAllCompanyResourceCategories(category, true),
  ]);

  return { suppliers, units, categories };
}
