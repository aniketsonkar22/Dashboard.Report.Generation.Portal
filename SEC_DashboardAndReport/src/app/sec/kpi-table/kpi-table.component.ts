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

// KPI Configuration Interface
interface KpiConfig {
  id: string;
  label: string;
  columns: string[];
  apiEndpoint: string;
  filters?: KpiFilter[];
  editableFields?: string[]; // Fields that can be edited
}

interface KpiFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

@Component({
  selector: 'app-kpi-table',
  templateUrl: './kpi-table.component.html',
  styleUrls: ['./kpi-table.component.scss'],
  standalone: false
})
export class KpiTableComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // KPI Configurations
  private kpiConfigs: { [key: string]: KpiConfig } = {
    'bcp': {
      id: 'BCP',
      label: 'BCPs Review & Update for Corporate & BLs',
      columns: ['date', 'sector', 'type', 'bLs', 'bcPs_Reviewed', 'total_BCPs', 'createdBy', 'actions'],
      apiEndpoint: '/api/v1/bcp',
      editableFields: ['date', 'sector', 'type', 'bl', 'bcPs_Reviewed', 'total_BCPs'],
      filters: [
        {
          key: 'type',
          label: 'Type',
          options: [
            { value: '', label: 'All Types' },
            { value: 'Corporate', label: 'Corporate' },
            { value: 'BL1', label: 'BL1' },
            { value: 'BL2', label: 'BL2' }
          ]
        },
        {
          key: 'bLs',
          label: 'BLs',
          options: [
            { value: '', label: 'All BLs' },
            { value: 'BL1', label: 'BL1' },
            { value: 'BL2', label: 'BL2' },
            { value: 'BL3', label: 'BL3' }
          ]
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
          key: 'drillType',
          label: 'Drill Type',
          options: [
            { value: '', label: 'All Drill Types' },
            { value: 'Fire Drill', label: 'Fire Drill' },
            { value: 'Evacuation', label: 'Evacuation' },
            { value: 'IT Disaster Recovery', label: 'IT Disaster Recovery' },
            { value: 'Tabletop Exercise', label: 'Tabletop Exercise' }
          ]
        },
        {
          key: 'correctiveType',
          label: 'Corrective Type',
          options: [
            { value: '', label: 'All Corrective Types' },
            { value: 'Preventive', label: 'Preventive' },
            { value: 'Corrective', label: 'Corrective' },
            { value: 'Detective', label: 'Detective' }
          ]
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
          key: 'ext_Requirement_Type',
          label: 'Requirement Type',
          options: [
            { value: '', label: 'All Requirement Types' },
            { value: 'Regulatory', label: 'Regulatory' },
            { value: 'Compliance', label: 'Compliance' },
            { value: 'Audit', label: 'Audit' },
            { value: 'Legal', label: 'Legal' }
          ]
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
  filterValues: { [key: string]: string } = {};

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
        this.filterValues[filter.key] = '';
      });
    }
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
    
    // Build query parameters with pagination and filters
    const params: any = {
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize,
      ...this.filterValues // Spread filter values
    };

    // Remove empty filter values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

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
        this.showNotification('Error loading data', 'error');
      }
    });
  }

  onFilterChange(filterKey: string): void {
    console.log(`Filter changed: ${filterKey} = ${this.filterValues[filterKey]}`);
    this.pageIndex = 0; // Reset to first page when filter changes
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

  // Edit functionality - FIXED
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
        console.log("Updated Date - ", item[field]);
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

        console.log("Current Date - ", currentDate);
        console.log("Original Date - ", originalDate);
        
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