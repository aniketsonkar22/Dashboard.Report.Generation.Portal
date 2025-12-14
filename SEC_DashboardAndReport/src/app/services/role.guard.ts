import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthServiceAD } from './auth-ad.service';
import { RoleHelperService, AppRole } from './role-helper.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard  {
  constructor(
    private auth: AuthServiceAD, 
    private router: Router,
    private roleHelper: RoleHelperService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const allowRoles: string[] = route.data?.['allowRoles'] || [];
    const role = this.roleHelper.getAppRole(this.auth.userInfo);
    if (allowRoles.length === 0) {
      return true;
    }
    if (allowRoles.includes(role)) {
      return true;
    }
    return this.router.parseUrl('/kpi');
  }
}


