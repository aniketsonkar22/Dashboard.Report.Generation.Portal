import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-comment-dialog',
    templateUrl: './comment-dialog.component.html',
    styleUrls: ['./comment-dialog.component.scss'],
    standalone: false
})
export class CommentDialogComponent {
  commentForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<CommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      userName: string;
      department: string;
      reportType: string;
      status: string;
      timestamp: string;
      kpiName: string;
      element:any;
      lineItem:string[]
    }
  ) {
    console.log(data)
    // Initialize the form with required fields and validation, and pre-fill values from data
    this.commentForm = this.fb.group({
      commentText: ['', Validators.required],
      lineItem: [`${data.kpiName} | ${data.department} ` ],
      userName: [data.userName, Validators.required],
      department: [data.department, Validators.required],
      reportType: [data.reportType, Validators.required],
      status: [data.status, Validators.required],
      timestamp: [data.timestamp],
    });
    console.log(data)
  }

  onSubmit(): void {
   // if (this.commentForm.valid) {
      this.dialogRef.close(this.commentForm.value);
   // }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
