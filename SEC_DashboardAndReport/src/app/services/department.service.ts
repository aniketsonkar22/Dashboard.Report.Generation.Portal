import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Department, CreateDepartmentRequest, PaginatedResponse, PaginationParams } from '../sec/interfaces';
import { DepartmentApiService } from './department-api.service';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  constructor(private departmentApiService: DepartmentApiService) {}

  getDepartments(params?: PaginationParams): Observable<PaginatedResponse<Department>> {
    console.log('DepartmentService: Getting departments with params:', params);
    return this.departmentApiService.getDepartments(params);
  }

  getDepartmentById(id: string): Observable<Department> {
    return this.departmentApiService.getDepartmentById(id);
  }

  addDepartment(dept: CreateDepartmentRequest): Observable<Department> {
    return this.departmentApiService.createDepartment(dept);
  }

  updateDepartment(id: string, dept: Partial<CreateDepartmentRequest>): Observable<Department> {
    return this.departmentApiService.updateDepartment(id, dept);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.departmentApiService.deleteDepartment(id);
  }

}


