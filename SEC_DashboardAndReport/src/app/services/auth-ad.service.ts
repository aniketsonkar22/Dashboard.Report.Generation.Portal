import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';

import { environment } from '../../environments/environment'
import { ConfigService } from './config.service'


@Injectable({
  providedIn: 'root',
})
export class AuthServiceAD {
  private _userInfo: any | null = null; // Holds the user information
  private userInfoSubject = new BehaviorSubject<any | null>(null); // Reactive user info
  userInfo$: Observable<any | null> = this.userInfoSubject.asObservable(); // Observable for user info changes
  redirectUrl: string | null = null; // To store the URL to redirect after login
  private get apiBase(): string { return (this.config.apiUrl || environment.apiUrl || ''); }
  private get apiUrl(): string { return this.apiBase + '/api/v1/auth'; }
  private simulateLogin: boolean = false;
  constructor(private http: HttpClient, private router: Router, private config: ConfigService) {
    // no seeding in real flow
  }

  /**
   * Checks if the user is logged in by verifying user info existence
   */
  isLoggedIn(): boolean {
    return !!this._userInfo;
  }

  /**
   * Initiates login by redirecting to the backend login endpoint
   */
  login(email?: string): void {
    // if (!environment.production) {
      //call backend url with email as parameter and redirect to the backend url

      const emailParam = (email && email.length > 0) ? encodeURIComponent(email) : '';
      const url = this.apiUrl + '/simulate-login' + (emailParam ? ('?email=' + emailParam) : '');
      window.location.href = url;
      
      return;
    // }
    // Prod flow: redirect to ADFS authorization via backend
    // window.location.href = this.apiUrl + '/login';
  }
  // login(): void {
  //   if (!environment.production) {
  //     // Dev flow: ask backend to mint a token and proceed
  //     this.http.post<any>(this.apiUrl + '/dev/token', { email: 'aniket.sonkar@test.com' })
  //     // this.http.post<any>(this.apiUrl + '/dev/token', { email: 'nadim.chaftari@artefact.com' })
  //       .pipe(
  //         tap(res => {
  //           console.log('Token response:', res);
  //           if (res?.data.token) {
  //             localStorage.setItem('token', res.data.token);
  //           }
  //         }),
  //       )
  //       .subscribe({
  //         next: () => {
  //           this.populateUserInfo().subscribe(() => this.router.navigate(['kpi']));
  //         },
  //         error: () => {
  //         }
  //       });
  //     return;
  //   }
  //   // Prod flow: redirect to ADFS authorization via backend
  //   window.location.href = this.apiUrl + '/login';
  // }

  /**
   * Fetch and populate user info from the backend
   */
  populateUserInfo(): Observable<void> {
    if (this.simulateLogin && this._userInfo) {
      this.userInfoSubject.next(this._userInfo);
      return of();
    }
    return this.http.get<any>( this.apiUrl+ '/user', { withCredentials: true }) // Fetch user session data
      .pipe(
        tap((res) => {
          if (res) {
            this._userInfo = res; // Store user info
            this.userInfoSubject.next(res); // Update observable
          }
        }),
        catchError((error) => {
          console.error('Error fetching user info:', error);
          this._userInfo = null; // Clear user info on error
          // for development purposes
          this._userInfo = {data: {data: {role: 'admin'}}}; // Clear user info on error

          this.userInfoSubject.next(null);
          return of(); // Return an empty observable to avoid breaking the stream
        })
      );
  }

  /**
   * Logs out the user by clearing the session and redirecting to the login page
   */
  logout(): void {
    this.http.get(this.apiUrl + '/logout', { withCredentials: true }) // Backend API for logout
      .pipe(
        tap(() => {
          this._userInfo = null; // Clear cached user info
          this.userInfoSubject.next(null); // Notify observers
          // localStorage.removeItem('token');
          this.router.navigate(['/login']); // Navigate to login page
        }),
        catchError((error) => {
          console.error('Error during logout:', error);
          return of(); // Return an empty observable on error
        })
      )
      .subscribe();
  }

  /**
   * Get the current user info
   */
  get userInfo(): any | null {
    return this._userInfo;
  }
    get userInfoGetter(){
    return this.userInfoSubject;
  }

}
