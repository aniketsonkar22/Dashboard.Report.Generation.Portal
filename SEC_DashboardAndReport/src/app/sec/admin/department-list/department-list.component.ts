import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DepartmentService } from 'src/app/services/department.service';
import { DepartmentKpiApiService } from 'src/app/services/department-kpi-api.service';
import { Department, CreateDepartmentRequest, PaginatedResponse, PaginationParams } from 'src/app/sec/interfaces';
import { DepartmentEditDialogComponent } from '../department-edit-dialog/department-edit-dialog.component';
import { DepartmentDeleteDialogComponent } from '../department-delete-dialog/department-delete-dialog.component';
import { AssignKpiDialogComponent } from '../assign-kpi-dialog/assign-kpi-dialog.component';
import { DepartmentApiService } from 'src/app/services/department-api.service';
import { ViewDepartmentUsersDialogComponent } from './view-department-users-dialog.component';
import { MatDialogConfig } from '@angular/material/dialog';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';

@Component({
    selector: 'app-department-list',
    templateUrl: './department-list.component.html',
    styleUrls: ['./department-list.component.scss'],
    standalone: false
})
export class DepartmentListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'isActive', 'createdAt', 'createdBy', 'actions'];
  dataSource = new MatTableDataSource<Department>();
  loading = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  userName: string = '';
  userRole: string = '';
  constructor(
    private departmentService: DepartmentService, 
    private departmentKpiApiService: DepartmentKpiApiService,
    private dialog: MatDialog,
    private departmentApi: DepartmentApiService,
    private authService: AuthServiceAD
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.userName = this.authService.userInfo?.valueOf()?.data?.data?.name || '';
    this.userRole = this.authService.userInfo?.valueOf()?.data?.data?.role || '';
  }

  loadDepartments(): void {
    this.loading = true;
    this.departmentService.getDepartments({
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    }).subscribe({
      next: (response: any) => {
        console.log('Raw API response:', response);
        
        // Handle new response format with success, message, data
        if (response && response.success && response.data) {
          console.log('Department data received:', response.data);
          // New API response format
          this.dataSource.data = response.data.items;
          this.totalCount = response.data.totalCount || response.data.items.length;
          this.pageSize = this.pageSize;
          this.pageIndex = this.pageIndex;
        } else if (response && response.data) {
          // Legacy paginated structure
          this.dataSource.data = response.data;
          this.totalCount = response.totalCount ?? response.resultCount ?? response.data.length;
          this.pageSize = response.pageSize ?? this.pageSize;
          this.pageIndex = Math.max(0, (response.pageNumber ?? 1) - 1);
        } else if (response && response.items) {
          // Legacy paginated structure
          this.dataSource.data = response.items;
          this.totalCount = response.totalCount ?? response.items.length;
          this.pageSize = response.pageSize ?? this.pageSize;
          this.pageIndex = Math.max(0, (response.pageNumber ?? 1) - 1);
        } else if (Array.isArray(response)) {
          // Direct array response
          this.dataSource.data = response;
          this.totalCount = response.length;
          this.pageSize = this.pageSize;
          this.pageIndex = this.pageIndex;
        } else {
          console.warn('Unexpected response structure:', response);
          this.dataSource.data = [];
          this.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.dataSource.data = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDepartments();
  }

  addDepartment(): void {
    const dialogRef = this.dialog.open(DepartmentEditDialogComponent, {
      width: '400px',
      data: { departmentId: '', name: '', isActive: true, createdBy: this.userName, isAdd: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { isAdd, createdAt, departmentId, ...payload } = result;
        this.departmentService.addDepartment(payload).subscribe({
          next: () => this.loadDepartments(),
          error: (error) => console.error('Error adding department:', error)
        });
      }
    });
  }

  editDepartment(dept: Department): void {
    console.log('Editing department:', dept);
    const dialogRef = this.dialog.open(DepartmentEditDialogComponent, {
      width: '400px',
      data: { ...dept, isAdd: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Updating department:', result);
        this.departmentService.updateDepartment(result.departmentId, result).subscribe({
          next: () => this.loadDepartments(),
          error: (error) => console.error('Error updating department:', error)
        });
      }
    });
  }

  deleteDepartment(id: string): void {
    const dialogRef = this.dialog.open(DepartmentDeleteDialogComponent, {
      width: '300px',
      data: { id }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.departmentService.deleteDepartment(id).subscribe({
          next: () => this.loadDepartments(),
          error: (error) => console.error('Error deleting department:', error)
        });
      }
    });
  }

  assignKpi(department: Department): void {
    const dialogRef = this.dialog.open(AssignKpiDialogComponent, {
      width: '500px',
      data: { departmentId: department.id, departmentName: department.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.kpiId) {
        console.log('Assigning KPI to department:', result);
        // Build the request object, only including actualValue if it exists
        const assignRequest: any = {
          targetValue: result.targetValue
        };
        
        if (result.actualValue !== undefined && result.actualValue !== null && result.actualValue !== '') {
          assignRequest.actualValue = result.actualValue;
        }
        
        console.log('Sending assign request:', assignRequest);
        
        this.departmentKpiApiService.assignKpiToDepartment(department.id, result.kpiId, assignRequest).subscribe({
          next: () => {
            console.log('KPI assigned to department successfully');
            // Optionally refresh the department list or show a success message
          },
          error: (error) => console.error('Error assigning KPI to department:', error)
        });
      }
    });
  }

  viewUsers(department: Department): void {
    this.departmentApi.getDepartmentUsers(department.id).subscribe({
      next: (users) => {
        const config: MatDialogConfig = {
          width: '500px',
          data: { departmentName: department.name, departmentId: department.id, users:(users as any).data }
        };
        this.dialog.open(ViewDepartmentUsersDialogComponent, config);
      },
      error: (err) => console.error('Failed to load department users', err)
    });
  }
}


