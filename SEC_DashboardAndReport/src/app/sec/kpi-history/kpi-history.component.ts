import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentKpiApiService } from '../../services/department-kpi-api.service';
import { DepartmentService } from '../../services/department.service';
import { KpiApiService } from '../../services/kpi-api.service';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

export interface KpiHistoryItem {
  id: number;
  oldTargetValue: number;
  newTargetValue: number;
  oldActualValue: number;
  newActualValue: number;
  modifiedBy: string;
  modifiedAt: string;
  departmentId: string;
  kpiId: string;
  // Computed properties for sorting
  kpiName?: string;
  departmentName?: string;
}

@Component({
    selector: 'app-kpi-history',
    templateUrl: './kpi-history.component.html',
    styleUrls: ['./kpi-history.component.scss'],
    standalone: false
})
export class KpiHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  
  // Route parameters
  departmentId: string = '';
  kpiId: string = '';
  
  // Data
  historyItems: KpiHistoryItem[] = [];
  dataSource = new MatTableDataSource<KpiHistoryItem>();
  departmentName: string = '';
  kpiName: string = '';
  
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this._sort = sort;
    if (this.dataSource) {
      this.dataSource.sort = sort;
      console.log('Sort connected to dataSource:', sort);
    }
  }
  private _sort!: MatSort;

  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this._paginator = paginator;
    // Don't connect paginator to dataSource for server-side pagination
    console.log('Paginator set for server-side pagination:', paginator);
  }
  private _paginator!: MatPaginator;
  
  // Pagination
  pageNumber: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  hasMore: boolean = false;
  
  // Loading states
  loading: boolean = false;
  error: string = '';
  
  // Filters
  dateFromFilter: string = '';
  dateToFilter: string = '';
  kpiFilter: string = '';
  departmentFilter: string = '';
  
  // Filter options
  kpiOptions: any[] = [];
  departmentOptions: any[] = [];
  
  // Table columns
  displayedColumns: string[] = ['modifiedAt', 'modifiedBy', 'kpiName','departmentName', 'oldActualValue', 'oldTargetValue'];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentKpiApiService: DepartmentKpiApiService,
    private departmentService: DepartmentService,
    private kpiApiService: KpiApiService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.departmentId = params['departmentId'];
      this.kpiId = params['kpiId'];
      
      if (this.departmentId && this.kpiId) {
        this.loadDepartmentInfo();
        this.loadKpiInfo();
        this.loadFilterOptions();
        // Initialize filters with route parameters first
        this.departmentFilter = this.departmentId;
        this.kpiFilter = this.kpiId;
        this.loadHistory();
      }
    });
  }

  ngAfterViewInit(): void {
    // Sort connection is handled in the setter
    console.log('ngAfterViewInit - dataSource:', this.dataSource);
    console.log('ngAfterViewInit - sort:', this._sort);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartmentInfo(): void {
    this.departmentService.getDepartmentById(this.departmentId).subscribe({
      next: (response) => {
        if (response && response.name) {
          this.departmentName = response.name;
        }
      },
      error: (error) => {
        console.error('Error loading department info:', error);
      }
    });
  }

  loadKpiInfo(): void {
    this.kpiApiService.getKpiById(this.kpiId).subscribe({
      next: (response) => {
        if (response && response.name) {
          this.kpiName = response.name;
        }
      },
      error: (error) => {
        console.error('Error loading KPI info:', error);
      }
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.error = '';
    
    // Use filter values if they are set, otherwise use route parameters
    // If "All Departments" is selected (empty string), send empty GUID
    const departmentId = this.departmentFilter === '' ? '00000000-0000-0000-0000-000000000000' : (this.departmentFilter || this.departmentId);
    // If "All KPIs" is selected (empty string), send empty GUID
    const kpiId = this.kpiFilter === '' ? '00000000-0000-0000-0000-000000000000' : (this.kpiFilter || this.kpiId);
    
    console.log('Loading history with departmentId:', departmentId, 'kpiId:', kpiId);
    console.log('Current filters - departmentFilter:', this.departmentFilter, 'kpiFilter:', this.kpiFilter);
    console.log('Pagination - pageNumber:', this.pageNumber, 'pageSize:', this.pageSize);
    
    this.departmentKpiApiService.getKpiHistory(
      departmentId, 
      kpiId, 
      this.pageNumber, 
      this.pageSize
    ).subscribe({
      next: (response) => {
        console.log('KPI History response:', response);
        this.loading = false;
        
        if (response && response.data && response.data.items) {
          this.historyItems = response.data.items;
          // Add computed properties for sorting
          this.historyItems = this.historyItems.map(item => ({
            ...item,
            kpiName: this.getKpiName(item.kpiId),
            departmentName: this.getDepartmentName(item.departmentId)
          }));
          this.dataSource.data = this.historyItems;
          // Ensure sort is connected after data is loaded (no paginator for server-side pagination)
          if (this._sort) {
            this.dataSource.sort = this._sort;
            console.log('Sort reconnected after data load:', this._sort);
          }
          this.totalCount = response.data.totalCount || 0;
          this.hasMore = response.data.totalCount > (this.pageNumber * this.pageSize);
        } else if (Array.isArray(response)) {
          this.historyItems = response;
          // Add computed properties for sorting
          this.historyItems = this.historyItems.map(item => ({
            ...item,
            kpiName: this.getKpiName(item.kpiId),
            departmentName: this.getDepartmentName(item.departmentId)
          }));
          this.dataSource.data = this.historyItems;
          // Ensure sort is connected after data is loaded (no paginator for server-side pagination)
          if (this._sort) {
            this.dataSource.sort = this._sort;
          }
          this.totalCount = response.length;
          this.hasMore = false;
        }
      },
      error: (error) => {
        console.error('Error loading KPI history:', error);
        this.loading = false;
        this.error = 'Failed to load KPI history';
        this.historyItems = [];
      }
    });
  }

  onPageChange(event: any): void {
    console.log('Page change event:', event);
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    console.log('New page number:', this.pageNumber, 'New page size:', this.pageSize);
    this.loadHistory();
  }

  applyFilters(): void {
    this.pageNumber = 1;
    this.loadHistory();
  }

  onFilterChange(): void {
    // Optional: Add debouncing or immediate filtering logic here
    console.log('Filter changed - Department:', this.departmentFilter, 'KPI:', this.kpiFilter);
  }

  resetFiltersToRouteParams(): void {
    // Reset filters to match route parameters
    this.departmentFilter = this.departmentId;
    this.kpiFilter = this.kpiId;
    this.dateFromFilter = '';
    this.dateToFilter = '';
    console.log('Reset filters to route params - departmentId:', this.departmentId, 'kpiId:', this.kpiId);
  }

  resetFiltersToAll(): void {
    // Reset filters to show all departments and KPIs
    this.departmentFilter = '';
    this.kpiFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    console.log('Reset filters to show all - departmentFilter: "", kpiFilter: ""');
  }

  loadFilterOptions(): void {
    // Load KPI options
    this.kpiApiService.getKpis({ pageNumber: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        console.log('KPI options response:', response);
        if (response && response.data && response.data.items) {
          this.kpiOptions = response.data.items;
        } else if (Array.isArray(response)) {
          this.kpiOptions = response;
        }
        // KPI filter is already set in ngOnInit
      },
      error: (error) => {
        console.error('Error loading KPI options:', error);
      }
    });

    // Load department options
    this.departmentService.getDepartments({ pageNumber: 1, pageSize: 1000 }).subscribe({
      next: (response: any) => {
        console.log('Department options response:', response);
        if (response && response.data.items) {
          this.departmentOptions = response.data.items;
          console.log('Department options loaded:', this.departmentOptions);
        } else if (Array.isArray(response)) {
          this.departmentOptions = response;
        }
        // Department filter is already set in ngOnInit
        console.log('Department options loaded, current filter:', this.departmentFilter);
      },
      error: (error) => {
        console.error('Error loading department options:', error);
      }
    });
  }

  clearFilters(): void {
    this.resetFiltersToRouteParams();
    this.applyFilters();
  }

  goBack(): void {
    this.router.navigate(['/kpi']);
  }


  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  }

  getKpiName(kpiId: string): string {
    const kpi = this.kpiOptions.find(k => k.id === kpiId);
    return kpi ? kpi.name : 'Unknown KPI';
  }

  getDepartmentName(departmentId: string): string {
    const department = this.departmentOptions.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown Department';
  }

  // Test method to manually trigger sorting
  testSort(): void {
    console.log('Testing sort...');
    console.log('DataSource before sort:', this.dataSource.data);
    console.log('Sort active:', this.dataSource.sort);
    console.log('Sort direction:', this.dataSource.sort?.direction);
    console.log('Sort active column:', this.dataSource.sort?.active);
  }

}
