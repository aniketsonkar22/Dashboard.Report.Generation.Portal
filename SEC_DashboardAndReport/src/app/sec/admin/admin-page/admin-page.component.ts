import { Component, OnInit } from "@angular/core";
import { AuthServiceAD } from "src/app/services/auth-ad.service";
// import { MatDialog } from '@angular/material/dialog';
// import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
    selector: "app-admin-page",
    templateUrl: "./admin-page.component.html",
    styleUrls: ["./admin-page.component.scss"],
    standalone: false
})
export class AdminPageComponent implements OnInit {
  constructor(private authService: AuthServiceAD) {}
  status!: string;

  ngOnInit(): void {}

  generateHistorical() {
    console.log('Generate historical data - functionality removed');
  }
  get isAdmin(): boolean {
    const userInfo: any = this.authService.userInfo?.valueOf();
    const userRole = userInfo.data.data.role;
    // console.log('USER ROLE', userInfo);
    return userRole.toLowerCase() === 'admin';
  }

}
