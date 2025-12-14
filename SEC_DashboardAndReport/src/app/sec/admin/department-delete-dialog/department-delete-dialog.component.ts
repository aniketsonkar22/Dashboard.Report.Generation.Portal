import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-department-delete-dialog',
    template: `
    <h2 mat-dialog-title>Delete Department</h2>
    <mat-dialog-content>Are you sure you want to delete this department?</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="warn" (click)="onDelete()">Delete</button>
    </mat-dialog-actions>
  `,
    standalone: false
})
export class DepartmentDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DepartmentDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }
  ) {}

  onDelete(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}


