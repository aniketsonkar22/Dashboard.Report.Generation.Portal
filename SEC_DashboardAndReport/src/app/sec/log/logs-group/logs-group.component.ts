import { Component, Input, OnInit } from '@angular/core';
import { AuditLog } from '../../interfaces';
import { Router } from '@angular/router';

@Component({
    selector: 'app-logs-group',
    templateUrl: './logs-group.component.html',
    styleUrls: ['./logs-group.component.scss'],
    standalone: false
})
export class LogsGroupComponent implements OnInit {
  @Input() REPORT_LOG_DATA!: AuditLog[];
  @Input() type: string=''
  @Input() logId!: string;

  constructor(private router:Router) { }

  ngOnInit(): void {
  }

  goToReport(){
  this.router.navigate(['/reports',this.type])
  }
}
