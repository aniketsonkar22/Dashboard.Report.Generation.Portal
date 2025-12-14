import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'
import { ConfigService } from './config.service'


export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private get baseUrl(): string { return (this.config.apiUrl || environment.apiUrl || ''); }
  private get apiUrl(): string { return this.baseUrl +  '/api/v1/users'; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl,{ withCredentials: true });
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user,{ withCredentials: true });
  }
  addUser(user: User): Observable<User> {
    console.log(user)
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<User>(`${this.apiUrl}`, user,{headers, withCredentials: true });
  }
  
 

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`,{ withCredentials: true });
  }
}
