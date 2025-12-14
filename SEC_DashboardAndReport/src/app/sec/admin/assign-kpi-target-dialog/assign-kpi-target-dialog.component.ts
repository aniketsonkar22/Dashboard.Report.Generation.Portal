import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KPI } from '../../interfaces';
import { DepartmentKpiApiService } from '../../../services/department-kpi-api.service';

@Component({
    selector: 'app-assign-kpi-target-dialog',
    templateUrl: './assign-kpi-target-dialog.component.html',
    styleUrls: ['./assign-kpi-target-dialog.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatDialogModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatButtonModule,
      MatProgressSpinnerModule
    ]
})
export class AssignKpiTargetDialogComponent implements OnInit {
  kpiForm: UntypedFormGroup;
  selectedKpi: KPI | null = null;
  loading = false;
  loadingValues = false;
  originalTargetValue: number | null = null;
  originalActualValue: number | null = null;
  targetValueTouched = false;
  actualValueTouched = false;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AssignKpiTargetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      departmentId: string, 
      departmentName: string,
      editMode?: boolean,
      kpiId?: string,
      kpiName?: string 
    },
    private departmentKpiApiService: DepartmentKpiApiService
  ) {
    console.log('AssignKpiTargetDialogComponent constructor called with data:', data);
    this.kpiForm = this.fb.group({
      targetValue: [null, Validators.required],
      actualValue: [null],
    });
    console.log('Form created:', this.kpiForm);
  }

  ngOnInit(): void {
    // If KPI data is provided, set it
    if (this.data.kpiId && this.data.kpiName) {
      this.selectedKpi = {
        id: this.data.kpiId,
        name: this.data.kpiName
      } as KPI;
      
      // Load current values if in edit mode
      if (this.data.editMode && this.data.departmentId && this.data.kpiId) {
        this.loadCurrentValues();
      }
    }
  }

  loadCurrentValues(): void {
    this.loadingValues = true;
    const { departmentId, kpiId } = this.data;
    
    this.departmentKpiApiService.getDepartmentKpiValue(departmentId!, kpiId!).subscribe({
      next: (response: any) => {
        console.log('Fetched current KPI values:', response);
        
        let targetValue = null;
        let actualValue = null;
        
        // Handle different response structures
        if (response && response.success && response.data) {
          targetValue = response.data.targetValue;
          actualValue = response.data.actualValue;
        } else if (response && response.data) {
          targetValue = response.data.targetValue;
          actualValue = response.data.actualValue;
        } else if (response) {
          targetValue = response.targetValue;
          actualValue = response.actualValue;
        }
        
        // Store original values
        this.originalTargetValue = targetValue !== undefined && targetValue !== null ? targetValue : null;
        this.originalActualValue = actualValue !== undefined && actualValue !== null ? actualValue : null;
        
        // Populate form with fetched values
        this.kpiForm.patchValue({
          targetValue: this.originalTargetValue,
          actualValue: this.originalActualValue
        });
        
        this.loadingValues = false;
      },
      error: (error) => {
        console.error('Error loading current KPI values:', error);
        this.loadingValues = false;
        // Still allow editing even if fetch fails
      }
    });
  }

  onTargetValueChange(): void {
    const currentValue = this.kpiForm.get('targetValue')?.value;
    
    // Convert to number for comparison
    const currentNumber = currentValue !== null && currentValue !== undefined && currentValue !== '' 
      ? Number(currentValue) 
      : null;
    const originalNumber = this.originalTargetValue !== null && this.originalTargetValue !== undefined 
      ? Number(this.originalTargetValue) 
      : null;
    
    // Only mark as touched if value is different from original
    this.targetValueTouched = currentNumber !== originalNumber;
  }

  onActualValueChange(): void {
    const currentValue = this.kpiForm.get('actualValue')?.value;
    
    // Convert to number for comparison
    const currentNumber = currentValue !== null && currentValue !== undefined && currentValue !== '' 
      ? Number(currentValue) 
      : null;
    const originalNumber = this.originalActualValue !== null && this.originalActualValue !== undefined 
      ? Number(this.originalActualValue) 
      : null;
    
    // Only mark as touched if value is different from original
    this.actualValueTouched = currentNumber !== originalNumber;
  }

  hasChanges(): boolean {
    if (!this.data.editMode) {
      // In assign mode, always allow saving if form is valid
      return true;
    }
    
    // In edit mode, check if any value has actually changed
    return this.targetValueTouched || this.actualValueTouched;
  }

  onAssign(): void {
    console.log('Form valid:', this.kpiForm.valid);
    console.log('Form value:', this.kpiForm.value);
    
    if (this.kpiForm.valid && this.selectedKpi) {
      const result: any = { 
        kpiId: this.selectedKpi.id
      };
      
      // Only include values that were actually touched/changed
      if (this.data.editMode) {
        // In edit mode, only include changed values
        if (this.targetValueTouched) {
          const targetValue = this.kpiForm.value.targetValue;
          if (targetValue !== null && targetValue !== undefined && targetValue !== '') {
            result.targetValue = Number(targetValue);
          }
        }
        
        if (this.actualValueTouched) {
          const actualValue = this.kpiForm.value.actualValue;
          if (actualValue !== null && actualValue !== undefined && actualValue !== '') {
            result.actualValue = Number(actualValue);
          }
        }
      } else {
        // In assign mode, include all non-null values
        const targetValue = this.kpiForm.value.targetValue;
        if (targetValue !== null && targetValue !== undefined && targetValue !== '') {
          result.targetValue = Number(targetValue);
        }
        
        const actualValue = this.kpiForm.value.actualValue;
        if (actualValue !== null && actualValue !== undefined && actualValue !== '') {
          result.actualValue = Number(actualValue);
        }
      }

      // Add deadlines if provided
      const contributorDeadline = this.kpiForm.value.contributorDeadline;
      const managerDeadline = this.kpiForm.value.managerDeadline;
      
      if (contributorDeadline) {
        result.contributorDeadline = new Date(contributorDeadline).toISOString();
      }
      if (managerDeadline) {
        result.managerDeadline = new Date(managerDeadline).toISOString();
      }
      
      console.log('Closing dialog with result:', result);
      this.dialogRef.close(result);
    } else {
      console.log('Form is not valid or no KPI selected, cannot assign');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getCurrentDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}