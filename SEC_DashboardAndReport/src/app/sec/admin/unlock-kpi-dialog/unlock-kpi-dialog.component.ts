import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AssignKpiDeadlineRequest } from '../../../services/department-kpi-api.service';

@Component({
    selector: 'app-unlock-kpi-dialog',
    templateUrl: './unlock-kpi-dialog.component.html',
    styleUrls: ['./unlock-kpi-dialog.component.scss'],
    standalone: false
})
export class UnlockKpiDialogComponent implements OnInit {
  unlockForm: UntypedFormGroup;
  loading = false;
  todayDate: Date = new Date();

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<UnlockKpiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      kpiName: string, 
      departmentId: string, 
      kpiId: string 
    }
  ) {
    this.unlockForm = this.fb.group({
      contributorDate: ['', Validators.required],
      contributorTime: ['', Validators.required],
      managerDate: [''],
      managerTime: ['']
    }, { validators: this.notInPastValidator.bind(this) });
  }

  ngOnInit(): void {
    const now = new Date();
    //set the default time to 11:59PM
    const defaultDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);
    const defaultManagerDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);

    const toLocalDateObj = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const toLocalTimeInput = (d: Date) => {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    this.unlockForm.patchValue({
      contributorDate: toLocalDateObj(defaultDeadline),
      contributorTime: toLocalTimeInput(defaultDeadline),
      managerDate: toLocalDateObj(defaultManagerDeadline),
      managerTime: toLocalTimeInput(defaultManagerDeadline)
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUnlock(): void {
    if (this.unlockForm.valid) {
      const { contributorDate, contributorTime, managerDate, managerTime } = this.unlockForm.value as {
        contributorDate: Date;
        contributorTime: string;
        managerDate?: Date;
        managerTime?: string;
      };

      const buildIso = (dateObj: Date, timeInput: string): string => {
        const [hours, minutes] = timeInput.split(':').map(v => parseInt(v, 10));
        const local = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, minutes, 0);
        return local.toISOString();
      };

      const contributorDeadline = buildIso(contributorDate, contributorTime);
      const managerDeadline = managerDate && managerTime ? buildIso(managerDate, managerTime) : undefined;

      const deadlineRequest: AssignKpiDeadlineRequest = {
        contributorDeadline,
        managerDeadline
      };

      this.dialogRef.close(deadlineRequest);
    }
  }

  getCurrentDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  setContributorToday(): void {
    const now = new Date();
    const minutes = now.getMinutes();
    const add = (5 - (minutes % 5)) % 5;
    now.setMinutes(minutes + add, 0, 0);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    this.unlockForm.patchValue({
      contributorDate: `${year}-${month}-${day}`,
      contributorTime: `${hours}:${mins}`
    });
    this.unlockForm.updateValueAndValidity();
  }

  setManagerToday(): void {
    const now = new Date();
    const minutes = now.getMinutes();
    const add = (5 - (minutes % 5)) % 5;
    now.setMinutes(minutes + add, 0, 0);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    this.unlockForm.patchValue({
      managerDate: `${year}-${month}-${day}`,
      managerTime: `${hours}:${mins}`
    });
    this.unlockForm.updateValueAndValidity();
  }

  private notInPastValidator(group: UntypedFormGroup) {
    const combine = (dateObj?: unknown, timeStr?: string): Date | undefined => {
      if (!dateObj || !timeStr) return undefined;
      const d = dateObj as Date;
      const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
    };

    const now = new Date();
    const contribDate: Date | undefined = group.get('contributorDate')?.value as Date | undefined;
    const contribTime: string | undefined = group.get('contributorTime')?.value as string | undefined;
    const managerDate: Date | undefined = group.get('managerDate')?.value as Date | undefined;
    const managerTime: string | undefined = group.get('managerTime')?.value as string | undefined;

    const contrib = combine(contribDate, contribTime);
    const manager = combine(managerDate, managerTime);

    const errors: any = {};
    if (contrib && contrib.getTime() < now.getTime()) {
      errors.contributorPast = true;
    }
    if (manager && manager.getTime() < now.getTime()) {
      errors.managerPast = true;
    }

    return Object.keys(errors).length ? errors : null;
  }
}
