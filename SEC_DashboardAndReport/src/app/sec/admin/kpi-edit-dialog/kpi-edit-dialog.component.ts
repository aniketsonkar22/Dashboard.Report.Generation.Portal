import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { KPI, UpdateKpiRequest, CreateKpiRequest, KpiType } from '../../interfaces';
import { KpiApiService } from '../../../services/kpi-api.service';

@Component({
    selector: 'app-kpi-edit-dialog',
    templateUrl: './kpi-edit-dialog.component.html',
    styleUrls: ['./kpi-edit-dialog.component.scss'],
    standalone: false
})
export class KpiEditDialogComponent implements OnInit {
  kpiForm: UntypedFormGroup;
  loading = false;
  isEditMode = false;
  kpiTypes = [
    { label: 'Numeric', value: KpiType.Numeric },
    { label: 'Percentage', value: KpiType.Percentage }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<KpiEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { kpi: KPI | null, isEdit: boolean },
    private kpiApiService: KpiApiService
  ) {
    this.isEditMode = data.isEdit;
    
    this.kpiForm = this.fb.group({
      name: [data.kpi?.name || '', [Validators.required, Validators.minLength(1)]],
      description: [data.kpi?.description || '', [Validators.required, Validators.minLength(1)]],
      dataType: [typeof data.kpi?.dataType === 'number' ? data.kpi?.dataType : KpiType.Numeric, [Validators.required]],
      targetValue: [data.kpi?.targetValue || null, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    console.log('KPI Edit Dialog initialized with data:', this.data);
  }

  onSave(): void {
    if (this.kpiForm.valid) {
      this.loading = true;
      const formValue = this.kpiForm.value;
      
      if (this.isEditMode && this.data.kpi) {
        // Edit existing KPI
        const updateRequest: UpdateKpiRequest = {
          name: formValue.name,
          description: formValue.description,
          targetValue: formValue.targetValue
        };

        console.log('Updating KPI with request:', updateRequest);

        this.kpiApiService.updateKpi(this.data.kpi.id, updateRequest).subscribe({
          next: (updatedKpi) => {
            console.log('KPI updated successfully:', updatedKpi);
            this.dialogRef.close(updatedKpi);
          },
          error: (error) => {
            console.error('Error updating KPI:', error);
            this.loading = false;
            // TODO: Show error message to user
          }
        });
      } else {
        // Create new KPI
        const createRequest: CreateKpiRequest = {
          name: formValue.name,
          description: formValue.description,
          // dataType: this.mapKpiTypeCode(formValue.dataType as KpiType),
          dataType: formValue.dataType as KpiType,
          targetValue: formValue.targetValue
        };

        console.log('Creating KPI with request:', createRequest);

        this.kpiApiService.createKpi(createRequest).subscribe({
          next: (newKpi) => {
            console.log('KPI created successfully:', newKpi);
            this.dialogRef.close(newKpi);
          },
          error: (error) => {
            console.error('Error creating KPI:', error);
            this.loading = false;
            // TODO: Show error message to user
          }
        });
      }
    } else {
      console.log('Form is not valid');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }


}