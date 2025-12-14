import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-reply-dialog',
    templateUrl: './reply-dialog.component.html',
    styleUrls: ['./reply-dialog.component.scss'],
    standalone: false
})
export class ReplyDialogComponent implements OnInit {
  replyForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<ReplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { commentId: number, userName:string, department:string, reportType:string }
  ) {
    this.replyForm = this.fb.group({
      commentText: ['', Validators.required],
      status: ['Pending'], // You can set default values or use dynamic values here
      userName: [data.userName], // Replace with dynamic user info
      department: [data.department], // Replace as needed
      reportType: [data.reportType], // Replace as needed
    });
  }

  ngOnInit(): void {}

  submitReply(): void {
    if (this.replyForm.valid) {
      this.dialogRef.close(this.replyForm.value);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
