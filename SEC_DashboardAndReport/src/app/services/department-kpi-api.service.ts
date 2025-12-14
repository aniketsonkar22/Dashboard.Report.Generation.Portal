import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { 
  DepartmentKpi, 
  AssignKpiRequest, 
  CommentItem
} from '../sec/interfaces';

// New interface for deadline assignment
export interface AssignKpiDeadlineRequest {
  contributorDeadline: string; // date-time, required
  managerDeadline?: string; // date-time, optional
}
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentKpiApiService {
  private get baseUrl(): string { return this.config.apiUrl || environment.apiUrl || ''; }
  private get apiUrl(): string { return `${this.baseUrl}/api/v1/departments`; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  // GET /api/v1/departments/{departmentId}/kpis
  getDepartmentKpis(
    departmentId: string,
    status?: number,
    pageNumber?: number,
    pageSize?: number,
    dataType?: number,
    kpi?: string
  ): Observable<DepartmentKpi[]> {
    let httpParams = new HttpParams();
    if (status) {
      httpParams = httpParams.set('status', status);
    }
    if (dataType) {
      httpParams = httpParams.set('dataType', dataType);
    }
    if (pageNumber) {
      httpParams = httpParams.set('pageNumber', pageNumber.toString());
    }
    if (pageSize) {
      httpParams = httpParams.set('pageSize', pageSize.toString());
    }
    if (kpi) {
      httpParams = httpParams.set('kpiId', kpi);
    }
    return this.http.get<any>(`${this.apiUrl}/${departmentId}/kpis`, { params: httpParams, withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error fetching department KPIs:', error);
        throw error;
      })
    );
  }

  // PUT /api/v1/departments/{departmentId}/kpi/{kpiId}/assign
  assignKpiToDepartment(departmentId: string, kpiId: string, request: AssignKpiRequest): Observable<DepartmentKpi> {
    return this.http.put<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/assign`, request, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error assigning KPI to department:', error);
        throw error;
      })
    );
  }

  // (No edit endpoint in swagger)

  // PUT /api/v1/departments/{departmentId}/kpi/{kpiId}/value
  updateDepartmentKpiValue(departmentId: string, kpiId: string, actualValue: number): Observable<DepartmentKpi> {
    // Backend expects only the changed field
    return this.http.patch<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/value`, { actualValue }, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error updating department KPI value:', error);
        throw error;
      })
    );
  }

   // PUT /api/v1/departments/{departmentId}/kpi/{kpiId}/value
  updateDepartmentKpiValues(departmentId: string, kpiId: string, targetValue?: number, actualValue?: number): Observable<DepartmentKpi> {
    const requestBody: any = {};
    
    if (targetValue !== undefined && targetValue !== null) {
      requestBody.targetValue = targetValue;
    }
    if (actualValue !== undefined && actualValue !== null) {
      requestBody.actualValue = actualValue;
    }

    return this.http.patch<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/value`,  requestBody, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error updating department KPI value:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/departments/{departmentId}/kpi/{kpiId}/comment
  getDepartmentKpiComments(departmentId: string, kpiId: string, pageNumber?: number, pageSize?: number): Observable<CommentItem[]> {
    let httpParams = new HttpParams();
    if (pageNumber) {
      httpParams = httpParams.set('pageNumber', pageNumber.toString());
    }
    if (pageSize) {
      httpParams = httpParams.set('pageSize', pageSize.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/comment`, { params: httpParams, withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error fetching department KPI comments:', error);
        throw error;
      })
    );
  }

  // PATCH /api/v1/departments/{departmentId}/kpi/{kpiId}/comment (add a comment)
  addDepartmentKpiComment(departmentId: string, kpiId: string, text: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/comment`, { text }, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error adding department KPI comment:', error);
        throw error;
      })
    );
  }

  // PATCH /api/v1/departments/{departmentId}/kpi/{kpiId}/deadline
  assignKpiDeadline(departmentId: string, kpiId: string, request: AssignKpiDeadlineRequest): Observable<DepartmentKpi> {
    return this.http.patch<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/deadline`, request, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error assigning KPI deadline:', error);
        throw error;
      })
    );
  }

  // DELETE /api/v1/departments/{departmentId}/kpi/{kpiId}
  deleteDepartmentKpi(departmentId: string, kpiId: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error deleting department KPI:', error);
        throw error;
      })
    );
  }

  // PATCH /api/v1/departments/{departmentId}/kpi/{kpiId}/approve
  approveDepartmentKpi(departmentId: string, kpiId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/approve`, {}, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error approving department KPI:', error);
        throw error;
      })
    );
  }

  // PATCH /api/v1/departments/{departmentId}/kpi/{kpiId}/reject
  rejectDepartmentKpi(departmentId: string, kpiId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/reject`, {}, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error rejecting department KPI:', error);
        throw error;
      })
    );
  }

  getDepartmentKpiValue(departmentId: string, kpiId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/value`,  { withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error fetching KPI values:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/departments/{departmentId}/kpi/{kpiId}/history
  getKpiHistory(departmentId: string, kpiId: string, pageNumber?: number, pageSize?: number): Observable<any> {
    let httpParams = new HttpParams();
    if (pageNumber) {
      httpParams = httpParams.set('pageNumber', pageNumber.toString());
    }
    if (pageSize) {
      httpParams = httpParams.set('pageSize', pageSize.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/${departmentId}/kpi/${kpiId}/history`, { params: httpParams, withCredentials: true }).pipe(
      catchError(error => {
        console.error('DepartmentKpiApiService: Error fetching KPI history:', error);
        throw error;
      })
    );
  }
}
