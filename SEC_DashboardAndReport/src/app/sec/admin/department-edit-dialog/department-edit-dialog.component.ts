import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-department-edit-dialog',
    templateUrl: './department-edit-dialog.component.html',
    styleUrls: ['./department-edit-dialog.component.scss'],
    standalone: false
})
export class DepartmentEditDialogComponent {
  form: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<DepartmentEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      departmentId: [data.id],
      name: [data.name, [Validators.required, Validators.maxLength(200)]],
      isActive: [data.isActive, Validators.required],
      createdAt: [data.createdAt || new Date().toISOString()],
      createdBy: [data.createdBy || null]
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close({ ...this.form.value, isAdd: this.data.isAdd });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}


