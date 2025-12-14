// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoaderService } from './loader.service';
import { NotificationService } from './notification.service';
import { AuthServiceAD } from './auth-ad.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router,
        private authService: AuthServiceAD,
        private loaderService: LoaderService,
        private notificationService: NotificationService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      console.log('Intercepting request:', req.url); // Add this line to confirm interception
    this.loaderService.show()
      // Pass-through without attaching Authorization header
      return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('Interceptor caught an error:', error); // Add this to confirm error handling
        if (error.status === 401) {
          // this.router.navigate(['/login']);
          this.authService.logout()
        }
        console.log('ERROR', error);
        this.notificationService.showError('Error: '+error.error.apiError.details, 5000)
        return throwError(() => error);
      }),
        finalize(() => {
            // Hide the loader when the request completes or errors out
            this.loaderService.hide();
        })
    );
  }
}
