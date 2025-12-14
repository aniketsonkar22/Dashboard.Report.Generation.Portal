import { Component, Input, OnInit } from '@angular/core';
import { AuditLog } from '../../interfaces';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-log-item',
    templateUrl: './log-item.component.html',
    styleUrls: ['./log-item.component.scss'],
    animations: [
        trigger('toggleReplies', [
            transition(':enter', [
                style({ height: '0', opacity: 0 }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ height: '0', opacity: 0 }))
            ])
        ])
    ],
    standalone: false
})
export class LogItemComponent implements OnInit {
  // @Input() commentText: string = '';
  // // @Input() status: string = 'Actioned';
  // @Input() userName: string = 'Njoud Mahmoud';
  // @Input() department: string = 'Revenue Assurance & Accounts Receivable';
  // @Input() timestamp: string = '3 hours ago';
  @Input() logItem!: AuditLog;
  @Input() logId!: string;

  constructor() {}

  ngOnInit(): void {
    let temp = this.logId;
    this.logId = '0';

    setTimeout(() => {
      this.logId = temp;
    }, 1000);
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
        return 'history';
    }
  }
}
