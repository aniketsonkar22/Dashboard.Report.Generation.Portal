import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { KpiApiService } from '../../../services/kpi-api.service';
import { KPI } from '../../interfaces';

@Component({
    selector: 'app-assign-kpi-dialog',
    templateUrl: './assign-kpi-dialog.component.html',
    styleUrls: ['./assign-kpi-dialog.component.scss'],
    standalone: false
})
export class AssignKpiDialogComponent implements OnInit {
  kpiForm: UntypedFormGroup;
  kpis: KPI[] = [];
  loading = false;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AssignKpiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { departmentId: string, departmentName: string },
    private kpiApiService: KpiApiService
  ) {
    console.log('AssignKpiDialogComponent constructor called with data:', data);
    this.kpiForm = this.fb.group({
      kpiId: ['', Validators.required],
      targetValue: [null, Validators.required],
      actualValue: [null],
 
    });
    console.log('Form created:', this.kpiForm);
  }

  ngOnInit(): void {
    this.loadKpis();
    
    // Listen for form control value changes
    this.kpiForm.get('kpiId')?.valueChanges.subscribe(value => {
      console.log('Form control value changed:', value);
    });
  }

  loadKpis(): void {
    this.loading = true;
    this.kpiApiService.getKpis({
      pageNumber: 1,
      pageSize: 100 // Get all KPIs
    }).subscribe({
      next: (response) => {
        console.log('KPIs loaded:', response);
        if (response && response.data.items) {
          this.kpis = response.data.items;
          console.log('KPIs set from items:', this.kpis);
          console.log('First KPI structure:', this.kpis[0]);
          if (this.kpis[0]) {
            console.log('First KPI ID:', this.kpis[0].id);
            console.log('First KPI name:', this.kpis[0].name);
          }
        } else if (Array.isArray(response)) {
          this.kpis = response;
          console.log('KPIs set from array:', this.kpis);
          console.log('First KPI structure:', this.kpis[0]);
          if (this.kpis[0]) {
            console.log('First KPI ID:', this.kpis[0].id);
            console.log('First KPI name:', this.kpis[0].name);
          }
        } else {
          console.log('No KPIs found in response');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading KPIs:', error);
        this.loading = false;
      }
    });
  }

  onAssign(): void {
    console.log('Form valid:', this.kpiForm.valid);
    console.log('Form value:', this.kpiForm.value);
    console.log('Selected KPI:', this.kpiForm.value.kpiId);
    
    if (this.kpiForm.valid) {
      const selectedKpi = this.kpiForm.value.kpiId;
      console.log('Selected KPI object:', selectedKpi);
      
      if (selectedKpi && selectedKpi.id) {
        const kpiId = selectedKpi.id;
        const targetValue = this.kpiForm.value.targetValue;
        const actualValue = this.kpiForm.value.actualValue;
        
        // Only include actualValue if it's not null/undefined/empty
        const result: any = { 
          kpiId, 
          targetValue
        };
        
        if (actualValue !== null && actualValue !== undefined && actualValue !== '') {
          result.actualValue = actualValue;
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
        console.log('No valid KPI selected');
      }
    } else {
      console.log('Form is not valid, cannot assign');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onKpiSelected(event: any): void {
    console.log('KPI selection changed:', event);
    console.log('Selected value:', event.value);
    console.log('Selected KPI object:', event.value);
    if (event.value) {
      console.log('KPI ID from selection:', event.value.id);
      console.log('KPI name from selection:', event.value.name);
    }
    console.log('Form value after selection:', this.kpiForm.value);
  }

  onKpiChange(event: any): void {
    console.log('KPI change event:', event);
    console.log('Change event value:', event.target?.value);
    console.log('Form value after change:', this.kpiForm.value);
  }

  getCurrentDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}
