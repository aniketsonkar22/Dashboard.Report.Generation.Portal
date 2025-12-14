import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './services/notification.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = 'pc-app';
  constructor(public router: Router, private notifications: NotificationService) { }

  ngOnInit(): void {
    // Start SignalR connection when app boots
    this.notifications.start();
  }

}
