import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { KpiApiService } from '../../../services/kpi-api.service';
import { KPI, CreateKpiRequest, UpdateKpiRequest, KpiType } from '../../interfaces';
import { KpiEditDialogComponent } from '../kpi-edit-dialog/kpi-edit-dialog.component';
import { KpiDeleteDialogComponent } from '../kpi-delete-dialog/kpi-delete-dialog.component';
import { Department } from '../../interfaces';
import { ViewKpiDepartmentsDialogComponent } from './view-kpi-departments-dialog.component';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';

@Component({
    selector: 'app-kpi-list',
    templateUrl: './kpi-list.component.html',
    styleUrls: ['./kpi-list.component.scss'],
    standalone: false
})
export class KpiListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'dataType', 'description', 'targetValue', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<KPI>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  loading = false;
  userRole: string = '';
  constructor(
    private kpiApiService: KpiApiService,
    private dialog: MatDialog,
    private authService: AuthServiceAD
  ) {}

  ngOnInit(): void {
    this.loadKpis();
    this.userRole = this.authService.userInfo?.valueOf()?.data?.data?.role || '';
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadKpis(): void {
    this.loading = true;
    this.kpiApiService.getKpis({
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    }).subscribe({
      next: (response: any) => {
        console.log('Raw KPI API response:', response);
        
        // Handle new response format with success, message, data
        if (response && response.success && response.data) {
          // New API response format
          this.dataSource.data = response.data.items as KPI[];
          this.totalCount = response.data.totalCount || response.data.items.length;
          this.pageSize = this.pageSize;
          this.pageIndex = this.pageIndex;
        } else if (response && response.data) {
          // Legacy paginated response
          this.dataSource.data = response.data as KPI[];
          this.totalCount = response.totalCount ?? response.resultCount ?? (response.data as any[]).length;
          this.pageSize = response.pageSize ?? this.pageSize;
          this.pageIndex = Math.max(0, (response.pageNumber ?? 1) - 1);
        } else if (response && response.items) {
          // Legacy paginated response
          this.dataSource.data = response.items as KPI[];
          this.totalCount = response.totalCount ?? response.items.length;
          this.pageSize = response.pageSize ?? this.pageSize;
          this.pageIndex = Math.max(0, (response.pageNumber ?? 1) - 1);
        } else if (Array.isArray(response)) {
          // Direct array response
          const all: KPI[] = response as KPI[];
          this.totalCount = all.length;
          const start = this.pageIndex * this.pageSize;
          const end = start + this.pageSize;
          this.dataSource.data = all.slice(start, end);
        } else {
          console.warn('Unexpected KPI response structure:', response);
          this.dataSource.data = [];
          this.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading KPIs:', error);
        this.dataSource.data = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadKpis();
  }

  addKpi(): void {
    const dialogRef = this.dialog.open(KpiEditDialogComponent, {
      // width: '500px',
      data: { kpi: null, isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadKpis();
      }
    });
  }

  editKpi(kpi: KPI): void {
    const dialogRef = this.dialog.open(KpiEditDialogComponent, {
      // width: '500px',
      data: { kpi, isEdit: true }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadKpis();
      }
    });
  }

  deleteKpi(kpi: KPI): void {
    const dialogRef = this.dialog.open(KpiDeleteDialogComponent, {
      width: '400px',
      data: { kpi }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadKpis();
      }
    });
  }

  viewDepartments(kpi: KPI): void {
    this.kpiApiService.getKpiDepartments(kpi.id).subscribe({
      next: (deps: Department[]) => {
        console.log(deps);
        this.dialog.open(ViewKpiDepartmentsDialogComponent, {
          width: '500px',
          data: { kpiName: kpi.name, departments: deps, kpiId: kpi.id }
        });
      },
      error: (err) => console.error('Failed to load KPI departments', err)
    });
  }

  getDataTypeLabel(dataType: KpiType): string {
    return KpiType[dataType] || 'Unknown';
  }
}
