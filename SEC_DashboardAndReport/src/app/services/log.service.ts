import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { AuditLog } from '../sec/interfaces'
import { environment } from '../../environments/environment'
import { ConfigService } from './config.service'


// Define the log structure based on the schema
// export interface AuditLog {
//   id?: number  // Optional, for easier deletion by ID
//   commentText: string
//   userName: string
//   department: string
//   timestamp: string
// }

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private get baseUrl(): string { return (this.config.apiUrl || environment.apiUrl || ''); }
  private get apiUrl(): string { return `${this.baseUrl}/api/v1/audits`; }

  constructor(private http: HttpClient, private config: ConfigService) { }

  // Get audits with pagination
  getLogs(pageNumber: number = 1, pageSize: number = 10): Observable<{logs: AuditLog[], metadata: {success: boolean, message: string, totalCount?: number, pageNumber?: number, pageSize?: number}}> {
    let params = new HttpParams()
      .set('pageNumber', String(pageNumber))
      .set('pageSize', String(pageSize))

    return this.http.get<any>(this.apiUrl, { params, withCredentials: true }).pipe(
      map((resp: any) => {
        // Handle new response format with success, message, data
        const raw = resp?.success && resp?.data
          ? (Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.items) ? resp.data.items : []))
          : (Array.isArray(resp)
              ? resp
              : (Array.isArray(resp?.data)
                  ? resp.data
                  : (Array.isArray(resp?.items) ? resp.items : [])));

        const logs = (raw as any[]).map((r: any) => ({
          id: r.id ?? r.auditId ?? r.traceId ?? '',
          action: r.description ?? r.type ?? r.action ?? r.event ?? r.message ?? '',
          entityType: r.type ?? r.entityType ?? '',
          entityId: r.entityId ?? r.resourceId ?? '',
          userId: r.actionTakenBy ?? r.userId ?? r.user ?? r.addedBy ?? '',
          timestamp: r.actionTakenAt ?? r.timestamp ?? r.createdAt ?? r.addedAt ?? '',
          details: r.description ?? r.details ?? r.payload ?? ''
        })) as AuditLog[]

        return {
          logs,
          metadata: {
            success: resp?.success ?? true,
            message: resp?.message ?? 'Logs fetched successfully',
            totalCount: resp?.data?.totalCount ?? resp?.totalCount ?? logs.length,
            pageNumber: resp?.data?.pageNumber ?? resp?.pageNumber ?? pageNumber,
            pageSize: resp?.data?.pageSize ?? resp?.pageSize ?? pageSize
          }
        }
      }),
      catchError(error => {
        console.error('LogService: Error fetching logs:', error);
        throw error;
      })
    )
  }

  // Delete a log by ID
  deleteLogById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('LogService: Error deleting log:', error);
        throw error;
      })
    )
  }

  // Delete all logs
  deleteAllLogs(): Observable<any> {
    return this.http.delete<any>(this.apiUrl, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('LogService: Error deleting all logs:', error);
        throw error;
      })
    )
  }
}
