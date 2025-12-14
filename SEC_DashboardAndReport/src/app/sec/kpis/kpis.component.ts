import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { KPI, KpiType, DepartmentKpi } from '../interfaces';
import { KpiApiService } from '../../services/kpi-api.service';
import { DepartmentKpiApiService } from '../../services/department-kpi-api.service';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';
import { MatDialog } from '@angular/material/dialog';
import { KpiEditDialogComponent } from '../admin/kpi-edit-dialog/kpi-edit-dialog.component';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-kpis',
  templateUrl: './kpis.component.html',
  styleUrls: ['./kpis.component.scss'],
    standalone: false
})
export class KpisComponent implements OnInit, AfterViewInit {
  // KPI data
  kpis: KPI[] = [];
  dataSource = new MatTableDataSource<KPI>();
  //department id
  departmentId = '';
  // Pagination
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // ViewChild references
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Filters
  filters = {
    name: '',
    dataType: '',
    status: ''
  };
  
  // Filter options
  dataTypeOptions = [
    { value: '', label: 'All Data Types' },
    { value: '0', label: 'Financial' },
    { value: '1', label: 'Customer' },
    { value: '2', label: 'Operational' },
    { value: '3', label: 'Strategic' }
  ];
  
  // User info
  userName = '';
  userRole = '';
  
  // Loading state
  loading = false;

  // Inline editing
  editingItem: KPI | null = null;
  editValue: number | null = null;
  
  constructor(
    private kpiApiService: KpiApiService,
    private departmentKpiApiService: DepartmentKpiApiService,
    private authService: AuthServiceAD,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    console.log('KpisComponent initialized with pageSize:', this.pageSize);
    this.route.queryParams.subscribe((params) => {
      this.departmentId = params['departmentId'];
      console.log('Department ID:', this.departmentId);
    });
  }

  ngOnInit() {
    // Get user info
    const userInfo: any = this.authService.userInfo?.valueOf();
    this.userName = userInfo.data.name;
    this.userRole = userInfo.data.role;
    
    console.log('Component initialized with pageSize:', this.pageSize);
    console.log('Page size options:', this.pageSizeOptions);
    
    // Load KPIs
    this.loadKpis();
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    console.log('Sort exists:', !!this.sort);
    console.log('Paginator exists:', !!this.paginator);
    
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    
    // Ensure paginator is properly initialized
    if (this.paginator) {
      console.log('Paginator initialized:', this.paginator);
      console.log('Paginator pageSize:', this.paginator.pageSize);
      console.log('Paginator pageIndex:', this.paginator.pageIndex);
      console.log('Paginator pageSizeOptions:', this.paginator.pageSizeOptions);
      console.log('Paginator hidePageSize:', this.paginator.hidePageSize);
    } else {
      console.error('Paginator not found!');
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }
  // Load KPIs from API
  loadKpis(): void {
    this.loading = true;
    console.log('Loading KPIs with pagination:', {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      pageNumber: this.pageIndex + 1,
      departmentId: this.departmentId
    });

    // If a department is selected, use department-scoped KPIs
    if (this.departmentId && this.departmentId.trim().length > 0) {
      this.departmentKpiApiService
        .getDepartmentKpis(
          this.departmentId,
          undefined,
          this.pageIndex + 1,
          this.pageSize
        )
        .subscribe({
          next: (deptKpisResponse: any) => {
            console.log('Department KPIs response:', deptKpisResponse);
            let deptKpis: DepartmentKpi[] = [];
            let totalCount = 0;

            if (deptKpisResponse && deptKpisResponse.success && deptKpisResponse.data) {
              deptKpis = Array.isArray(deptKpisResponse.data)
                ? deptKpisResponse.data
                : (deptKpisResponse.data.items || []);
              totalCount = deptKpisResponse.data.totalCount || deptKpis.length;
            } else if (deptKpisResponse && deptKpisResponse.data) {
              deptKpis = Array.isArray(deptKpisResponse.data)
                ? deptKpisResponse.data
                : (deptKpisResponse.data.items || []);
              totalCount = deptKpisResponse.data.totalCount || deptKpis.length;
            } else if (Array.isArray(deptKpisResponse)) {
              deptKpis = deptKpisResponse;
              totalCount = deptKpisResponse.length;
            }

            const kpiIds = deptKpis.map(k => k.kpiId);
            // Fetch KPI details and join by kpiId
            this.kpiApiService.getKpis({ pageNumber: 1, pageSize: 1000 }).subscribe({
              next: (allKpisResponse: any) => {
                let allKpis: KPI[] = [];
                if (allKpisResponse && allKpisResponse.success && allKpisResponse.data) {
                  allKpis = Array.isArray(allKpisResponse.data)
                    ? allKpisResponse.data as KPI[]
                    : (allKpisResponse.data.items || []);
                } else if (Array.isArray(allKpisResponse)) {
                  allKpis = allKpisResponse as KPI[];
                }

                const kpiById = new Map<string, KPI>(allKpis.map(k => [k.id, k]));
                const rows: KPI[] = kpiIds
                  .map(id => kpiById.get(id))
                  .filter((kpi): kpi is KPI => !!kpi);

                this.dataSource.data = rows;
                this.totalCount = totalCount;
                this.loading = false;
                setTimeout(() => this.syncPaginatorState(), 100);
              },
              error: err => {
                console.error('Error fetching KPI details:', err);
                this.dataSource.data = [];
                this.totalCount = 0;
                this.loading = false;
              }
            });
          },
          error: (error) => {
            console.error('Error loading department KPIs:', error);
            this.dataSource.data = [];
            this.totalCount = 0;
            this.loading = false;
          }
        });
      return;
    }

    // Fallback: load all KPIs
    this.kpiApiService
      .getKpis({ pageNumber: this.pageIndex + 1, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          console.log('KPIs loaded:', response);

          if (response && response.success && response.data) {
            this.dataSource.data = response.data.items;
            this.totalCount = response.data.totalCount || response.data.items.length;
          } else if (Array.isArray(response)) {
            this.dataSource.data = response;
            this.totalCount = response.length;
          } else {
            this.dataSource.data = [];
            this.totalCount = 0;
          }

          this.loading = false;
          setTimeout(() => this.syncPaginatorState(), 100);
        },
        error: (error) => {
          console.error('Error loading KPIs:', error);
          this.dataSource.data = [];
          this.totalCount = 0;
          this.loading = false;
        }
      });
  }

  // Apply filters to KPI list
  applyFilters(): void {
    // Reset to first page when applying filters
    this.pageIndex = 0;
    this.loadKpis();
  }

  // Handle page change events
  onPageChange(event: PageEvent): void {
    console.log('Page change event received:', event);
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    console.log('Updated pagination state:', {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    });
    this.loadKpis();
  }

  // Method to manually sync paginator state
  syncPaginatorState(): void {
    console.log('Attempting to sync paginator state...');
    console.log('Paginator exists:', !!this.paginator);
    console.log('Data source data length:', this.dataSource.data.length);
    console.log('Total count:', this.totalCount);
    
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageIndex;
      this.paginator.length = this.totalCount;
      console.log('Paginator state synced:', {
        pageSize: this.paginator.pageSize,
        pageIndex: this.paginator.pageIndex,
        length: this.paginator.length,
        pageSizeOptions: this.paginator.pageSizeOptions
      });
      this.cdr.detectChanges();
    } else {
      console.warn('Paginator not found during sync');
    }
  }

  // Clear all filters
  clearFilters(): void {
    this.filters = {
      name: '',
      dataType: '',
      status: ''
    };
    this.applyFilters();
  }

  // Get data type label for display
  getDataTypeLabel(dataType: KpiType): number {
    return dataType || 0;
  }

  // Edit KPI
  editKpi(kpi: KPI): void {
    console.log('Edit KPI:', kpi);
    
    const dialogRef = this.dialog.open(KpiEditDialogComponent, {
      width: '600px',
      data: { kpi: kpi },
      disableClose: false,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('KPI updated:', result);
        // Refresh the KPI list
        this.loadKpis();
      }
    });
  }

  // Inline editing methods
  startEdit(kpi: KPI): void {
    this.editingItem = kpi;
    this.editValue = kpi.actualValue || 0;
  }

  cancelEdit(kpi: KPI): void {
    this.editingItem = null;
    this.editValue = null;
  }

  saveEdit(kpi: KPI): void {
    if (this.editingItem && this.editValue !== null) {
      // Update the KPI
      kpi.actualValue = this.editValue;
      
      // Here you would typically call an API to save the actual value
      console.log('Saving actual value:', {
        kpiId: kpi.id,
        actualValue: this.editValue
      });
      
      // TODO: Call API to update actual value
      // this.kpiApiService.updateActualValue(kpi.id, this.editValue).subscribe(...)
      
      this.editingItem = null;
      this.editValue = null;
    }
  }

  isEditing(kpi: KPI): boolean {
    return this.editingItem === kpi;
  }

  approveKpi(kpi: KPI): void {
    console.log('Approve KPI:', kpi);
    // TODO: Implement approve functionality
    // This would need department context to work properly
  }

  rejectKpi(kpi: KPI): void {
    console.log('Reject KPI:', kpi);
    // TODO: Implement reject functionality
    // This would need department context to work properly
  }

  unlockKpi(kpi: KPI): void {
    console.log('Unlock KPI:', kpi);
    // TODO: Implement unlock functionality
    // This would need department context to work properly
  }
}
