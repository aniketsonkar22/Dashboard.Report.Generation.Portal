import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../interfaces';

@Component({
    selector: 'app-assign-department-dialog',
    templateUrl: './assign-department-dialog.component.html',
    styleUrls: ['./assign-department-dialog.component.scss'],
    standalone: false
})
export class AssignDepartmentDialogComponent implements OnInit {
  departmentForm: UntypedFormGroup;
  departments: Department[] = [];
  loading = false;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AssignDepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string, userName: string },
    private departmentService: DepartmentService
  ) {
    console.log('AssignDepartmentDialogComponent constructor called with data:', data);
    this.departmentForm = this.fb.group({
      departmentId: ['', Validators.required]
    });
    console.log('Form created:', this.departmentForm);
  }

  ngOnInit(): void {
    this.loadDepartments();
    
    // Listen for form control value changes
    this.departmentForm.get('departmentId')?.valueChanges.subscribe(value => {
      console.log('Form control value changed:', value);
    });
  }

  loadDepartments(): void {
    this.loading = true;
    this.departmentService.getDepartments({
      pageNumber: 1,
      pageSize: 1000 // Get all departments
    }).subscribe({
      next: (response) => {
        console.log('Departments loaded:', response);
        if ((response as any)?.data) {
          this.departments = (response as any).data.items as Department[];
          console.log('Departments set from data:', this.departments);
        } else if (response && (response as any).items) {
          this.departments = (response as any).items as Department[];
          console.log('Departments set from items:', this.departments);
          console.log('First department structure:', this.departments[0]);
          if (this.departments[0]) {
            console.log('First department departmentId:', this.departments[0].id);
            console.log('First department name:', this.departments[0].name);
          }
        } else if (Array.isArray(response)) {
          this.departments = response as Department[];
          console.log('Departments set from array:', this.departments);
          console.log('First department structure:', this.departments[0]);
          if (this.departments[0]) {
            console.log('First department departmentId:', this.departments[0].id);
            console.log('First department name:', this.departments[0].name);
          }
        } else {
          console.log('No departments found in response');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.loading = false;
      }
    });
  }

  onAssign(): void {
    console.log('Form valid:', this.departmentForm.valid);
    console.log('Form value:', this.departmentForm.value);
    console.log('Selected department:', this.departmentForm.value.departmentId);
    
    if (this.departmentForm.valid) {
      const selectedDepartment = this.departmentForm.value.departmentId;
      console.log('Selected department object:', selectedDepartment);
      
      if (selectedDepartment && selectedDepartment.id) {
        const departmentId = selectedDepartment.id;
        console.log('Closing dialog with departmentId:', departmentId);
        this.dialogRef.close({ departmentId });
      } else {
        console.log('No valid department selected');
      }
    } else {
      console.log('Form is not valid, cannot assign');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onDepartmentSelected(event: any): void {
    console.log('Department selection changed:', event);
    console.log('Selected value:', event.value);
    console.log('Selected department object:', event.value);
    if (event.value) {
      console.log('Department ID from selection:', event.value.id);
      console.log('Department name from selection:', event.value.name);
    }
    console.log('Form value after selection:', this.departmentForm.value);
  }

  onDepartmentChange(event: any): void {
    console.log('Department change event:', event);
    console.log('Change event value:', event.target?.value);
    console.log('Form value after change:', this.departmentForm.value);
  }
}
