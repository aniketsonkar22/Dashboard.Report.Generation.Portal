import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KpiApiService } from '../../../services/kpi-api.service';
import { KPI } from '../../interfaces';

export interface KpiDeleteDialogData {
  kpi: KPI;
}

@Component({
    selector: 'app-kpi-delete-dialog',
    templateUrl: './kpi-delete-dialog.component.html',
    styleUrls: ['./kpi-delete-dialog.component.scss'],
    standalone: false
})
export class KpiDeleteDialogComponent {
  constructor(
    private kpiApiService: KpiApiService,
    private dialogRef: MatDialogRef<KpiDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KpiDeleteDialogData
  ) {}

  onConfirm(): void {
    this.kpiApiService.deleteKpi(this.data.kpi.id).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error deleting KPI:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
