export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'estimator'
  | 'quantity_surveyor'
  | 'viewer';

export type ProjectStatus =
  | 'draft'
  | 'in_progress'
  | 'for_review'
  | 'approved'
  | 'archived';

export type MeasurementSystem = 'metric' | 'imperial';

export type RoundingRule =
  | 'half_up'
  | 'half_down'
  | 'round_up'
  | 'round_down';

export type RateLibraryCategory =
  | 'material'
  | 'labor'
  | 'equipment'
  | 'subcontract'
  | 'service'
  | 'productivity';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          project_code: string;
          project_name: string;
          client_name: string;
          location: string | null;
          status: ProjectStatus;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          approved_at: string | null;
          approved_by: string | null;
          archived_at: string | null;
          archived_by: string | null;
        };
        Insert: {
          id?: string;
          project_code: string;
          project_name: string;
          client_name: string;
          location?: string | null;
          status?: ProjectStatus;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
        };
        Update: {
          id?: string;
          project_code?: string;
          project_name?: string;
          client_name?: string;
          location?: string | null;
          status?: ProjectStatus;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      project_details: {
        Row: {
          id: string;
          project_id: string;
          description: string | null;
          owner: string | null;
          consultant: string | null;
          contractor: string | null;
          project_type: string | null;
          contract_type: string | null;
          currency: string;
          vat_percent: number;
          markup_percent: number;
          contingency_percent: number;
          indirect_cost_percent: number;
          rounding_rule: RoundingRule;
          measurement_system: MeasurementSystem;
          default_unit_system: string;
          is_benchmark: boolean;
          cloned_from_historical_id: string | null;
          assumptions: string | null;
          exclusions: string | null;
          commercial_notes: string | null;
          prepared_by_name: string | null;
          checked_by_name: string | null;
          approved_by_name: string | null;
          smart_import_job_id: string | null;
          import_profile_key: string | null;
          building_type: string | null;
          project_category: string | null;
          cfa_sqm: number | null;
          number_of_buildings: number | null;
          number_of_units: number | null;
          estimate_revision: string | null;
          is_master_template: boolean;
          source_master_template_id: string | null;
          source_master_template_version: string | null;
          template_reuse_report: Json;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          description?: string | null;
          owner?: string | null;
          consultant?: string | null;
          contractor?: string | null;
          project_type?: string | null;
          contract_type?: string | null;
          currency?: string;
          vat_percent?: number;
          markup_percent?: number;
          contingency_percent?: number;
          indirect_cost_percent?: number;
          rounding_rule?: RoundingRule;
          measurement_system?: MeasurementSystem;
          default_unit_system?: string;
          is_benchmark?: boolean;
          cloned_from_historical_id?: string | null;
          assumptions?: string | null;
          exclusions?: string | null;
          commercial_notes?: string | null;
          prepared_by_name?: string | null;
          checked_by_name?: string | null;
          approved_by_name?: string | null;
          smart_import_job_id?: string | null;
          import_profile_key?: string | null;
          building_type?: string | null;
          project_category?: string | null;
          cfa_sqm?: number | null;
          number_of_buildings?: number | null;
          number_of_units?: number | null;
          estimate_revision?: string | null;
          is_master_template?: boolean;
          source_master_template_id?: string | null;
          source_master_template_version?: string | null;
          template_reuse_report?: Json;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          description?: string | null;
          owner?: string | null;
          consultant?: string | null;
          contractor?: string | null;
          project_type?: string | null;
          contract_type?: string | null;
          currency?: string;
          vat_percent?: number;
          markup_percent?: number;
          contingency_percent?: number;
          indirect_cost_percent?: number;
          rounding_rule?: RoundingRule;
          measurement_system?: MeasurementSystem;
          default_unit_system?: string;
          is_benchmark?: boolean;
          cloned_from_historical_id?: string | null;
          assumptions?: string | null;
          exclusions?: string | null;
          commercial_notes?: string | null;
          prepared_by_name?: string | null;
          checked_by_name?: string | null;
          approved_by_name?: string | null;
          smart_import_job_id?: string | null;
          import_profile_key?: string | null;
          building_type?: string | null;
          project_category?: string | null;
          cfa_sqm?: number | null;
          number_of_buildings?: number | null;
          number_of_units?: number | null;
          estimate_revision?: string | null;
          is_master_template?: boolean;
          source_master_template_id?: string | null;
          source_master_template_version?: string | null;
          template_reuse_report?: Json;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_benchmark_actuals: {
        Row: {
          id: string;
          project_id: string;
          boq_item_id: string | null;
          item_code: string;
          description: string | null;
          estimated_quantity: number;
          actual_quantity: number;
          estimated_unit_rate: number;
          actual_unit_rate: number;
          estimated_cost: number;
          actual_cost: number;
          awarded_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          boq_item_id?: string | null;
          item_code: string;
          description?: string | null;
          estimated_quantity?: number;
          actual_quantity?: number;
          estimated_unit_rate?: number;
          actual_unit_rate?: number;
          estimated_cost?: number;
          actual_cost?: number;
          awarded_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          boq_item_id?: string | null;
          item_code?: string;
          description?: string | null;
          estimated_quantity?: number;
          actual_quantity?: number;
          estimated_unit_rate?: number;
          actual_unit_rate?: number;
          estimated_cost?: number;
          actual_cost?: number;
          awarded_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_settings: {
        Row: {
          id: string;
          company_name: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          default_currency: string;
          default_vat_percent: number;
          default_ocm_percent: number;
          default_contingency_percent: number;
          default_profit_percent: number;
          project_code_format: string;
          report_header: string | null;
          report_footer: string | null;
          signature_block: string | null;
          theme_color: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          default_currency?: string;
          default_vat_percent?: number;
          default_ocm_percent?: number;
          default_contingency_percent?: number;
          default_profit_percent?: number;
          project_code_format?: string;
          report_header?: string | null;
          report_footer?: string | null;
          signature_block?: string | null;
          theme_color?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          default_currency?: string;
          default_vat_percent?: number;
          default_ocm_percent?: number;
          default_contingency_percent?: number;
          default_profit_percent?: number;
          project_code_format?: string;
          report_header?: string | null;
          report_footer?: string | null;
          signature_block?: string | null;
          theme_color?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      estimate_summary: {
        Row: {
          id: string;
          project_id: string;
          direct_cost: number;
          indirect_cost: number;
          contingency: number;
          markup: number;
          vat: number;
          grand_total: number;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          direct_cost?: number;
          indirect_cost?: number;
          contingency?: number;
          markup?: number;
          vat?: number;
          grand_total?: number;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          direct_cost?: number;
          indirect_cost?: number;
          contingency?: number;
          markup?: number;
          vat?: number;
          grand_total?: number;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wbs: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          level: number;
          wbs_code: string;
          description: string;
          sort_order: number;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          level: number;
          wbs_code: string;
          description: string;
          sort_order?: number;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          level?: number;
          wbs_code?: string;
          description?: string;
          sort_order?: number;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      boq_items: {
        Row: {
          id: string;
          project_id: string;
          wbs_id: string;
          item_code: string;
          description: string;
          unit: string;
          quantity: number;
          material_rate: number;
          labor_rate: number;
          equipment_rate: number;
          subcontract_rate: number;
          other_cost_rate: number;
          material_rate_override: boolean;
          labor_rate_override: boolean;
          equipment_rate_override: boolean;
          subcontract_rate_override: boolean;
          other_cost_rate_override: boolean;
          ocm_percent: number | null;
          contingency_percent: number | null;
          profit_percent: number | null;
          vat_percent: number | null;
          rate_buildup_direct_cost: number | null;
          total_rate: number;
          total_amount: number;
          template_match_status: string | null;
          needs_estimator_review: boolean;
          source_workbook: string | null;
          source_sheet: string | null;
          source_row: number | null;
          imported_at: string | null;
          match_confidence: number | null;
          quantity_source: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          wbs_id: string;
          item_code: string;
          description: string;
          unit?: string;
          quantity?: number;
          material_rate?: number;
          labor_rate?: number;
          equipment_rate?: number;
          subcontract_rate?: number;
          other_cost_rate?: number;
          material_rate_override?: boolean;
          labor_rate_override?: boolean;
          equipment_rate_override?: boolean;
          subcontract_rate_override?: boolean;
          other_cost_rate_override?: boolean;
          ocm_percent?: number | null;
          contingency_percent?: number | null;
          profit_percent?: number | null;
          vat_percent?: number | null;
          rate_buildup_direct_cost?: number | null;
          total_rate?: number;
          total_amount?: number;
          template_match_status?: string | null;
          needs_estimator_review?: boolean;
          source_workbook?: string | null;
          source_sheet?: string | null;
          source_row?: number | null;
          imported_at?: string | null;
          match_confidence?: number | null;
          quantity_source?: string | null;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          wbs_id?: string;
          item_code?: string;
          description?: string;
          unit?: string;
          quantity?: number;
          material_rate?: number;
          labor_rate?: number;
          equipment_rate?: number;
          subcontract_rate?: number;
          other_cost_rate?: number;
          material_rate_override?: boolean;
          labor_rate_override?: boolean;
          equipment_rate_override?: boolean;
          subcontract_rate_override?: boolean;
          other_cost_rate_override?: boolean;
          ocm_percent?: number | null;
          contingency_percent?: number | null;
          profit_percent?: number | null;
          vat_percent?: number | null;
          rate_buildup_direct_cost?: number | null;
          total_rate?: number;
          total_amount?: number;
          template_match_status?: string | null;
          needs_estimator_review?: boolean;
          source_workbook?: string | null;
          source_sheet?: string | null;
          source_row?: number | null;
          imported_at?: string | null;
          match_confidence?: number | null;
          quantity_source?: string | null;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_boq_links: {
        Row: {
          id: string;
          project_id: string;
          wbs_id: string;
          boq_id: string;
          measurement_id: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          wbs_id: string;
          boq_id: string;
          measurement_id: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          wbs_id?: string;
          boq_id?: string;
          measurement_id?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      rate_library_items: {
        Row: {
          id: string;
          code: string;
          description: string;
          unit: string;
          unit_cost: number;
          category: RateLibraryCategory;
          is_active: boolean;
          supplier_id: string | null;
          unit_id: string | null;
          resource_category_id: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          description: string;
          unit?: string;
          unit_cost?: number;
          category: RateLibraryCategory;
          is_active?: boolean;
          supplier_id?: string | null;
          unit_id?: string | null;
          resource_category_id?: string | null;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string;
          unit?: string;
          unit_cost?: number;
          category?: RateLibraryCategory;
          is_active?: boolean;
          supplier_id?: string | null;
          unit_id?: string | null;
          resource_category_id?: string | null;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      project_rate_library_items: {
        Row: {
          id: string;
          project_id: string;
          code: string;
          description: string;
          unit: string;
          unit_cost: number;
          category: RateLibraryCategory;
          is_active: boolean;
          supplier_id: string | null;
          unit_id: string | null;
          resource_category_id: string | null;
          source_company_item_id: string | null;
          source_unit_cost: number | null;
          source_updated_at: string | null;
          ignore_company_updates: boolean;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          code: string;
          description: string;
          unit?: string;
          unit_cost?: number;
          category: RateLibraryCategory;
          is_active?: boolean;
          supplier_id?: string | null;
          unit_id?: string | null;
          resource_category_id?: string | null;
          source_company_item_id?: string | null;
          source_unit_cost?: number | null;
          source_updated_at?: string | null;
          ignore_company_updates?: boolean;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          code?: string;
          description?: string;
          unit?: string;
          unit_cost?: number;
          category?: RateLibraryCategory;
          is_active?: boolean;
          supplier_id?: string | null;
          unit_id?: string | null;
          resource_category_id?: string | null;
          source_company_item_id?: string | null;
          source_unit_cost?: number | null;
          source_updated_at?: string | null;
          ignore_company_updates?: boolean;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      boq_rate_analysis_lines: {
        Row: {
          id: string;
          boq_item_id: string;
          library_item_id: string | null;
          project_library_item_id: string | null;
          category: RateLibraryCategory;
          resource_name: string;
          unit: string;
          consumption: number;
          unit_cost: number;
          waste_percent: number;
          productivity: number | null;
          amount: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          boq_item_id: string;
          library_item_id?: string | null;
          project_library_item_id?: string | null;
          category: RateLibraryCategory;
          resource_name: string;
          unit?: string;
          consumption?: number;
          unit_cost?: number;
          waste_percent?: number;
          productivity?: number | null;
          amount?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          boq_item_id?: string;
          library_item_id?: string | null;
          project_library_item_id?: string | null;
          category?: RateLibraryCategory;
          resource_name?: string;
          unit?: string;
          consumption?: number;
          unit_cost?: number;
          waste_percent?: number;
          productivity?: number | null;
          amount?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      user_rate_library_favorites: {
        Row: {
          user_id: string;
          library_item_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          library_item_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          library_item_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      company_suppliers: {
        Row: {
          id: string;
          code: string;
          name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          is_active: boolean;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      company_units: {
        Row: {
          id: string;
          code: string;
          symbol: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          symbol: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          symbol?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      company_resource_categories: {
        Row: {
          id: string;
          code: string;
          name: string;
          resource_type: RateLibraryCategory;
          description: string | null;
          is_active: boolean;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          resource_type: RateLibraryCategory;
          description?: string | null;
          is_active?: boolean;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          resource_type?: RateLibraryCategory;
          description?: string | null;
          is_active?: boolean;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_id: string | null;
          payload: Json;
          project_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_id?: string | null;
          payload?: Json;
          project_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          actor_id?: string | null;
          payload?: Json;
          project_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      historical_projects: {
        Row: {
          id: string;
          source_project_id: string | null;
          project_code: string;
          project_name: string;
          client_name: string;
          location: string | null;
          building_type: string | null;
          project_type: string | null;
          contract_type: string | null;
          currency: string;
          discipline_tags: string[];
          resource_tags: string[];
          supplier_tags: string[];
          estimate_date: string | null;
          source_status: string | null;
          archive_version: number;
          is_knowledge_active: boolean;
          is_benchmark_eligible: boolean;
          cost_intelligence_ready: boolean;
          grand_total: number;
          direct_cost: number;
          indirect_cost: number;
          contingency: number;
          markup: number;
          vat: number;
          boq_item_count: number;
          wbs_node_count: number;
          resource_count: number;
          archived_at: string;
          archived_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_project_id?: string | null;
          project_code: string;
          project_name: string;
          client_name: string;
          location?: string | null;
          building_type?: string | null;
          project_type?: string | null;
          contract_type?: string | null;
          currency?: string;
          discipline_tags?: string[];
          resource_tags?: string[];
          supplier_tags?: string[];
          estimate_date?: string | null;
          source_status?: string | null;
          archive_version?: number;
          is_knowledge_active?: boolean;
          is_benchmark_eligible?: boolean;
          cost_intelligence_ready?: boolean;
          grand_total?: number;
          direct_cost?: number;
          indirect_cost?: number;
          contingency?: number;
          markup?: number;
          vat?: number;
          boq_item_count?: number;
          wbs_node_count?: number;
          resource_count?: number;
          archived_at?: string;
          archived_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_project_id?: string | null;
          project_code?: string;
          project_name?: string;
          client_name?: string;
          location?: string | null;
          building_type?: string | null;
          project_type?: string | null;
          contract_type?: string | null;
          currency?: string;
          discipline_tags?: string[];
          resource_tags?: string[];
          supplier_tags?: string[];
          estimate_date?: string | null;
          source_status?: string | null;
          archive_version?: number;
          is_knowledge_active?: boolean;
          is_benchmark_eligible?: boolean;
          cost_intelligence_ready?: boolean;
          grand_total?: number;
          direct_cost?: number;
          indirect_cost?: number;
          contingency?: number;
          markup?: number;
          vat?: number;
          boq_item_count?: number;
          wbs_node_count?: number;
          resource_count?: number;
          archived_at?: string;
          archived_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      historical_project_snapshots: {
        Row: {
          id: string;
          historical_project_id: string;
          section: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          historical_project_id: string;
          section: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          historical_project_id?: string;
          section?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      historical_boq_lines: {
        Row: {
          id: string;
          historical_project_id: string;
          source_boq_item_id: string | null;
          wbs_code: string | null;
          wbs_description: string | null;
          discipline: string | null;
          item_code: string | null;
          description: string | null;
          unit: string | null;
          quantity: number;
          unit_rate: number;
          total_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          historical_project_id: string;
          source_boq_item_id?: string | null;
          wbs_code?: string | null;
          wbs_description?: string | null;
          discipline?: string | null;
          item_code?: string | null;
          description?: string | null;
          unit?: string | null;
          quantity?: number;
          unit_rate?: number;
          total_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          historical_project_id?: string;
          source_boq_item_id?: string | null;
          wbs_code?: string | null;
          wbs_description?: string | null;
          discipline?: string | null;
          item_code?: string | null;
          description?: string | null;
          unit?: string | null;
          quantity?: number;
          unit_rate?: number;
          total_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      historical_resource_rates: {
        Row: {
          id: string;
          historical_project_id: string;
          source_item_id: string | null;
          code: string | null;
          description: string | null;
          category: string | null;
          unit: string | null;
          unit_cost: number;
          supplier_id: string | null;
          supplier_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          historical_project_id: string;
          source_item_id?: string | null;
          code?: string | null;
          description?: string | null;
          category?: string | null;
          unit?: string | null;
          unit_cost?: number;
          supplier_id?: string | null;
          supplier_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          historical_project_id?: string;
          source_item_id?: string | null;
          code?: string | null;
          description?: string | null;
          category?: string | null;
          unit?: string | null;
          unit_cost?: number;
          supplier_id?: string | null;
          supplier_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tender_submissions: {
        Row: {
          id: string;
          project_id: string;
          version: number;
          title: string;
          status: string;
          enabled_sections: string[];
          branding: Json;
          package_snapshot: Json;
          prepared_by_name: string | null;
          checked_by_name: string | null;
          approved_by_name: string | null;
          generated_by: string | null;
          generated_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version: number;
          title: string;
          status?: string;
          enabled_sections?: string[];
          branding?: Json;
          package_snapshot?: Json;
          prepared_by_name?: string | null;
          checked_by_name?: string | null;
          approved_by_name?: string | null;
          generated_by?: string | null;
          generated_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          version?: number;
          title?: string;
          status?: string;
          enabled_sections?: string[];
          branding?: Json;
          package_snapshot?: Json;
          prepared_by_name?: string | null;
          checked_by_name?: string | null;
          approved_by_name?: string | null;
          generated_by?: string | null;
          generated_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tender_submission_exports: {
        Row: {
          id: string;
          tender_submission_id: string;
          export_type: string;
          filename: string;
          mime_type: string;
          file_size_bytes: number;
          content_base64: string;
          generated_by: string | null;
          generated_at: string;
        };
        Insert: {
          id?: string;
          tender_submission_id: string;
          export_type: string;
          filename: string;
          mime_type: string;
          file_size_bytes?: number;
          content_base64: string;
          generated_by?: string | null;
          generated_at?: string;
        };
        Update: {
          id?: string;
          tender_submission_id?: string;
          export_type?: string;
          filename?: string;
          mime_type?: string;
          file_size_bytes?: number;
          content_base64?: string;
          generated_by?: string | null;
          generated_at?: string;
        };
        Relationships: [];
      };
      smart_import_profiles: {
        Row: {
          id: string;
          profile_key: string;
          display_name: string;
          description: string | null;
          fingerprint: Json;
          column_mappings: Json;
          sheet_role_rules: Json;
          is_system: boolean;
          success_count: number;
          last_used_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_key: string;
          display_name: string;
          description?: string | null;
          fingerprint?: Json;
          column_mappings?: Json;
          sheet_role_rules?: Json;
          is_system?: boolean;
          success_count?: number;
          last_used_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_key?: string;
          display_name?: string;
          description?: string | null;
          fingerprint?: Json;
          column_mappings?: Json;
          sheet_role_rules?: Json;
          is_system?: boolean;
          success_count?: number;
          last_used_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      smart_import_jobs: {
        Row: {
          id: string;
          project_id: string | null;
          profile_id: string | null;
          status: string;
          original_filename: string;
          mime_type: string | null;
          file_size_bytes: number;
          content_base64: string;
          analysis: Json;
          validation_report: Json;
          resource_matches: Json;
          ai_findings: Json;
          reconciliation_report: Json;
          master_template_id: string | null;
          error_message: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          profile_id?: string | null;
          status?: string;
          original_filename: string;
          mime_type?: string | null;
          file_size_bytes?: number;
          content_base64: string;
          analysis?: Json;
          validation_report?: Json;
          resource_matches?: Json;
          ai_findings?: Json;
          reconciliation_report?: Json;
          master_template_id?: string | null;
          error_message?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          profile_id?: string | null;
          status?: string;
          original_filename?: string;
          mime_type?: string | null;
          file_size_bytes?: number;
          content_base64?: string;
          analysis?: Json;
          validation_report?: Json;
          resource_matches?: Json;
          ai_findings?: Json;
          reconciliation_report?: Json;
          master_template_id?: string | null;
          error_message?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      master_templates: {
        Row: {
          id: string;
          template_key: string;
          template_version: string;
          display_name: string;
          description: string | null;
          source_project_id: string | null;
          created_from_project_id: string | null;
          source_import_job_id: string | null;
          snapshot: Json;
          wbs_count: number;
          boq_count: number;
          resource_count: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_key: string;
          template_version?: string;
          display_name: string;
          description?: string | null;
          source_project_id?: string | null;
          created_from_project_id?: string | null;
          source_import_job_id?: string | null;
          snapshot?: Json;
          wbs_count?: number;
          boq_count?: number;
          resource_count?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_key?: string;
          template_version?: string;
          display_name?: string;
          description?: string | null;
          source_project_id?: string | null;
          created_from_project_id?: string | null;
          source_import_job_id?: string | null;
          snapshot?: Json;
          wbs_count?: number;
          boq_count?: number;
          resource_count?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      takeoff_drawings: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          original_filename: string;
          mime_type: string;
          file_size_bytes: number;
          content_base64: string;
          page_count: number;
          revision_label: string | null;
          notes: string | null;
          discipline: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          original_filename: string;
          mime_type?: string;
          file_size_bytes?: number;
          content_base64: string;
          page_count?: number;
          revision_label?: string | null;
          notes?: string | null;
          discipline?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          original_filename?: string;
          mime_type?: string;
          file_size_bytes?: number;
          content_base64?: string;
          page_count?: number;
          revision_label?: string | null;
          notes?: string | null;
          discipline?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_sheets: {
        Row: {
          id: string;
          drawing_id: string;
          project_id: string;
          sheet_index: number;
          sheet_name: string;
          discipline: string | null;
          rotation_degrees: number;
          pixels_per_meter: number | null;
          scales: Json;
          thumbnail_base64: string | null;
          sort_order: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          drawing_id: string;
          project_id: string;
          sheet_index: number;
          sheet_name: string;
          discipline?: string | null;
          rotation_degrees?: number;
          pixels_per_meter?: number | null;
          scales?: Json;
          thumbnail_base64?: string | null;
          sort_order?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          drawing_id?: string;
          project_id?: string;
          sheet_index?: number;
          sheet_name?: string;
          discipline?: string | null;
          rotation_degrees?: number;
          pixels_per_meter?: number | null;
          scales?: Json;
          thumbnail_base64?: string | null;
          sort_order?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_layers: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
          is_visible: boolean;
          is_locked: boolean;
          opacity: number;
          sort_order: number;
          is_system: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color?: string;
          is_visible?: boolean;
          is_locked?: boolean;
          opacity?: number;
          sort_order?: number;
          is_system?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color?: string;
          is_visible?: boolean;
          is_locked?: boolean;
          opacity?: number;
          sort_order?: number;
          is_system?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_items: {
        Row: {
          id: string;
          project_id: string;
          layer_id: string | null;
          name: string;
          unit: string;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          layer_id?: string | null;
          name: string;
          unit?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          layer_id?: string | null;
          name?: string;
          unit?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_measurements: {
        Row: {
          id: string;
          project_id: string;
          sheet_id: string;
          layer_id: string | null;
          takeoff_item_id: string | null;
          name: string | null;
          discipline: string | null;
          unit: string;
          preset_key: string | null;
          tool_type: string;
          color: string;
          geometry: Json;
          length_m: number | null;
          area_m2: number | null;
          count_value: number | null;
          text_content: string | null;
          notes: string | null;
          scale_id: string | null;
          pixels_per_meter: number | null;
          review_status: string;
          created_by: string | null;
          created_by_name: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          sheet_id: string;
          layer_id?: string | null;
          takeoff_item_id?: string | null;
          name?: string | null;
          discipline?: string | null;
          unit?: string;
          preset_key?: string | null;
          tool_type: string;
          color?: string;
          geometry?: Json;
          length_m?: number | null;
          area_m2?: number | null;
          count_value?: number | null;
          text_content?: string | null;
          notes?: string | null;
          scale_id?: string | null;
          pixels_per_meter?: number | null;
          review_status?: string;
          created_by?: string | null;
          created_by_name?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          sheet_id?: string;
          layer_id?: string | null;
          takeoff_item_id?: string | null;
          name?: string | null;
          discipline?: string | null;
          unit?: string;
          preset_key?: string | null;
          tool_type?: string;
          color?: string;
          geometry?: Json;
          length_m?: number | null;
          area_m2?: number | null;
          count_value?: number | null;
          text_content?: string | null;
          notes?: string | null;
          scale_id?: string | null;
          pixels_per_meter?: number | null;
          review_status?: string;
          created_by?: string | null;
          created_by_name?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_revision_clouds: {
        Row: {
          id: string;
          project_id: string;
          sheet_id: string;
          label: string | null;
          color: string;
          geometry: Json;
          notes: string | null;
          created_by: string | null;
          created_by_name: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          sheet_id: string;
          label?: string | null;
          color?: string;
          geometry?: Json;
          notes?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          sheet_id?: string;
          label?: string | null;
          color?: string;
          geometry?: Json;
          notes?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_comments: {
        Row: {
          id: string;
          project_id: string;
          sheet_id: string | null;
          measurement_id: string | null;
          parent_id: string | null;
          body: string;
          is_resolved: boolean;
          created_by: string | null;
          created_by_name: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          sheet_id?: string | null;
          measurement_id?: string | null;
          parent_id?: string | null;
          body: string;
          is_resolved?: boolean;
          created_by?: string | null;
          created_by_name?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          sheet_id?: string | null;
          measurement_id?: string | null;
          parent_id?: string | null;
          body?: string;
          is_resolved?: boolean;
          created_by?: string | null;
          created_by_name?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      takeoff_revision_history: {
        Row: {
          id: string;
          project_id: string;
          entity_type: string;
          entity_id: string | null;
          action: string;
          snapshot: Json;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          snapshot?: Json;
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          snapshot?: Json;
          actor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      is_admin_or_above: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      generate_project_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      owns_project: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      can_write_all_projects: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      sum_boq_total_amount: {
        Args: { p_project_id: string; p_wbs_id?: string | null };
        Returns: number;
      };
      bulk_soft_delete_wbs: {
        Args: { p_project_id: string; p_node_ids: string[] };
        Returns: Json;
      };
      can_edit_project_rate_library: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      import_company_resources_to_project: {
        Args: {
          p_project_id: string;
          p_company_item_ids: string[];
          p_actor_id?: string | null;
        };
        Returns: Json;
      };
      list_project_rate_library_stale: {
        Args: { p_project_id: string };
        Returns: Array<{
          project_item_id: string;
          source_company_item_id: string;
          code: string;
          description: string;
          category: RateLibraryCategory;
          project_unit_cost: number;
          company_unit_cost: number;
          source_unit_cost: number | null;
          company_updated_at: string;
          source_updated_at: string | null;
        }>;
      };
      sync_project_rate_library_from_company: {
        Args: {
          p_project_id: string;
          p_item_ids?: string[] | null;
          p_actor_id?: string | null;
        };
        Returns: Json;
      };
      boq_direct_totals_by_wbs: {
        Args: { p_project_id: string };
        Returns: Array<{ wbs_id: string; direct_total: number }>;
      };
      boq_category_totals: {
        Args: { p_project_id: string; p_wbs_id?: string | null };
        Returns: Array<{
          material_total: number;
          labor_total: number;
          equipment_total: number;
          subcontract_total: number;
          grand_total: number;
        }>;
      };
    };
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      measurement_system: MeasurementSystem;
      rounding_rule: RoundingRule;
      rate_library_category: RateLibraryCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
