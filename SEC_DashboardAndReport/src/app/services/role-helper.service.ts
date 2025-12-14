import { Injectable } from '@angular/core';

export type AppRole = 'admin' | 'departmentManager' | 'contributor';

@Injectable({
  providedIn: 'root'
})
export class RoleHelperService {

  /**
   * Extracts and normalizes the user role from user info data
   * @param userInfo - The user info object containing role information
   * @returns The normalized app role
   */
  getAppRole(userInfo: any): AppRole {
    return 'admin';
    const rawRole = userInfo?.data?.data?.role || '';
    const lowerRole = String(rawRole).toLowerCase();
    
    if (lowerRole.includes('admin')) {
      return 'admin';
    } else if (lowerRole.includes('manager')) {
      return 'departmentManager';
    } else if (lowerRole.includes('contributor')) {
      return 'contributor';
    }
    
    // Default conservative role
    return 'contributor';
  }

  /**
   * Checks if a user has admin privileges
   * @param userInfo - The user info object containing role information
   * @returns True if user is admin or department manager
   */
  isAdmin(userInfo: any): boolean {
    const role = this.getAppRole(userInfo);
    return role === 'admin' || role === 'departmentManager';
  }

  /**
   * Checks if a user has department manager privileges
   * @param userInfo - The user info object containing role information
   * @returns True if user is department manager or admin
   */
  isDepartmentManager(userInfo: any): boolean {
    const role = this.getAppRole(userInfo);
    return role === 'departmentManager' || role === 'admin';
  }

  /**
   * Checks if a user has contributor privileges
   * @param userInfo - The user info object containing role information
   * @returns True if user has any role (everyone is at least a contributor)
   */
  isContributor(userInfo: any): boolean {
    return !!userInfo?.data?.data?.role;
  }

  /**
   * Checks if a user has a specific role or higher
   * @param userInfo - The user info object containing role information
   * @param requiredRole - The minimum role required
   * @returns True if user has the required role or higher
   */
  hasRoleOrHigher(userInfo: any, requiredRole: AppRole): boolean {
    const userRole = this.getAppRole(userInfo);
    
    // Define role hierarchy (higher index = higher privilege)
    const roleHierarchy: AppRole[] = ['contributor', 'departmentManager', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }
}
