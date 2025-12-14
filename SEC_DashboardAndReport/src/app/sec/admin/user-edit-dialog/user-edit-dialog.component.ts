import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../interfaces';

@Component({
    selector: 'app-user-edit-dialog',
    templateUrl: './user-edit-dialog.component.html',
    styleUrls: ['./user-edit-dialog.component.scss'],
    standalone: false
})
export class UserEditDialogComponent {
  userForm: UntypedFormGroup;
  userRoles = UserRole;
  roleOptions = [
    { value: UserRole.DepartmentManager, label: 'Department Manager' },
    { value: UserRole.Contributor, label: 'Contributor' },
    { value: UserRole.Admin, label: 'Admin' }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<UserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any

  ) {
    console.log(data)
    const initialRole: UserRole = typeof data.role === 'string'
      ? (data.role === 'DepartmentManager' ? UserRole.DepartmentManager : UserRole.Contributor)
      : (data.role ?? UserRole.Contributor);
    this.userForm = this.fb.group({
      userId: [data.id || ''],
      name: [data.name || '', Validators.required],
      email: [{ value: data.email || '', disabled: !data.isAdd }, [Validators.required, Validators.email]],
      role: [initialRole, Validators.required],
      departmentId: [data.departmentId || '']
    });
  }

  onSave(): void {
    if (this.userForm.valid) {
      const val = this.userForm.getRawValue();
      const normalized = {
        ...val,
        role: typeof val.role === 'string'
          ? (val.role === 'DepartmentManager' ? UserRole.DepartmentManager : UserRole.Contributor)
          : val.role
      };
      this.dialogRef.close(normalized);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
