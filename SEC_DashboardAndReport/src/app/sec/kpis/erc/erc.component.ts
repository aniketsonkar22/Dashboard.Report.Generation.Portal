import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';
import { AddKpiDialogComponent } from '../../add-kpi-dialog/add-kpi-dialog.component';
import { ErcService } from 'src/app/services/erc-service';

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
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  DATE_RANGE = 'dateRange'
}

// KPI Filter Interface
interface KpiFilter {
  key: string;
  label: string;
  type: FilterType;
  options?: { value: string; label: string }[];
  dynamicField?: string;
  dateFields?: { from: string; to: string };
}

@Component({
  selector: 'app-erc',
  templateUrl: './erc.component.html',
  styleUrls: ['./erc.component.scss'],
  standalone: false
})
export class ErcComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  sectorOptions = [
    { value: '0', label: 'Northern' },
    { value: '1', label: 'Eastern' },
    { value: '2', label: 'Central' },
    { value: '3', label: 'Western' },
    { value: '4', label: 'Southern' }
  ];
  // Expose FilterType enum to template
  FilterType = FilterType;

  // ERC Configuration
  kpiLabel = 'External Requirements Closure';
  displayedColumns = ['date', 'sector', 'ext_Requirement_Type', 'total_Requirement', 'ext_Requirements', 'createdBy', 'actions'];
  apiEndpoint = '/api/v1/erc';
  editableFields = ['date', 'sector', 'ext_Requirement_Type', 'total_Requirement', 'ext_Requirements'];
  
  kpiFilters: KpiFilter[] = [
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
      dynamicField: 'ext_Requirement_Type',
      options: []
    }
  ];

  // Data source
  dataSource = new MatTableDataSource<BaseKpiItem>([]);

  // Dynamic filters
  filterValues: { [key: string]: any } = {};

  // Edit cache
  editCache: { [id: string]: any } = {};

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalCount = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // User info
  userName = '';

  // Loading state
  loading = false;
  initialLoad = true;

  // Add new record state
  isAddingNew = false;
  newRecordData: any = {};

  // Base URL
  private baseUrl = 'http://localhost:5069';

  constructor(
    private authService: AuthServiceAD,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private ercService: ErcService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.initializeFilters();
    this.fetchReports();
  }

  private loadUserInfo(): void {
    const userInfo: any = this.authService.userInfo?.valueOf();
    this.userName = userInfo?.data?.data?.name || '';
  }

  private initializeFilters(): void {
    this.filterValues = {};
    this.kpiFilters.forEach(filter => {
      if (filter.type === FilterType.DATE_RANGE && filter.dateFields) {
        this.filterValues[filter.dateFields.from] = null;
        this.filterValues[filter.dateFields.to] = null;
      } else {
        this.filterValues[filter.key] = '';
      }
    });
  }

  private populateDynamicFilters(data: any[]): void {
    if (data.length === 0) return;

    this.kpiFilters.forEach(filter => {
      if (filter.type === FilterType.DYNAMIC && filter.dynamicField) {
        const allValues = data
          .map(item => item[filter.dynamicField!])
          .filter(value => value != null && value !== '');

        const uniqueValues = Array.from(new Set(allValues));
        uniqueValues.sort();

        filter.options = [
          { value: '', label: `All ${filter.label}` },
          ...uniqueValues.map(val => ({ value: val, label: val }))
        ];

        console.log(`Populated ${filter.label} with ${uniqueValues.length} distinct values:`, uniqueValues);
      }
    });
  }

  fetchReports(): void {
    this.loading = true;
    const apiUrl = `${this.baseUrl}${this.apiEndpoint}`;
    
    const params: any = {
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    };

    if (!this.initialLoad) {
      Object.keys(this.filterValues).forEach(key => {
        const value = this.filterValues[key];
        
        if (value instanceof Date) {
          params[key] = value.toISOString();
        } else if (value !== '' && value !== null && value !== undefined) {
          params[key] = value;
        }
      });
    }

    console.log('Fetching reports with params:', params);

    this.ercService.getReports(params).subscribe({
      next: (response: any) => {
        let items: any[] = [];
        let totalCount = 0;

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

        if (this.initialLoad && items.length > 0) {
          this.populateDynamicFilters(items);
          this.initialLoad = false;
        }

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
        console.error(`Error fetching data from ${this.apiEndpoint}:`, err);
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
    this.pageIndex = 0;
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

  startEdit(item: BaseKpiItem): void {
    this.editCache[item.id] = { ...item };
    
    if (item.date) {
      this.editCache[item.id].date = new Date(item.date);
    }
    
    item.isEditing = true;
    this.cdr.detectChanges();
  }

  cancelEdit(item: BaseKpiItem): void {
    item.isEditing = false;
    delete this.editCache[item.id];
    this.cdr.detectChanges();
  }

  saveEdit(item: BaseKpiItem): void {
    if (!this.editCache[item.id]) return;

    const updatedValues = this.editCache[item.id];
    const updated: any = {};
    
    this.editableFields.forEach(field => {
      const currentValue = updatedValues[field];
      const originalValue = item[field];
      
      if (field === 'date') {
        let currentDate: string | null = null;
        let originalDate: string | null = null;
        
        if (currentValue instanceof Date) {
          const d = new Date(currentValue);
          d.setUTCHours(12, 0, 0, 0);
          currentDate = d.toISOString();
        } else if (currentValue) {
          currentDate = new Date(currentValue).toISOString();
        }
        
        if (originalValue instanceof Date) {
          originalDate = originalValue.toISOString();
        } else if (originalValue) {
          originalDate = new Date(originalValue).toISOString();
        }
        
        if (currentDate && currentDate !== originalDate) {
          updated[field] = currentDate;
        }
      } 
      else if (typeof originalValue === 'number' || field.includes('BCP') || field.includes('drill') || field.includes('Requirement') || field.includes('Actions')) {
        const numCurrent = Number(currentValue);
        const numOriginal = Number(originalValue);
        
        if (!isNaN(numCurrent) && numCurrent !== numOriginal) {
          updated[field] = numCurrent;
        }
      }
      else {
        if (currentValue !== originalValue && currentValue !== undefined && currentValue !== null && currentValue !== '') {
          updated[field] = currentValue;
        }
      }
    });

    if (Object.keys(updated).length === 0) {
      this.showNotification('No changes detected', 'info');
      this.cancelEdit(item);
      return;
    }

    const apiUrl = `${this.baseUrl}${this.apiEndpoint}/${item.id}`;
    
    console.log('Sending update:', updated);
    
    this.ercService.updateReport(item.id, updated).subscribe({
      next: (response) => {
        Object.keys(updated).forEach(key => {
          item[key] = updatedValues[key];
        });
        
        item.isEditing = false;
        delete this.editCache[item.id];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating KPI:', err);
        this.cancelEdit(item);
      }
    });
  }

  isEditing(item: BaseKpiItem): boolean {
    return item.isEditing || false;
  }

  downloadReports(): void {
    console.log('Download reports functionality');
  }

  startAddNew(): void {
    const dialogRef = this.dialog.open(AddKpiDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        kpiType: 'erc',
        kpiLabel: this.kpiLabel
      }
    });

    dialogRef.afterClosed().subscribe((payload: any) => {
      if (payload) {
        this.saveNewKpiRecord(payload);
      }
    });
  }

  private saveNewKpiRecord(payload: any): void {
    const apiUrl = `${this.baseUrl}${this.apiEndpoint}`;
    
    console.log('Creating new record:', payload);
    
    this.ercService.createReport(payload).subscribe({
      next: (response) => {
        this.showNotification('Record created successfully', 'success');
        this.fetchReports();
      },
      error: (err) => {
        console.error('Error creating record:', err);
        this.showNotification('Failed to create record', 'error');
      }
    });
  }

  cancelAddNew(): void {
    this.isAddingNew = false;
    this.newRecordData = {};
    this.cdr.detectChanges();
  }

  saveNewRecord(): void {
    const payload: any = {
      date: this.newRecordData.date instanceof Date 
        ? this.newRecordData.date.toISOString() 
        : new Date(this.newRecordData.date).toISOString(),
      sector: Number(this.newRecordData.sector),
      ext_Requirement_Type: this.newRecordData.ext_Requirement_Type,
      total_Requirement: Number(this.newRecordData.total_Requirement),
      ext_Requirements: Number(this.newRecordData.ext_Requirements)
    };

    if (!this.validateNewRecord(payload)) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    const apiUrl = `${this.baseUrl}${this.apiEndpoint}`;
    
    console.log('Creating new record:', payload);
    
    this.ercService.createReport(payload).subscribe({
      next: (response) => {
        this.showNotification('Record created successfully', 'success');
        this.isAddingNew = false;
        this.newRecordData = {};
        this.fetchReports();
      },
      error: (err) => {
        console.error('Error creating record:', err);
        this.showNotification('Failed to create record', 'error');
      }
    });
  }

  private validateNewRecord(payload: any): boolean {
    if (!payload.date || payload.sector === '' || payload.sector === null || payload.sector === undefined) {
      return false;
    }
    return !!(payload.ext_Requirement_Type);
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