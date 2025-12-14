import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Department, CreateDepartmentRequest, PaginatedResponse, PaginationParams, User } from '../sec/interfaces';
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentApiService {
  private get baseUrl(): string { return this.config.apiUrl || environment.apiUrl || ''; }
  private get apiUrl(): string { return `${this.baseUrl}/api/v1/departments`; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  // GET /api/departments
  getDepartments(params?: PaginationParams): Observable<PaginatedResponse<Department>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    console.log('DepartmentApiService: Making request to:', this.apiUrl);
    console.log('DepartmentApiService: With params:', httpParams.toString());
    
    return this.http.get<any>(this.apiUrl, { params: httpParams, withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error fetching departments:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/departments/{departmentId}
  getDepartmentById(departmentId: string): Observable<Department> {
    return this.http.get<any>(`${this.apiUrl}/${departmentId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error fetching department:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/departments/{departmentId}/users
  getDepartmentUsers(departmentId: string): Observable<User[]> {
    return this.http.get<any>(`${this.apiUrl}/${departmentId}/users`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error fetching department users:', error);
        throw error;
      })
    );
  }

  // DELETE /api/v1/users/{userId}/department/{departmentId}
  removeUserFromDepartment(userId: string, departmentId: string): Observable<void> {
    const url = `${this.baseUrl}/api/v1/users/${userId}/department/${departmentId}`;
    return this.http.delete<any>(url, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error removing user from department:', error);
        throw error;
      })
    );
  }

  // POST /api/v1/departments
  createDepartment(department: CreateDepartmentRequest): Observable<Department> {
    return this.http.post<any>(this.apiUrl, department, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error creating department:', error);
        throw error;
      })
    );
  }

  // PUT /api/v1/departments/{departmentId}
  updateDepartment(departmentId: string, department: Partial<CreateDepartmentRequest>): Observable<Department> {
    return this.http.patch<any>(`${this.apiUrl}/${departmentId}`, department, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error updating department:', error);
        throw error;
      })
    );
  }

  // DELETE /api/v1/departments/{departmentId}
  deleteDepartment(departmentId: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${departmentId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentApiService: Error deleting department:', error);
        throw error;
      })
    );
  }
}
