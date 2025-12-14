import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// Retail report service removed
import { saveAs } from 'file-saver';


@Component({
    selector: 'app-report-card',
    templateUrl: './report-card.component.html',
    styleUrls: ['./report-card.component.scss'],
    animations: [
        trigger('toggleReplies', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(-15px)' }),
                animate('350ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' })),
            ]),
        ]),
    ],
    standalone: false
})
export class ReportCardComponent implements OnInit {
  @Input() report: any;

  constructor(
    private router: Router,
  ) {}

  ngOnInit(): void {
    console.log(this.report)
  }
  goToReport() {
    this.router.navigate(['reports', this.report.title]);
  }
  downloadReport() {
    // Retail report service removed - placeholder functionality
    console.log('Download report - functionality removed');
  }
  // Helper function to assign classes based on the status
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Under Review':
        return 'status-review';
      case 'Complete':
        return 'status-approved';
      case 'Error':
        return 'status-error';
      default:
        return 'status-review';
    }
  }
}
