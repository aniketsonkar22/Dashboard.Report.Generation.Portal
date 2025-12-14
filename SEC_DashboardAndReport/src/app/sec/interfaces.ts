// ============================================================================
// API INTERFACES - Based on Swagger Documentation
// ============================================================================

// Enums
export enum KpiType {
  All = 0,
  Numeric = 1,
  Percentage = 2
}

export enum Status {
  All = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

export enum UserRole {
  Admin = 2,
  DepartmentManager = 1,
  Contributor = 0
}

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface AddCommentRequest {
  text: string; // required, minLength: 1
}

export interface AssignKpiRequest {
  targetValue?: number;
  actualValue?: number;
  contributorDeadline?: string; // date-time
  managerDeadline?: string; // date-time
}

export interface CallbackRequest {
  code?: string;
  redirectUri?: string;
}

export interface CreateDepartmentRequest {
  name: string; // required, minLength: 1
}

export interface CreateKpiRequest {
  name: string; // required, minLength: 1
  // Backend expects the numeric code for the KPI type
  dataType: number; // required
  description: string; // required, minLength: 1
  targetValue?: number; // optional target value
}

export interface CreateUserRequest {
  name: string; // required, minLength: 1
  email: string; // required, minLength: 1
  role: UserRole; // required
  departmentId?: string; // optional UUID
}

export interface DepartmentKpiEditRequest {
  targetValue?: number;
  actualValue?: number;
}

export interface DepartmentKpiUnlockRequest {
  newDeadline: string; // date-time
}

export interface UpdateKpiRequest {
  name: string; // required, minLength: 1
  description?: string; // optional description
  targetValue?: number; // optional target value
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface Department {
  id: string; // UUID
  name: string;
  isActive: boolean;
  createdAt: string; // datetime2(3)
  createdBy?: string | null; // UUID
}

export interface KPI {
  id: string; // UUID
  name: string;
  dataType: KpiType;
  description: string;
  targetValue?: number;
  actualValue?: number;
  createdAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string; // UUID
  createdAt: string;
  createdBy?: string;
}

export interface DepartmentKpi {
  departmentId: string; // UUID
  kpiId: string; // UUID
  targetValue?: number;
  actualValue?: number;
  departmentName?: string;
  status: Status;
  contributorDeadline?: string; // date-time
  managerDeadline?: string; // date-time
  createdAt: string;
  createdBy?: string;
  // Lock state flags (optional, presence depends on API response)
  isLockedForContributor?: boolean;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface Comment {
  id: string; // UUID
  text: string;
  departmentId: string; // UUID
  kpiId: string; // UUID
  userId: string; // UUID
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string; // UUID
  action: string;
  entityType: string;
  entityId: string;
  userId: string; // UUID
  timestamp: string;
  details?: string;
}

// ============================================================================
// PAGINATION INTERFACES
// ============================================================================

export interface PaginationParams {
  pageNumber?: number; // default: 1
  pageSize?: number; // default: 10
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// LEGACY INTERFACES (Keep for backward compatibility)
// ============================================================================

export interface Report {
  title: string;
  author: string;
  editTime: string;
  timestamp: string;
  department: string;
  category: string;
  stages: { title: string; completed: boolean }[];
  status: string;
  actions: { icon: string; tooltip: string }[];
  type: reportType;
  referenceId?: number;
}

export type reportType = 'stage' | 'log' | 'comment';

export interface CommentItem {
  id?: number;
  commentText: string;
  status: string;
  userName: string;
  department: string;
  timestamp: string;
  reportType?: string;
  lineItem?: string;
  parentId?: number;
  replies?: CommentItem[];
  updatedAt: Date;
}

export interface Stage {
  id?: number;
  category: string;
  department: string;
  currentStage: string;
  nextStage?: string;
  timestamp?: string;
}

export interface Notification {
  id: any;
  message: string;
  type: string;
  reportType?: string;
  category?: string;
  roleId: string;
  referenceId?: number;
  departmentId?: string;
  kpiId?: string;
  commentId?: number;
  read: boolean;
  timestamp: string;
  updatedAt: Date;
}

// New notification interfaces based on actual API response
export interface UserNotification {
  notificationId: number;
  description: string;
  departmentId?: string;
  kpiId?: string;
  commentId?: number;
  actionType: string;
  userId: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationApiResponse {
  success: boolean;
  message: string;
  data: UserNotification[];
}


// ============================================================================
// DISTINCT VALUES (Keep for existing functionality)
// ============================================================================

export interface DistinctValues {
  costElements: string[];
  groups: string[];
  metrics: string[];
  reports: string[];
  activeStatus: string[];
  categories: string[];
}

export interface DistinctValuesReport {
  years: string[];
  opexClasses: string[];
  groups: string[];
}

