import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';

@Component({
    selector: 'app-navbar-sec',
    templateUrl: './navbar-sec.component.html',
    styleUrls: ['./navbar-sec.component.scss'],
    standalone: false
})
export class NavbarSecComponent implements OnInit {
  userName: string = 'User';
  userId!: string;
  isKpiActive = false; // Track if any KPI route is active

  notifications: Notification[] = [];

  constructor(
    private router: Router,
    private authService: AuthServiceAD,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isKpiActive = event.url.includes('/kpi');
      }
    });
  }

  ngOnInit(): void {
    let userInfo: any = this.authService.userInfo?.valueOf();
    this.userId = userInfo.data.data.id;
    this.userName = userInfo.data.data.name;
  }

  logout() {
    this.authService.logout();
  }
}