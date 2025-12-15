import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErcService {
  private baseUrl = 'http://localhost:5069';
  private apiEndpoint = '/api/v1/erc';

  constructor(private http: HttpClient) {}

  getReports(params: any): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${this.apiEndpoint}`,
      {
        params,
        withCredentials: true
      }
    );
  }

  updateReport(id: string, payload: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${this.apiEndpoint}/${id}`,
      payload,
      { withCredentials: true }
    );
  }

  createReport(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}${this.apiEndpoint}`,
      payload,
      { withCredentials: true }
    );
  }
}
