import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { KPI, CreateKpiRequest, UpdateKpiRequest, PaginatedResponse, PaginationParams, Department, KpiType } from '../sec/interfaces';
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class KpiApiService {
  private get baseUrl(): string {
    // Prefer runtime apiUrl if provided; otherwise use environment (for prod builds)
    return this.config.apiUrl || environment.apiUrl || '';
  }
  private get apiUrl(): string {
    return `${this.baseUrl}/api/v1/kpi`;
  }

  constructor(private http: HttpClient, private config: ConfigService) {}

  // GET /api/kpis
  getKpis(params?: PaginationParams): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    console.log('KpiApiService: Making request to:', this.apiUrl);
    console.log('KpiApiService: With params:', httpParams.toString());
    
    return this.http.get<any>(this.apiUrl, { params: httpParams, withCredentials: true }).pipe(
      catchError(error => {
        console.error('KpiApiService: Error fetching KPIs:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/kpi/{kpiId}
  getKpiById(kpiId: string): Observable<KPI> {
    return this.http.get<any>(`${this.apiUrl}/${kpiId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('KpiApiService: Error fetching KPI:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/kpi/{kpiId}/departments
  getKpiDepartments(kpiId: string): Observable<Department[]> {
    return this.http.get<any>(`${this.apiUrl}/${kpiId}/departments`, { withCredentials: true }).pipe(
      map((response: any) => {
        // Handle new response format with success/message/data
        if (response?.success && response?.data) {
          return Array.isArray(response.data) ? response.data : (response.data.items || []);
        }
        // Fallback for direct array response
        return Array.isArray(response) ? response : [];
      }),
      catchError(error => {
        console.error('KpiApiService: Error fetching KPI departments:', error);
        throw error;
      })
    );
  }

  // POST /api/v1/kpi
  createKpi(kpi: CreateKpiRequest): Observable<KPI> {
    return this.http.post<any>(this.apiUrl, kpi, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('KpiApiService: Error creating KPI:', error);
        throw error;
      })
    );
  }

  // PATCH /api/v1/kpi/{kpiId}
  updateKpi(kpiId: string, kpi: UpdateKpiRequest): Observable<KPI> {
    return this.http.patch<any>(`${this.apiUrl}/${kpiId}`, kpi, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('KpiApiService: Error updating KPI:', error);
        throw error;
      })
    );
  }

  // DELETE /api/v1/kpi/{kpiId}
  deleteKpi(kpiId: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${kpiId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('KpiApiService: Error deleting KPI:', error);
        throw error;
      })
    );
  }
}
