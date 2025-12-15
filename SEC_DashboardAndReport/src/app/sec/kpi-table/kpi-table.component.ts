import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';
import { CommentDialogComponent } from '../comments/comment-dialog/comment-dialog.component';
import { UnlockKpiDialogComponent } from '../admin/unlock-kpi-dialog/unlock-kpi-dialog.component';
import { RoleHelperService, AppRole } from '../../services/role-helper.service';
import { DepartmentKpiApiService, AssignKpiDeadlineRequest } from '../../services/department-kpi-api.service';
import { AddKpiDialogComponent } from '../add-kpi-dialog/add-kpi-dialog.component';

// Base interface for all KPI items
export interface BaseKpiItem {
  id: string;
  date?: string;
  sector?: string;
  createdBy?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  status?: string;
  isEditing?: boolean;
  [key: string]: any;
}

// Filter type enum
enum FilterType {
  STATIC = 'static',      // Predefined options
  DYNAMIC = 'dynamic',    // Extract from fetched data
  DATE_RANGE = 'dateRange' // Date range (from/to)
}

// KPI Filter Interface
interface KpiFilter {
  key: string;
  label: string;
  type: FilterType;
  options?: { value: string; label: string }[]; // For static filters
  dynamicField?: string; // Field name to extract distinct values from
  dateFields?: { from: string; to: string }; // For date range filters
}

// KPI Configuration Interface
interface KpiConfig {
  id: string;
  label: string;
  columns: string[];
  apiEndpoint: string;
  filters?: KpiFilter[];
  editableFields?: string[]; // Fields that can be edited
}

@Component({
  selector: 'app-kpi-table',
  templateUrl: './kpi-table.component.html',
  styleUrls: ['./kpi-table.component.scss'],
  standalone: false
})
export class KpiTableComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Expose FilterType enum to template
  FilterType = FilterType;

  // KPI Configurations
  private kpiConfigs: { [key: string]: KpiConfig } = {
    'bcp': {
      id: 'BCP',
      label: 'BCPs Review & Update for Corporate & BLs',
      columns: ['date', 'sector', 'type', 'bLs', 'bcPs_Reviewed', 'total_BCPs', 'createdBy', 'actions'],
      apiEndpoint: '/api/v1/bcp',
      editableFields: ['date', 'sector', 'type', 'bLs', 'bcPs_Reviewed', 'total_BCPs'],
      filters: [
        {
          key: 'dateRange',
          label: 'Date Range',
          type: FilterType.DATE_RANGE,
          dateFields: { from: 'dateFrom', to: 'dateTo' }
        },
        {
          key: 'sector',
          label: 'Sector',
          type: FilterType.STATIC,
          options: [
            { value: '', label: 'All Sectors' },
            { value: '0', label: 'Northern' },
            { value: '1', label: 'Eastern' },
            { value: '2', label: 'Central' },
            { value: '3', label: 'Western' },
            { value: '4', label: 'Southern' }
          ]
        },
        {
          key: 'type',
          label: 'Type',
          type: FilterType.DYNAMIC,
          dynamicField: 'type', // Field name in the API response
          options: [] // Will be populated from data
        },
        {
          key: 'bLs',
          label: 'BLs',
          type: FilterType.DYNAMIC,
          dynamicField: 'bLs', // Field name in the API response
          options: [] // Will be populated from data
        }
      ]
    },
    'dnt': {
      id: 'DnT',
      label: 'Drills & Tests Conducted',
      columns: ['date', 'sector', 'drillType', 'drillConducted', 'plannedDrills', 'correctiveActions', 'correctiveType', 'createdBy', 'actions'],
      apiEndpoint: '/api/v1/dnt',
      editableFields: ['date', 'sector', 'drillType', 'drillConducted', 'plannedDrills', 'correctiveActions', 'correctiveType'],
      filters: [
        {
          key: 'dateRange',
          label: 'Date Range',
          type: FilterType.DATE_RANGE,
          dateFields: { from: 'from', to: 'to' }
        },
        {
          key: 'sector',
          label: 'Sector',
          type: FilterType.STATIC,
          options: [
            { value: '', label: 'All Sectors' },
            { value: '0', label: 'Northern' },
            { value: '1', label: 'Eastern' },
            { value: '2', label: 'Central' },
            { value: '3', label: 'Western' },
            { value: '4', label: 'Southern' }
          ]
        },
        {
          key: 'drillType',
          label: 'Drill Type',
          type: FilterType.DYNAMIC,
          dynamicField: 'drillType', // Field name in the API response
          options: [] // Will be populated from data
        },
        {
          key: 'correctiveType',
          label: 'Corrective Type',
          type: FilterType.DYNAMIC,
          dynamicField: 'correctiveType', // Field name in the API response
          options: [] // Will be populated from data
        }
      ]
    },
    'erc': {
      id: 'ERC',
      label: 'External Requirements Closure',
      columns: ['date', 'sector', 'ext_Requirement_Type', 'total_Requirement', 'ext_Requirements', 'createdBy', 'actions'],
      apiEndpoint: '/api/v1/erc',
      editableFields: ['date', 'sector', 'ext_Requirement_Type', 'total_Requirement', 'ext_Requirements'],
      filters: [
        {
          key: 'dateRange',
          label: 'Date Range',
          type: FilterType.DATE_RANGE,
          dateFields: { from: 'from', to: 'to' }
        },
        {
          key: 'sector',
          label: 'Sector',
          type: FilterType.STATIC,
          options: [
            { value: '', label: 'All Sectors' },
            { value: '0', label: 'Northern' },
            { value: '1', label: 'Eastern' },
            { value: '2', label: 'Central' },
            { value: '3', label: 'Western' },
            { value: '4', label: 'Southern' }
          ]
        },
        {
          key: 'ext_Requirement_Type',
          label: 'Requirement Type',
          type: FilterType.DYNAMIC,
          dynamicField: 'ext_Requirement_Type', // Field name in the API response
          options: [] // Will be populated from data
        }
      ]
    }
  };

  // Current KPI Configuration
  currentKpiType: string = '';
  currentConfig: KpiConfig | null = null;

  // Data source and displayed columns
  dataSource = new MatTableDataSource<BaseKpiItem>([]);
  displayedColumns: string[] = [];

  // Dynamic filters based on KPI type
  filterValues: { [key: string]: any } = {};

  // Edit cache to store original values and track changes
  editCache: { [id: string]: any } = {};

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalCount = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // User info
  userName = '';
  userRole: AppRole = 'contributor';

  // Loading state
  loading = false;
  initialLoad = true; // Track if this is the first load

  // Add new record state
  isAddingNew = false;
  newRecordData: any = {};

  // Base URL (should be from environment)
  private baseUrl = 'http://localhost:5069';

  constructor(
    private authService: AuthServiceAD,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private departmentKpiApiService: DepartmentKpiApiService,
    private router: Router,
    private route: ActivatedRoute,
    private roleHelper: RoleHelperService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    
    // Subscribe to route params to detect KPI type changes
    this.route.params.subscribe(params => {
      const kpiType = params['type']; // 'bcp', 'dnt', or 'erc'
      if (kpiType && this.kpiConfigs[kpiType]) {
        this.currentKpiType = kpiType;
        this.currentConfig = this.kpiConfigs[kpiType];
        this.displayedColumns = this.currentConfig.columns;
        this.initializeFilters();
        this.initialLoad = true; // Reset initial load flag
        this.fetchReports();
      } else {
        // Invalid KPI type, redirect to default
        this.router.navigate(['/kpi/bcp']);
      }
    });
  }

  private loadUserInfo(): void {
    const userInfo: any = this.authService.userInfo?.valueOf();
    this.userName = userInfo?.data?.data?.name || '';
    this.userRole = this.roleHelper.getAppRole(userInfo);
  }

  private initializeFilters(): void {
    // Initialize filter values to empty
    this.filterValues = {};
    if (this.currentConfig?.filters) {
      this.currentConfig.filters.forEach(filter => {
        if (filter.type === FilterType.DATE_RANGE && filter.dateFields) {
          this.filterValues[filter.dateFields.from] = null;
          this.filterValues[filter.dateFields.to] = null;
        } else {
          this.filterValues[filter.key] = '';
        }
      });
    }
  }

  /**
   * Extract distinct values from data for dynamic filters
   * @param data Array of items from API response
   */
  private populateDynamicFilters(data: any[]): void {
    if (!this.currentConfig?.filters || data.length === 0) return;

    this.currentConfig.filters.forEach(filter => {
      if (filter.type === FilterType.DYNAMIC && filter.dynamicField) {
        // Extract all values for this field
        const allValues = data
          .map(item => item[filter.dynamicField!])
          .filter(value => value != null && value !== ''); // Remove null/empty values

        // Get unique values
        const uniqueValues = Array.from(new Set(allValues));

        // Sort alphabetically
        uniqueValues.sort();

        // Build options array
        filter.options = [
          { value: '', label: `All ${filter.label}` },
          ...uniqueValues.map(val => ({ value: val, label: val }))
        ];

        console.log(`Populated ${filter.label} with ${uniqueValues.length} distinct values:`, uniqueValues);
      }
    });
  }

  get kpiLabel(): string {
    return this.currentConfig?.label || '';
  }

  get kpiFilters(): KpiFilter[] {
    return this.currentConfig?.filters || [];
  }

  fetchReports(): void {
    if (!this.currentConfig) return;

    this.loading = true;
    const apiUrl = `${this.baseUrl}${this.currentConfig.apiEndpoint}`;
    
    // Build query parameters
    const params: any = {
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    };

    // Add filter values to params (only if NOT initial load for dynamic filters)
    if (!this.initialLoad) {
      Object.keys(this.filterValues).forEach(key => {
        const value = this.filterValues[key];
        
        // Handle date values - convert to ISO string
        if (value instanceof Date) {
          params[key] = value.toISOString();
        } else if (value !== '' && value !== null && value !== undefined) {
          params[key] = value;
        }
      });
    }

    console.log('Fetching reports with params:', params);

    this.http.get<any>(apiUrl, { params, withCredentials: true }).subscribe({
      next: (response: any) => {
        let items: any[] = [];
        let totalCount = 0;

        // Handle different response formats
        if (response?.success && response?.data) {
          items = Array.isArray(response.data) ? response.data : (response.data.items || []);
          totalCount = response.data.totalCount || items.length;
        } else if (Array.isArray(response)) {
          items = response;
          totalCount = response.length;
        } else if (response?.items) {
          items = response.items;
          totalCount = response.totalCount || items.length;
        }

        // If this is the initial load, populate dynamic filters from the response data
        if (this.initialLoad && items.length > 0) {
          this.populateDynamicFilters(items);
          this.initialLoad = false; // Mark initial load as complete
        }

        // Map data to BaseKpiItem
        const tableData: BaseKpiItem[] = items.map(item => ({
          ...item,
          isEditing: false
        }));

        this.dataSource.data = tableData;
        this.totalCount = totalCount;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error fetching data from ${this.currentConfig?.apiEndpoint}:`, err);
        this.dataSource.data = [];
        this.totalCount = 0;
        this.loading = false;
        this.initialLoad = false;
        this.showNotification('Error loading data', 'error');
      }
    });
  }

  onFilterChange(filterKey: string): void {
    console.log(`Filter changed: ${filterKey} = ${this.filterValues[filterKey]}`);
    this.pageIndex = 0; // Reset to first page when filter changes
    this.fetchReports();
  }

  onDateRangeChange(): void {
    console.log('Date range changed:', this.filterValues);
    this.pageIndex = 0;
    this.fetchReports();
  }

  clearFilters(): void {
    this.initializeFilters();
    this.pageIndex = 0;
    this.fetchReports();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.fetchReports();
  }

  // Edit functionality
  startEdit(item: BaseKpiItem): void {
    // Create a deep copy of the item for editing
    this.editCache[item.id] = { ...item };
    
    // Handle date conversion for datepicker
    if (item.date) {
      this.editCache[item.id].date = new Date(item.date);
    }
    
    item.isEditing = true;
    this.cdr.detectChanges();
  }

  cancelEdit(item: BaseKpiItem): void {
    // Simply exit edit mode, don't restore values as we're editing editCache
    item.isEditing = false;
    delete this.editCache[item.id];
    this.cdr.detectChanges();
  }

  saveEdit(item: BaseKpiItem): void {
    if (!this.currentConfig || !this.editCache[item.id]) return;

    const updatedValues = this.editCache[item.id];
    const updated: any = {};
    
    // Compare values and build update payload with only changed fields
    const editableFields = this.currentConfig.editableFields || [];
    
    editableFields.forEach(field => {
      const currentValue = updatedValues[field];
      const originalValue = item[field];
      
      // Special handling for date
      if (field === 'date') {
        let currentDate: string | null = null;
        let originalDate: string | null = null;
        
        // Convert current value to ISO string at noon UTC to avoid timezone issues
        if (currentValue instanceof Date) {
          const d = new Date(currentValue);
          d.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid date shift
          currentDate = d.toISOString();
        } else if (currentValue) {
          currentDate = new Date(currentValue).toISOString();
        }
        
        // Convert original value to ISO string
        if (originalValue instanceof Date) {
          originalDate = originalValue.toISOString();
        } else if (originalValue) {
          originalDate = new Date(originalValue).toISOString();
        }
        
        if (currentDate && currentDate !== originalDate) {
          updated[field] = currentDate;
        }
      } 
      // Handle numeric fields
      else if (typeof originalValue === 'number' || field === 'sector' || field.includes('BCP') || field.includes('drill') || field.includes('Requirement') || field.includes('Actions')) {
        const numCurrent = Number(currentValue);
        const numOriginal = Number(originalValue);
        
        if (!isNaN(numCurrent) && numCurrent !== numOriginal) {
          updated[field] = numCurrent;
        }
      }
      // Handle string fields
      else {
        if (currentValue !== originalValue && currentValue !== undefined && currentValue !== null && currentValue !== '') {
          updated[field] = currentValue;
        }
      }
    });

    // If no changes, just exit edit mode
    if (Object.keys(updated).length === 0) {
      this.showNotification('No changes detected', 'info');
      this.cancelEdit(item);
      return;
    }

    // Make PUT request
    const apiUrl = `${this.baseUrl}${this.currentConfig.apiEndpoint}/${item.id}`;
    
    console.log('Sending update:', updated);
    
    this.http.put<any>(apiUrl, updated, { withCredentials: true }).subscribe({
      next: (response) => {
        // Update the item in the data source with new values
        Object.keys(updated).forEach(key => {
          item[key] = updatedValues[key];
        });
        
        item.isEditing = false;
        delete this.editCache[item.id];
        
        this.showNotification('KPI updated successfully', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating KPI:', err);
        this.showNotification('Failed to update KPI', 'error');
        // Just exit edit mode on error
        this.cancelEdit(item);
      }
    });
  }

  isEditing(item: BaseKpiItem): boolean {
    return item.isEditing || false;
  }

  addComment(kpi: BaseKpiItem): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: {
        userName: this.userName,
        department: kpi.sector || 'N/A',
        reportType: 'KPI',
        kpiName: this.currentConfig?.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.commentText) {
        console.log('Comment added:', result.commentText);
      }
    });
  }

  approveKpi(kpi: BaseKpiItem): void {
    console.log('Approve KPI:', kpi);
    // Implement approval logic
  }

  rejectKpi(kpi: BaseKpiItem): void {
    console.log('Reject KPI:', kpi);
    // Implement rejection logic
  }

  unlockKpi(kpi: BaseKpiItem): void {
    const dialogRef = this.dialog.open(UnlockKpiDialogComponent, {
      width: '500px',
      data: { 
        kpiName: this.currentConfig?.id,
        kpiId: kpi.id
      }
    });

    dialogRef.afterClosed().subscribe((result: AssignKpiDeadlineRequest) => {
      if (result?.contributorDeadline) {
        console.log('Deadlines assigned:', result);
      }
    });
  }

  viewHistory(kpi: BaseKpiItem): void {
    this.router.navigate(['/kpi-history', this.currentConfig?.id, kpi.id]);
  }

  downloadReports(): void {
    console.log('Download reports functionality');
    // Implement download logic
  }

  // Add new record functionality
  startAddNew(): void {
  if (!this.currentConfig) return;

  // Open the dialog
  const dialogRef = this.dialog.open(AddKpiDialogComponent, {
    width: '500px',
    disableClose: false, // Allow closing by clicking outside
    data: {
      kpiType: this.currentKpiType,
      kpiLabel: this.currentConfig.label
    }
  });

  // Handle dialog close
  dialogRef.afterClosed().subscribe((payload: any) => {
    if (payload) {
      // User clicked Save - make the API call
      this.saveNewKpiRecord(payload);
    }
    // If payload is null/undefined, user clicked Cancel or closed dialog
  });
}

// Add this new method to handle the API call:
private saveNewKpiRecord(payload: any): void {
  if (!this.currentConfig) return;

  const apiUrl = `${this.baseUrl}${this.currentConfig.apiEndpoint}`;
  
  console.log('Creating new record:', payload);
  
  this.http.post<any>(apiUrl, payload, { withCredentials: true }).subscribe({
    next: (response) => {
      this.showNotification('Record created successfully', 'success');
      
      // Refresh the table to show the new record
      this.fetchReports();
    },
    error: (err) => {
      console.error('Error creating record:', err);
      this.showNotification('Failed to create record', 'error');
    }
  });
}
  private initializeNewRecord(): any {
    const record: any = {
      date: new Date(),
      sector: ''
    };

    // Initialize fields based on KPI type
    if (this.currentKpiType === 'bcp') {
      record.type = '';
      record.bLs = '';
      record.bcPs_Reviewed = 0;
      record.total_BCPs = 0;
    } else if (this.currentKpiType === 'dnt') {
      record.drillType = '';
      record.drillConducted = 0;
      record.plannedDrills = 0;
      record.correctiveActions = 0;
      record.correctiveType = '';
    } else if (this.currentKpiType === 'erc') {
      record.ext_Requirement_Type = '';
      record.total_Requirement = 0;
      record.ext_Requirements = 0;
    }

    return record;
  }

  cancelAddNew(): void {
    this.isAddingNew = false;
    this.newRecordData = {};
    this.cdr.detectChanges();
  }

  saveNewRecord(): void {
    if (!this.currentConfig) return;

    // Build the request payload based on KPI type
    const payload: any = {
      date: this.newRecordData.date instanceof Date 
        ? this.newRecordData.date.toISOString() 
        : new Date(this.newRecordData.date).toISOString(),
      sector: Number(this.newRecordData.sector)
    };

    // Add type-specific fields
    if (this.currentKpiType === 'bcp') {
      payload.type = this.newRecordData.type;
      payload.bl = this.newRecordData.bLs; // Note: API uses 'bl' but display uses 'bLs'
      payload.bcPs_Reviewed = Number(this.newRecordData.bcPs_Reviewed);
      payload.total_BCPs = Number(this.newRecordData.total_BCPs);
    } else if (this.currentKpiType === 'dnt') {
      payload.drillType = this.newRecordData.drillType;
      payload.drillConducted = Number(this.newRecordData.drillConducted);
      payload.plannedDrills = Number(this.newRecordData.plannedDrills);
      payload.correctiveActions = Number(this.newRecordData.correctiveActions);
      payload.correctiveType = this.newRecordData.correctiveType;
    } else if (this.currentKpiType === 'erc') {
      payload.ext_Requirement_Type = this.newRecordData.ext_Requirement_Type;
      payload.total_Requirement = Number(this.newRecordData.total_Requirement);
      payload.ext_Requirements = Number(this.newRecordData.ext_Requirements);
    }

    // Validate required fields
    if (!this.validateNewRecord(payload)) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Make POST request
    const apiUrl = `${this.baseUrl}${this.currentConfig.apiEndpoint}`;
    
    console.log('Creating new record:', payload);
    
    this.http.post<any>(apiUrl, payload, { withCredentials: true }).subscribe({
      next: (response) => {
        this.showNotification('Record created successfully', 'success');
        this.isAddingNew = false;
        this.newRecordData = {};
        
        // Refresh the table
        this.fetchReports();
      },
      error: (err) => {
        console.error('Error creating record:', err);
        this.showNotification('Failed to create record', 'error');
      }
    });
  }

  private validateNewRecord(payload: any): boolean {
    // Check required fields
    if (!payload.date || payload.sector === '' || payload.sector === null || payload.sector === undefined) {
      return false;
    }

    // Type-specific validation
    if (this.currentKpiType === 'bcp') {
      return !!(payload.type && payload.bl);
    } else if (this.currentKpiType === 'dnt') {
      return !!(payload.drillType && payload.correctiveType);
    } else if (this.currentKpiType === 'erc') {
      return !!(payload.ext_Requirement_Type);
    }

    return false;
  }

  isPast(dateTime?: string): boolean {
    if (!dateTime) return false;
    const d = new Date(dateTime);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}