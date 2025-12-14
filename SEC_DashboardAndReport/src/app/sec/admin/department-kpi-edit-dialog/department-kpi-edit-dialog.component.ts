import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DepartmentKpi, AssignKpiRequest } from '../../interfaces';
import { DepartmentKpiApiService } from '../../../services/department-kpi-api.service';

@Component({
    selector: 'app-department-kpi-edit-dialog',
    templateUrl: './department-kpi-edit-dialog.component.html',
    styleUrls: ['./department-kpi-edit-dialog.component.scss'],
    standalone: false
})
export class DepartmentKpiEditDialogComponent implements OnInit {
  departmentKpiForm: UntypedFormGroup;
  loading = false;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<DepartmentKpiEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      departmentKpi: DepartmentKpi, 
      departmentId: string 
    },
    private departmentKpiApiService: DepartmentKpiApiService
  ) {
    this.departmentKpiForm = this.fb.group({
      targetValue: [this.data.departmentKpi.targetValue, [Validators.required, Validators.min(0)]],
      actualValue: [this.data.departmentKpi.actualValue, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    console.log('Department KPI Edit Dialog initialized with data:', this.data);
  }

  onSave(): void {
    if (this.departmentKpiForm.valid) {
      this.loading = true;
      const formValue = this.departmentKpiForm.value;
      
      const editRequest: AssignKpiRequest = {
        targetValue: formValue.targetValue,
        actualValue: formValue.actualValue
      };

      console.log('Saving department KPI with request:', editRequest);

      this.departmentKpiApiService.assignKpiToDepartment(
        this.data.departmentId,
        this.data.departmentKpi.kpiId,
        editRequest
      ).subscribe({
        next: (updatedDepartmentKpi: DepartmentKpi) => {
          console.log('Department KPI updated successfully:', updatedDepartmentKpi);
          this.dialogRef.close(updatedDepartmentKpi);
        },
        error: (error: any) => {
          console.error('Error updating department KPI:', error);
          this.loading = false;
          // TODO: Show error message to user
        }
      });
    } else {
      console.log('Form is not valid');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
