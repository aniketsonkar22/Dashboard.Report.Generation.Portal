import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';
import { KpiApiService } from '../../services/kpi-api.service';
import { DepartmentKpiApiService, AssignKpiDeadlineRequest } from '../../services/department-kpi-api.service';
import { CommentDialogComponent } from '../comments/comment-dialog/comment-dialog.component';
import { UnlockKpiDialogComponent } from '../admin/unlock-kpi-dialog/unlock-kpi-dialog.component';
import { KpiType } from '../interfaces';
import { RoleHelperService, AppRole } from '../../services/role-helper.service';

// Base interface for common properties
export interface BaseKpiItem {
  id: string;
  date?: string;
  sector?: string;
  createdBy?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  status?: string;
  isEditing?: boolean;
  [key: string]: any; // Allow dynamic properties
}

// BCP specific interface
export interface BCPTableItem extends BaseKpiItem {
  type: string;
  bLs: string;
  bcPs_Reviewed: number;
  total_BCPs: number;
}

// DnT specific interface
export interface DnTTableItem extends BaseKpiItem {
  drillType: string;
  drillConducted: number;
  plannedDrills: number;
  correctiveActions: number;
  correctiveType: string;
}

// ERC specific interface
export interface ERCTableItem extends BaseKpiItem {
  ext_Requirement_Type: string;
  total_Requirement: number;
  ext_Requirements: number;
}

// Union type for all KPI items
export type KpiTableItem = BCPTableItem | DnTTableItem | ERCTableItem | BaseKpiItem;

// Column configuration for different KPI types
interface KpiColumnConfig {
  id: string;
  label: string;
  columns: string[];
  apiEndpoint: string;
  dataMapper?: (data: any) => KpiTableItem;
}

@Component({
  selector: 'app-kpi-table',
  templateUrl: './kpi-table.component.html',
  styleUrls: ['./kpi-table.component.scss'],
  standalone: false
})
export class KpiTableComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // KPI Type Configurations with actual column names from API
  kpiTypeConfigs: KpiColumnConfig[] = [
    {
      id: 'BCP',
      label: 'BCPs Review & Update for Corporate & BLs',
      columns: ['date', 'sector', 'type', 'bLs', 'bcPs_Reviewed', 'total_BCPs', 'createdBy'],
      apiEndpoint: '/api/v1/bcp',
      dataMapper: (data: any) => this.mapBcpData(data)
    },
    {
      id: 'DnT',
      label: 'Drills & Tests Conducted',
      columns: ['date', 'sector', 'drillType', 'drillConducted', 'plannedDrills', 'correctiveActions', 'correctiveType', 'createdBy'],
      apiEndpoint: '/api/v1/dnt',
      dataMapper: (data: any) => this.mapDntData(data)
    },
    {
      id: 'ERC',
      label: 'External Requirements Closure',
      columns: ['date', 'sector', 'ext_Requirement_Type', 'total_Requirement', 'ext_Requirements', 'createdBy'],
      apiEndpoint: '/api/v1/erc',
      dataMapper: (data: any) => this.mapErcData(data)
    }
  ];

  // Data source and displayed columns
  dataSource = new MatTableDataSource<KpiTableItem>([]);
  displayedColumns: string[] = [];

  // Filter properties
  selectedKpiTypeId: string = '';
  dataTypeFilter: KpiType | '' = KpiType.All;
  selectedStatus: number = 0;

  kpiTypeOptions: { value: KpiType; label: string }[] = [
    { value: KpiType.All, label: 'All' },
    { value: KpiType.Numeric, label: 'Numeric' },
    { value: KpiType.Percentage, label: 'Percentage' }
  ];
  statusOptions: { value: number; label: string }[] = [
    { value: 0, label: 'All' },
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Approved' },
    { value: 3, label: 'Rejected' }
  ];

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

  // Inline editing
  editingItem: KpiTableItem | null = null;
  editValue: number | null = null;

  constructor(
    private authService: AuthServiceAD,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private kpiApiService: KpiApiService,
    private departmentKpiApiService: DepartmentKpiApiService,
    private router: Router,
    private roleHelper: RoleHelperService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    // Auto-select first KPI type if available
    if (this.kpiTypeConfigs.length > 0) {
      this.selectedKpiTypeId = this.kpiTypeConfigs[0].id;
      this.onKpiTypeChange();
    }
  }

  private loadUserInfo(): void {
    const userInfo: any = this.authService.userInfo?.valueOf();
    this.userName = userInfo?.data?.data?.name || '';
    this.userRole = this.roleHelper.getAppRole(userInfo);
  }

  onKpiTypeChange(): void {
    console.log("Selected KPI -> ", this.selectedKpiTypeId);
    // Update displayed columns based on selected KPI type
    const config = this.kpiTypeConfigs.find(c => c.id === this.selectedKpiTypeId);
    if (config) {
      this.displayedColumns = config.columns;
    } else {
      // Default columns
      this.displayedColumns = ['date', 'sector', 'createdBy'];
    }
    this.fetchReports();
  }

  fetchReports(): void {
    if (!this.selectedKpiTypeId) {
      this.dataSource.data = [];
      this.totalCount = 0;
      return;
    }

    this.loading = true;
    
    // Find the configuration for the selected KPI type
    const config = this.kpiTypeConfigs.find(c => c.id === this.selectedKpiTypeId);
    
    if (config?.apiEndpoint) {
      // Use custom API endpoint for this KPI type
      this.fetchFromCustomApi(config);
    } else {
      // Fallback to default API
      this.fetchFromDefaultApi();
    }
  }

  get selectedKpiLabel(): string {
  const selected = this.kpiTypeConfigs.find(c => c.id === this.selectedKpiTypeId);
  return selected ? selected.label : '';
}

  private fetchFromCustomApi(config: KpiColumnConfig): void {
    // Build the API URL based on configuration
    const baseUrl = 'http://localhost:5069'; // Replace with your actual base URL or inject from environment
    const apiUrl = `${baseUrl}${config.apiEndpoint}`;
    
    // Build query parameters
    const params: any = {
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    };

    // Make HTTP call to custom endpoint
    this.http.get<any>(apiUrl, { params, withCredentials: true }).subscribe({
      next: (response: any) => {
        let items: any[] = [];
        let totalCount = 0;

        console.log('API Response:', response);

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

        console.log('Extracted items:', items);

        // Map data using custom mapper if provided
        const tableData: KpiTableItem[] = items.map(item => {
          if (config.dataMapper) {
            return config.dataMapper(item);
          }
          // Default mapping if no custom mapper
          return item as BaseKpiItem;
        });

        console.log('Mapped table data:', tableData);

        this.dataSource.data = tableData;
        this.totalCount = totalCount;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error fetching data from ${config.apiEndpoint}:`, err);
        this.dataSource.data = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }

  private fetchFromDefaultApi(): void {
    // This is kept as fallback if needed
    console.log('Using default API fallback');
    this.dataSource.data = [];
    this.totalCount = 0;
    this.loading = false;
  }

  // Custom data mappers for different KPI types
  private mapBcpData(data: any): BCPTableItem {
    return {
      id: data.id,
      date: data.date,
      sector: data.sector,
      type: data.type,
      bLs: data.bLs,
      bcPs_Reviewed: data.bcPs_Reviewed,
      total_BCPs: data.total_BCPs,
      createdBy: data.createdBy,
      isEditing: false
    };
  }

  private mapDntData(data: any): DnTTableItem {
    return {
      id: data.id,
      date: data.date,
      sector: data.sector,
      drillType: data.drillType,
      drillConducted: data.drillConducted,
      plannedDrills: data.plannedDrills,
      correctiveActions: data.correctiveActions,
      correctiveType: data.correctiveType,
      createdBy: data.createdBy,
      isEditing: false
    };
  }

  private mapErcData(data: any): ERCTableItem {
    return {
      id: data.id,
      date: data.date,
      sector: data.sector,
      ext_Requirement_Type: data.ext_Requirement_Type,
      total_Requirement: data.total_Requirement,
      ext_Requirements: data.ext_Requirements,
      createdBy: data.createdBy,
      isEditing: false
    };
  }

  clearFilters(): void {
    this.selectedKpiTypeId = this.kpiTypeConfigs.length > 0 ? this.kpiTypeConfigs[0].id : '';
    this.dataTypeFilter = KpiType.All;
    this.selectedStatus = 0;
    this.onKpiTypeChange();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.fetchReports();
  }

  getDataTypeLabel(dataType: KpiType): string {
    switch (dataType) {
      case KpiType.Numeric: return 'Numeric';
      case KpiType.Percentage: return 'Percentage';
      default: return 'Unknown';
    }
  }

  getDataTypeEnum(dataType: string): KpiType {
    switch (dataType) {
      case 'Numeric': return KpiType.Numeric;
      case 'Percentage': return KpiType.Percentage;
      default: return KpiType.Numeric;
    }
  }

  // Action methods
  startEdit(item: KpiTableItem): void {
    this.editingItem = item;
    this.editValue = 0;
    item.isEditing = true;
  }

  cancelEdit(item: KpiTableItem): void {
    this.editingItem = null;
    this.editValue = null;
    item.isEditing = false;
  }

  saveEdit(item: KpiTableItem): void {
    if (this.editingItem && this.editValue !== null) {
      // Implement save logic based on KPI type
      console.log('Saving edit for:', item);
      this.editingItem = null;
      this.editValue = null;
      item.isEditing = false;
    }
  }

  isEditing(item: KpiTableItem): boolean {
    return item.isEditing || false;
  }

  addComment(kpi: KpiTableItem): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: {
        userName: this.userName,
        department: (kpi as any).sector || 'N/A',
        reportType: 'KPI',
        kpiName: this.selectedKpiTypeId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.commentText) {
        console.log('Comment added:', result.commentText);
      }
    });
  }

  approveKpi(kpi: KpiTableItem): void {
    console.log('Approve KPI:', kpi);
    // Implement approval logic
  }

  rejectKpi(kpi: KpiTableItem): void {
    console.log('Reject KPI:', kpi);
    // Implement rejection logic
  }

  unlockKpi(kpi: KpiTableItem): void {
    const dialogRef = this.dialog.open(UnlockKpiDialogComponent, {
      width: '500px',
      data: { 
        kpiName: this.selectedKpiTypeId,
        kpiId: kpi.id
      }
    });

    dialogRef.afterClosed().subscribe((result: AssignKpiDeadlineRequest) => {
      if (result?.contributorDeadline) {
        console.log('Deadlines assigned:', result);
      }
    });
  }

  viewHistory(kpi: KpiTableItem): void {
    this.router.navigate(['/kpi-history', this.selectedKpiTypeId, kpi.id]);
  }

  downloadReports(): void {
    console.log('Download reports functionality');
  }

  isPast(dateTime?: string): boolean {
    if (!dateTime) return false;
    const d = new Date(dateTime);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  // Helper method to format date for display
  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}