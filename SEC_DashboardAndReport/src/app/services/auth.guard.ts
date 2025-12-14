import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthServiceAD } from './auth-ad.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  constructor(private authServiceAd: AuthServiceAD, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //return true;
    if (this.authServiceAd.isLoggedIn()) {
      return true;
    }
    // Store the attempted URL for redirecting after login
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['login']);
    return false;
  }
}
