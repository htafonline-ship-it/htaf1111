import { UserRole } from '../types';

export type DynamicBlockType = 
  | 'custom_fields_grid' 
  | 'announcement_banner' 
  | 'custom_form' 
  | 'data_table' 
  | 'quick_actions' 
  | 'rich_content' 
  | 'metric_progress' 
  | 'collapsible_accordion';

export type DynamicBlockPosition = 'top' | 'bottom' | 'banner' | 'sidebar_widget';

export type DynamicFieldType = 
  | 'text' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'date' 
  | 'checkbox' 
  | 'url' 
  | 'badge';

export interface CustomFieldItem {
  id: string;
  label: string;
  value: string | number | boolean;
  type: DynamicFieldType;
  options?: string[]; // For select type
  placeholder?: string;
  helpText?: string;
  iconName?: string;
  color?: string;
  isRequired?: boolean;
  isEditableByUser?: boolean;
}

export interface DynamicFormSubmission {
  id: string;
  blockId: string;
  pageId: string;
  submittedBy: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  submittedAt: string;
  data: Record<string, any>;
}

export interface DynamicTableRow {
  id: string;
  values: Record<string, string | number>;
}

export interface DynamicTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'badge' | 'link';
}

export interface QuickActionButtonItem {
  id: string;
  label: string;
  iconName?: string;
  actionType: 'navigate_tab' | 'open_url' | 'copy_text' | 'show_alert';
  actionValue: string;
  colorScheme?: string;
}

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  badge?: string;
}

export interface DynamicPageBlock {
  id: string;
  pageId: string; // e.g. 'dashboard', 'curriculum', 'smart-teacher', 'solver', 'messaging', 'school-mgmt', 'kharj-schools', 'counseling', 'profile', 'super_admin', 'all'
  title: string;
  subtitle?: string;
  type: DynamicBlockType;
  position: DynamicBlockPosition;
  order: number;
  isActive: boolean;
  visibleToRoles: UserRole[] | 'all';
  colorScheme: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'cyan';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  
  // Type-specific configuration data
  data: {
    // For custom_fields_grid & custom_form
    fields?: CustomFieldItem[];
    submitButtonLabel?: string;
    successMessage?: string;
    
    // For announcement_banner
    bannerType?: 'info' | 'success' | 'warning' | 'urgent';
    bannerMessage?: string;
    bannerIcon?: string;
    isDismissible?: boolean;
    
    // For data_table
    columns?: DynamicTableColumn[];
    rows?: DynamicTableRow[];
    
    // For quick_actions
    actions?: QuickActionButtonItem[];
    
    // For rich_content
    contentHtml?: string;
    notes?: string;
    
    // For metric_progress
    currentValue?: number;
    targetValue?: number;
    unit?: string;
    metricLabel?: string;
    
    // For collapsible_accordion
    accordionItems?: AccordionItem[];
  };
}

export interface DynamicPageConfig {
  pageId: string;
  pageTitle: string;
  blocks: DynamicPageBlock[];
}
