import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AddKpiDialogData {
  kpiType: string;  // 'bcp', 'dnt', or 'erc'
  kpiLabel: string; // Display label for the KPI
}

@Component({
  selector: 'app-add-kpi-dialog',
  templateUrl: './add-kpi-dialog.component.html',
  styleUrls: ['./add-kpi-dialog.component.scss'],
  standalone: false
})
export class AddKpiDialogComponent implements OnInit {
  kpiForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddKpiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddKpiDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    // Common fields for all KPI types
    const commonFields = {
      date: [new Date(), Validators.required],
      sector: ['', Validators.required]
    };

    // Add type-specific fields
    let typeSpecificFields = {};

    if (this.data.kpiType === 'bcp') {
      typeSpecificFields = {
        type: ['', Validators.required],
        bLs: ['', Validators.required],
        bcPs_Reviewed: [0, [Validators.min(0)]],
        total_BCPs: [0, [Validators.min(0)]]
      };
    } else if (this.data.kpiType === 'dnt') {
      typeSpecificFields = {
        drillType: ['', Validators.required],
        drillConducted: [0, [Validators.min(0)]],
        plannedDrills: [0, [Validators.min(0)]],
        correctiveActions: [0, [Validators.min(0)]],
        correctiveType: ['', Validators.required]
      };
    } else if (this.data.kpiType === 'erc') {
      typeSpecificFields = {
        ext_Requirement_Type: ['', Validators.required],
        total_Requirement: [0, [Validators.min(0)]],
        ext_Requirements: [0, [Validators.min(0)]]
      };
    }

    // Create form with combined fields
    this.kpiForm = this.fb.group({
      ...commonFields,
      ...typeSpecificFields
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.kpiForm.valid) {
      const formValue = this.kpiForm.value;
      
      // Build the payload based on KPI type
      const payload: any = {
        date: formValue.date instanceof Date 
          ? formValue.date.toISOString() 
          : new Date(formValue.date).toISOString(),
        sector: Number(formValue.sector)
      };

      // Add type-specific fields
      if (this.data.kpiType === 'bcp') {
        payload.type = formValue.type;
        payload.bl = formValue.bLs; // Note: API uses 'bl' but form uses 'bLs'
        payload.bcPs_Reviewed = Number(formValue.bcPs_Reviewed);
        payload.total_BCPs = Number(formValue.total_BCPs);
      } else if (this.data.kpiType === 'dnt') {
        payload.drillType = formValue.drillType;
        payload.drillConducted = Number(formValue.drillConducted);
        payload.plannedDrills = Number(formValue.plannedDrills);
        payload.correctiveActions = Number(formValue.correctiveActions);
        payload.correctiveType = formValue.correctiveType;
      } else if (this.data.kpiType === 'erc') {
        payload.ext_Requirement_Type = formValue.ext_Requirement_Type;
        payload.total_Requirement = Number(formValue.total_Requirement);
        payload.ext_Requirements = Number(formValue.ext_Requirements);
      }

      // Close dialog and return the payload
      this.dialogRef.close(payload);
    }
  }
}