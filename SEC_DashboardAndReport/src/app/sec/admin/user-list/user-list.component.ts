import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserApiService } from 'src/app/services/user-api.service';
import { User, UserRole, Department } from '../../interfaces';
import { UserEditDialogComponent } from '../user-edit-dialog/user-edit-dialog.component';
import { UserDeleteDialogComponent } from '../user-delete-dialog/user-delete-dialog.component';
import { AssignDepartmentDialogComponent } from '../assign-department-dialog/assign-department-dialog.component';
import { PaginatedResponse, PaginationParams } from '../../interfaces';


@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    standalone: false
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'role', 'departments', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<User>();
  loading = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(private userApiService: UserApiService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userApiService.getUsers({
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    }).subscribe({
      next: (response: any) => {
        console.log('Raw User API response:', response);
        
        // Handle new response format with success, message, data
        if (response && response.success && response.data) {
          // New API response format
          console.log('User data received:', response.data);
          this.dataSource.data = response.data.items;
          this.enrichWithDepartmentsFromInline();
          this.totalCount = response.data.totalCount || response.data.items.length;
          this.pageSize = this.pageSize;
          this.pageIndex = this.pageIndex;
        } else if (response && response.data) {
          // Legacy paginated structure
          console.log('User data received:', response.data);
          this.dataSource.data = response.data;
          this.enrichWithDepartmentsFromInline();
          this.totalCount = response.totalCount ?? response.resultCount ?? response.data.length;
          this.pageSize = response.pageSize ?? this.pageSize;
          this.pageIndex = Math.max(0, (response.pageNumber ?? 1) - 1);
        } else if (response && response.items) {
          // Legacy paginated structure
          console.log('User items received:', response.items);
          this.dataSource.data = response.items;
          this.enrichWithDepartmentsFromInline();
          this.totalCount = response.totalCount ?? response.items.length;
          this.pageSize = response.pageSize ?? this.pageSize;
          this.pageIndex = Math.max(0, (response.pageNumber ?? 1) - 1);
        } else if (Array.isArray(response)) {
          // Direct array response
          console.log('User array received:', response);
          this.dataSource.data = response;
          this.enrichWithDepartmentsFromInline();
          this.totalCount = response.length;
          this.pageSize = this.pageSize;
          this.pageIndex = this.pageIndex;
        } else {
          console.warn('Unexpected User response structure:', response);
          this.dataSource.data = [];
          this.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.dataSource.data = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }

  private enrichWithDepartmentsFromInline(): void {
    const users = this.dataSource.data as Array<User & { departments?: Department[]; departmentsCsv?: string }>;
    users.forEach((u) => {
      const deps = (u as any).departments as Department[] | undefined;
      (u as any).departmentsCsv = Array.isArray(deps) ? deps.map(d => d.name).join(', ') : '';
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '400px',
      data: { ...user, isAdd: false, id: user.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        this.userApiService.updateUser(user.id, result).subscribe({
          next: () => this.loadUsers(),
          error: (error) => console.error('Error updating user:', error)
        });
      }
    });
  }
  addUser(): void {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '400px',
      data: { 
        userId: '', 
        name: '', 
        email: '', 
        role: '', 
        departmentId: '', 
        isAdd: true 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        this.userApiService.createUser(result).subscribe({
          next: () => this.loadUsers(),
          error: (error) => console.error('Error creating user:', error)
        });
      }
    });
  }

  deleteUser(userId: string): void {
    const dialogRef = this.dialog.open(UserDeleteDialogComponent, {
      width: '300px',
      data: { id: userId }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.userApiService.deleteUser(userId).subscribe({
          next: () => this.loadUsers(),
          error: (error) => console.error('Error deleting user:', error)
        });
      }
      this.loadUsers();
    });
  }


  assignToDepartment(user: User): void {
    const dialogRef = this.dialog.open(AssignDepartmentDialogComponent, {
      width: '400px',
      data: { userId: user.id, userName: user.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.departmentId) {
        this.userApiService.assignUserToDepartment(user.id, result.departmentId).subscribe({
          next: () => {
            console.log('User assigned to department successfully');
            this.loadUsers();
          },
          error: (error) => console.error('Error assigning user to department:', error)
        });
      }
    });
  }

  removeFromDepartment(user: User): void {
    if (confirm(`Are you sure you want to remove ${user.name} from their department?`)) {
      this.userApiService.removeUserFromDepartment(user.id).subscribe({
        next: () => {
          console.log('User removed from department successfully');
          this.loadUsers();
        },
        error: (error) => console.error('Error removing user from department:', error)
      });
    }
  }

  displayDepartments(user: User & { departmentsCsv?: string }): string {
    return user && user.departmentsCsv ? user.departmentsCsv : '-';
  }
}
