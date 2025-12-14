import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: "root",
})
export class LoginService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  private get apiUrl(): string { return (this.config.apiUrl || environment.apiUrl || ''); }

  getLoginUrl() {
    return this.http.get<{ data: string; message: string; success: boolean }>(
      `${this.apiUrl}/api/auth/adfs/login`,
      {
        params: {
          redirect_uri: `${window.location.origin}/redirect`,
          withCredentials: true,
        },
        withCredentials: true,
      }
    );
  }

  getAccessToken(code: string) {
    return this.http.post<{ data: string; message: string; success: boolean }>(
      `${this.apiUrl}/api/auth/adfs/sso/callback`,
      { code: code },
      {
        params: {
          redirect_url: `${window.location.origin}/adfs/ls`,
          withCredentials: true,
        },
        withCredentials: true,
      }
    );
  }
}
