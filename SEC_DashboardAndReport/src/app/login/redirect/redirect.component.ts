import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthServiceAD } from "src/app/services/auth-ad.service";


import jwt_decode from "jwt-decode";

@Component({
    selector: "app-redirect",
    templateUrl: "./redirect.component.html",
    styleUrls: ["./redirect.component.scss"],
    standalone: false
})
export class RedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authServiceAd: AuthServiceAD
  ) {}

  ngOnInit(): void {
    console.log("HERE")
    const token = this.route.snapshot.queryParams["token"];
    console.log(token)
    if (token) {
      localStorage.setItem("token", token);
      console.log('Token received:', token);
      this.authServiceAd.populateUserInfo().subscribe(() => {
        const redirectTo = localStorage.getItem("redirectUrl") || "kpi";
        this.authServiceAd.redirectUrl = null;
        this.router.navigate([redirectTo]);
      });
      return;
    }
    // fallback to login
    this.router.navigate(["login"]);
  }
}
