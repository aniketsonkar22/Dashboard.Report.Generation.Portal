import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { Notification } from '../interfaces';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';
import { RoleHelperService, AppRole } from 'src/app/services/role-helper.service';

@Component({
    selector: 'app-navbar-sec',
    templateUrl: './navbar-sec.component.html',
    styleUrls: ['./navbar-sec.component.scss'],
    standalone: false
})
export class NavbarSecComponent implements OnInit {
  userName: string = 'User';
  userId!: string;
  userRole!: AppRole;
  isReportsActive = false;
  isKpiActive = false; // Track if any KPI route is active
  isMobileMenuOpen = false;
  wasMobileMenuOpen = false;

  notifications: Notification[] = [];

  constructor(
    private router: Router,
    private authService: AuthServiceAD,
    private notificationService: NotificationService,
    private roleHelper: RoleHelperService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check if the current URL contains '/reports'
        this.isReportsActive = event.url.includes('/reports');
        // Check if the current URL contains '/kpi'
        this.isKpiActive = event.url.includes('/kpi');
      }
    });
  }

  ngOnInit(): void {
    let userInfo: any = this.authService.userInfo?.valueOf();
    this.userId = userInfo.data.data.id;
    this.userRole = this.roleHelper.getAppRole(userInfo);
    this.userName = userInfo.data.data.name;
    console.log('USER INFO', this.userId, this.userRole, this.userName);
    this.loadNotifications();

    // Ensure SignalR is started and subscribe to mapped notifications
    this.notificationService.start();
    this.notificationService.onNewNotification().subscribe((notification) => {
      this.notifications.unshift({
        ...notification,
        roleId: this.userRole || ''
      });
    });
  }

  toggleMenu() {
    this.wasMobileMenuOpen = this.isMobileMenuOpen;
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenu() {
    this.wasMobileMenuOpen = this.isMobileMenuOpen;
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
  }

  loadNotifications(): void {
    this.notificationService
      .getNotificationsByRole(this.userRole, this.userId)
      .subscribe(
        (data) => {
          this.notifications = data;
          console.log('NOTIFICATIONS', this.notifications);
        },
        (error) => {
          console.error('Failed to load notifications', error);
        }
      );
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter(notification => !notification.read).length;
  }

  markAsRead(notification: any): void {
    console.log(notification.type);
    
    // Handle navigation based on notification type
    if (notification.type === 'KpiComment') {
      console.log('Notification:', notification);
      // Navigate to Comments page with department and KPI filters
      this.router.navigate(['comments'], {
        queryParams: {
          departmentId: notification.departmentId,
          kpiId: notification.kpiId,
          commentId: notification.commentId
        },
      });
    } else {
      // All other notification types go to Logs page
      this.router.navigate(['logs']);
    }

    this.notificationService.markAsRead(notification.id, this.userId).subscribe(
      () => {
        // Update the notification as read in the local array instead of removing it
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index].read = true;
        }
      },
      (error) => {
        console.error('Failed to mark notification as read', error);
      }
    );
  }

  getIconForType(type: string | undefined): string {
    switch (type) {
      case 'AssignKpiToDepartment':
        return 'add_chart';
      case 'KpiComment':
        return 'comment';
      case 'KpiEdit':
        return 'edit';
      case 'KpiApprove':
        return 'check_circle';
      case 'KpiLock':
        return 'lock';
      default:
        return 'info';
    }
  }
}