import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { KpiApiService } from 'src/app/services/kpi-api.service';
import { DepartmentKpi, KPI } from '../../interfaces';
import { DepartmentKpiApiService } from '../../../services/department-kpi-api.service';
import { AssignKpiTargetDialogComponent } from '../assign-kpi-target-dialog/assign-kpi-target-dialog.component';

interface GroupedKpi {
  kpiId: string;
  kpiName: string;
  departmentKpis: DepartmentKpi[];
}

@Component({
    selector: 'app-view-kpi-departments-dialog',
    templateUrl: './view-kpi-departments-dialog.component.html',
    styleUrls: ['./view-kpi-departments-dialog.component.scss'],
    standalone: false
})
export class ViewKpiDepartmentsDialogComponent implements OnInit{
  departmentKpisMap: Map<string, DepartmentKpi[]> = new Map();
  groupedKpisMap: Map<string, GroupedKpi[]> = new Map();
  kpiNameMap: Map<string, string> = new Map();
  loadingKpis: Map<string, boolean> = new Map();

  constructor(
    public dialogRef: MatDialogRef<ViewKpiDepartmentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { kpiName: string; departments: any; kpiId: string },
    private departmentKpiApiService: DepartmentKpiApiService,
    private kpiApiService: KpiApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Load all KPI names first
    this.loadKpiNames();
    
    // Fetch KPIs for each department
    const departments = this.getDepartments();
    departments.forEach((department: any) => {
      this.loadKpisForDepartment(department.id);
    });
  }

  loadKpiNames(): void {
    this.kpiApiService.getKpis({ pageNumber: 1, pageSize: 1000 }).subscribe({
      next: (response: any) => {
        let kpis: KPI[] = [];
        
        if (response && response.success && response.data) {
          kpis = Array.isArray(response.data)
            ? response.data
            : (response.data.items || []);
        } else if (response && response.data) {
          kpis = Array.isArray(response.data)
            ? response.data
            : (response.data.items || []);
        } else if (Array.isArray(response)) {
          kpis = response;
        }
        
        // Create a map of KPI ID to KPI name
        kpis.forEach((kpi: KPI) => {
          this.kpiNameMap.set(kpi.id, kpi.name);
        });
        
        // Update grouped KPIs for all departments
        this.updateGroupedKpis();
      },
      error: (err: any) => {
        console.error('Failed to load KPI names', err);
      }
    });
  }

  updateGroupedKpis(): void {
    // Update grouped KPIs for all departments when KPI names are loaded
    this.departmentKpisMap.forEach((kpis, departmentId) => {
      this.groupKpisForDepartment(departmentId);
    });
  }

  getDepartments(): any[] {
    // console.log(this.data);
    // Handle the API response structure where departments are in data.data
    if (this.data.departments && this.data.departments.data) {
      return this.data.departments.data;
    }
    // Fallback for direct array
    if (Array.isArray(this.data.departments)) {
      return this.data.departments;
    }
    return [];
  }

   groupKpisForDepartment(departmentId: string): void {
    const kpis = this.departmentKpisMap.get(departmentId) || [];
    
    // Group by KPI ID and year
    const groupedMap = new Map<string, GroupedKpi>();
    
    kpis.forEach((kpi: DepartmentKpi) => {
      // Normalize year to string for consistent grouping
      const kpiId = String(kpi.kpiId || '').trim();
      
      if (!groupedMap.has(kpiId)) {
        const kpiName = this.kpiNameMap.get(kpiId) || kpiId || 'Unknown KPI';
        groupedMap.set(kpiId, {
          kpiId: kpiId,
          kpiName: kpiName,
          departmentKpis: []
        });
      }
      
      groupedMap.get(kpiId)!.departmentKpis.push(kpi);

      const grouped = Array.from(groupedMap.values()).sort((a, b) => {
        return a.kpiName.localeCompare(b.kpiName);
      });

      this.groupedKpisMap.set(departmentId, grouped);
    });
  }

  loadKpisForDepartment(departmentId: string): void {
    this.loadingKpis.set(departmentId, true);
    this.departmentKpiApiService.getDepartmentKpis(departmentId,undefined,1,1000).subscribe({
      next: (response: any) => {
        console.log('Department KPIs response for department', departmentId, ':', response);
        
        // Handle API response structure - similar to how other components handle it
        let kpis: DepartmentKpi[] = [];
        
        if (response && response.success && response.data) {
          kpis = Array.isArray(response.data)
            ? response.data
            : (response.data.items || []);
        } else if (response && response.data) {
          kpis = Array.isArray(response.data)
            ? response.data
            : (response.data.items || []);
        } else if (Array.isArray(response)) {
          kpis = response;
        }
        
        // Store all KPIs for the department
        this.departmentKpisMap.set(departmentId, kpis);
        
        // Group KPIs by KPI ID and year
        this.groupKpisForDepartment(departmentId);
        
        this.loadingKpis.set(departmentId, false);
      },
      error: (err: any) => {
        console.error('Failed to load KPIs for department', departmentId, err);
        this.departmentKpisMap.set(departmentId, []);
        this.loadingKpis.set(departmentId, false);
      }
    });
  }

  getGroupedKpisForDepartment(departmentId: string): GroupedKpi[] {
    return this.groupedKpisMap.get(departmentId) || [];
  }

  isLoadingKpis(departmentId: string): boolean {
    return this.loadingKpis.get(departmentId) || false;
  }

  editKpiTarget(departmentId: string, groupedKpi: GroupedKpi): void {
    // Get department name
    const department = this.getDepartments().find((d: any) => d.id === departmentId);
    const departmentName = department?.name || 'Department';

    const dialogRef = this.dialog.open(AssignKpiTargetDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        departmentId: departmentId,
        departmentName: departmentName,
        editMode: true,
        kpiId: groupedKpi.kpiId,
        kpiName: groupedKpi.kpiName
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const { targetValue, actualValue } = result;

      if (targetValue == null && actualValue == null) {
        console.log("No target or actual value entered.");
        return;
      } 
        this.departmentKpiApiService.updateDepartmentKpiValues(
          departmentId,
          groupedKpi.kpiId,
          targetValue,
          actualValue
        ).subscribe({
          next: () => {
            console.log("KPI updated successfully.");
            this.loadKpisForDepartment(departmentId);
          },
          error: (err) => {
            console.error("Error updating KPI:", err);
          }
      });
    });
  }

  removeKpiFromDepartment(departmentId: string): void {
    this.departmentKpiApiService.deleteDepartmentKpi(departmentId, this.data.kpiId).subscribe({
      next: () => {
        // Remove the department from the local list
        const departments = this.getDepartments();
        const updatedDepartments = departments.filter((dept: any) => dept.id !== departmentId);
        
        // Update the data structure
        if (this.data.departments && this.data.departments.data) {
          this.data.departments.data = updatedDepartments;
        } else if (Array.isArray(this.data.departments)) {
          this.data.departments = updatedDepartments;
        }
      },
      error: (err: any) => {
        console.error('Failed to remove KPI from department', err);
      }
    });
  }
}