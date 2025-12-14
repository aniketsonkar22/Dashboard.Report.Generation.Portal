import { Component, OnInit } from '@angular/core';
import {
  CommentItem,
  Report,
  AuditLog,
  Notification,
  reportType,
} from '../interfaces';
import { timestamp } from 'rxjs';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    animations: [
    // Add any animations here if needed
    ],
    standalone: false
})
export class DashboardComponent implements OnInit {
  // User info
  userRole: string = '';
  userName: string = '';
  userId: string = '';

  // Mock data for dashboard
  reportCards: any[] = [];
  reportsOverview: any = {};
  logs: AuditLog[] = [];
  notifications: Notification[] = [];
  comments: CommentItem[] = [];
  reportStages: any[] = [];

  constructor(
    private authService: AuthServiceAD
  ) {}

  ngOnInit(): void {
    // Initialize with mock data
    this.reportStages = [
      { id: '1', name: 'Stage 1', description: 'Initial stage' },
      { id: '2', name: 'Stage 2', description: 'Review stage' }
    ];
    
    this.buildReportCards();
    this.buildReportsOverview();
    
    // Initialize empty arrays
    this.logs = [];
    this.notifications = [];
    this.comments = [];
    
    this.authService.userInfoGetter.subscribe((data) => {
      console.log('GETTER', data);
      this.userRole = data.data.role;
      this.userName = data.data.name;
      this.userId = data.data.id;
    });
  }

  private buildReportCards(): void {
    // Mock report cards
    this.reportCards = [
      {
        title: 'Distribution',
        description: 'Distribution reports',
        status: 'Active',
        icon: 'assessment'
      },
      {
        title: 'Retail',
        description: 'Retail reports',
        status: 'Active',
        icon: 'store'
      }
    ];
  }

  private buildReportsOverview(): void {
    // Mock reports overview
    this.reportsOverview = {
      total: 10,
      pending: 3,
      approved: 7
    };
  }

  downloadReport(): void {
    // Retail report service removed - placeholder functionality
    console.log('Download transformed reports - functionality removed');
  }

  getIconByTitle(title: string): string {
    switch (title.toLowerCase()) {
      case 'distribution':
        return 'assessment';
      case 'retail':
        return 'store';
      case 'transmission':
        return 'power';
      case 'system operator':
        return 'settings';
      default:
        return 'insert_drive_file';
    }
  }
}