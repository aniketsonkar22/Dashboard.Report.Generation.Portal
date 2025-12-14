import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { User, CreateUserRequest, PaginatedResponse, PaginationParams, UserRole, Department } from '../sec/interfaces';
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private get baseUrl(): string { return (this.config.apiUrl || environment.apiUrl || ''); }
  private get apiUrl(): string { return `${this.baseUrl}/api/v1/users`; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  // GET /api/users
  getUsers(params?: PaginationParams): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    console.log('UserApiService: Making request to:', this.apiUrl);
    console.log('UserApiService: With params:', httpParams.toString());
    
    return this.http.get<any>(this.apiUrl, { params: httpParams ,withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error fetching users:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/users/{userId}
  getUserById(userId: string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error fetching user:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/users/email/{email}
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/email/${email}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error fetching user by email:', error);
        throw error;
      })
    );
  }

  // POST /api/v1/users
  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<any>(this.apiUrl, user, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error creating user:', error);
        throw error;
      })
    );
  }

  // PUT /api/v1/users/{userId}
  updateUser(userId: string, user: Partial<CreateUserRequest>): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/${userId}`, user, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error updating user:', error);
        throw error;
      })
    );
  }

  // DELETE /api/v1/users/{userId}
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error deleting user:', error);
        throw error;
      })
    );
  }

  // PUT /api/v1/users/{userId}/department/{departmentId}
  assignUserToDepartment(userId: string, departmentId: string): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/${userId}/department/${departmentId}`, {}, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error assigning user to department:', error);
        throw error;
      })
    );
  }

  // DELETE /api/v1/users/{userId}/department
  removeUserFromDepartment(userId: string): Observable<User> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}/department`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error removing user from department:', error);
        throw error;
      })
    );
  }

  // GET /api/v1/users/{userId}/departments
  getUserDepartments(userId: string): Observable<Department[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/departments`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('UserApiService: Error fetching user departments:', error);
        throw error;
      })
    );
  }
}
