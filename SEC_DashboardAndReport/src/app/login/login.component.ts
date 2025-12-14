import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthServiceAD } from "../services/auth-ad.service";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
    standalone: false
})
export class LoginComponent implements OnInit {
  isWorking = false;
  email: string = '';
  constructor(
    private router: Router,
    private authServiceAD: AuthServiceAD
  ) {}

  login(): void {
    // this.isWorking = true;
    // window.location.href =
    //   "https://sts.se.com.sa/adfs/ls/IdpInitiatedSignon.aspx";
    // this.isWorking = false;
    this.authServiceAD.login(this.email?.trim());
  }

  ngOnInit(): void {
    if (this.authServiceAD.isLoggedIn()) {
      this.router.navigate(["home"]);
      return;
    }
  }
}
