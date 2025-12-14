import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DepartmentApiService } from 'src/app/services/department-api.service';

@Component({
    selector: 'app-view-department-users-dialog',
    templateUrl: './view-department-users-dialog.component.html',
    styleUrls: ['./view-department-users-dialog.component.scss'],
    standalone: false
})
export class ViewDepartmentUsersDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewDepartmentUsersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { departmentName: string; departmentId: string; users: any[] },
    private departmentApi: DepartmentApiService
  ) {}

  removeUser(userId: string): void {
    this.departmentApi.removeUserFromDepartment(userId, this.data.departmentId).subscribe({
      next: () => {
        this.data.users = this.data.users.filter((u: any) => u.id !== userId);
      },
      error: (err) => console.error('Failed to remove user from department', err)
    });
  }

  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'warn';
      case 'manager':
        return 'accent';
      case 'user':
        return 'primary';
      case 'viewer':
        return 'primary';
      default:
        return 'primary';
    }
  }
}


