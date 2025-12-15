import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BcpService {
  private baseUrl = 'http://localhost:5069';
  private apiEndpoint = '/api/v1/bcp';

  constructor(private http: HttpClient) {}

  getReports(params: any): Observable<any> {
    const url = `${this.baseUrl}${this.apiEndpoint}`;
    return this.http.get<any>(url, {
      params,
      withCredentials: true
    });
  }

  updateReport(id: string, payload: any): Observable<any> {
    const url = `${this.baseUrl}${this.apiEndpoint}/${id}`;
    return this.http.put<any>(url, payload, {
      withCredentials: true
    });
  }

  createReport(payload: any): Observable<any> {
    const url = `${this.baseUrl}${this.apiEndpoint}`;
    return this.http.post<any>(url, payload, {
      withCredentials: true
    });
  }
}
