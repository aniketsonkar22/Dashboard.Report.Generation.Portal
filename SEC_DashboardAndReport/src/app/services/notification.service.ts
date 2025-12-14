import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import * as signalR from "@microsoft/signalr";
import { MatSnackBar } from "@angular/material/snack-bar";
import { environment } from "../../environments/environment";
import { ConfigService } from "./config.service";
import {
  Notification,
  AuditLog,
  UserNotification,
  NotificationApiResponse,
} from "../sec/interfaces";
import { LogService } from "./log.service";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private hubConnection?: any;
  private isConnecting = false;
  private receivedMessageSubject = new BehaviorSubject<string | null>(null);
  private newNotificationSubject = new Subject<Notification>();

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private config: ConfigService,
    private logService: LogService
  ) {}

  private get baseUrl(): string {
    return this.config.apiUrl || environment.apiUrl || "";
  }
  private get apiUrl(): string {
    return this.baseUrl + "/api/common/notification";
  }
  private get hubUrl(): string {
    // Prefer explicit env hub URL. Otherwise, compose from baseUrl or default to same-origin path
    if (environment.signalRHubUrl && environment.signalRHubUrl.length > 0) {
      return environment.signalRHubUrl;
    }
    if (this.baseUrl && this.baseUrl.length > 0) {
      return `${this.baseUrl}/notificationHub`;
    }
    return "/notificationHub";
  }

  // SignalR message stream (raw string payloads)
  get messages$(): Observable<string | null> {
    return this.receivedMessageSubject.asObservable();
  }

  // Higher-level event stream for new notifications
  onNewNotification(): Observable<Notification> {
    return this.newNotificationSubject.asObservable();
  }

  // Establish SignalR connection to the backend hub
  start(): void {
    if (this.hubConnection) {
      console.log('SignalR connection already exists, state:', this.hubConnection.state);
      return;
    }
    if (this.isConnecting) {
      console.log('SignalR connection attempt already in progress');
      return;
    }

    console.log('Starting SignalR connection to:', this.hubUrl);
    console.log('Environment:', environment.production ? 'production' : 'development');
    console.log('API URL:', this.baseUrl);
    // setTimeout(() => {
      this.tryConnectWithFallback();
    // }, 5000);
  }

  private tryConnectWithFallback(): void {
    this.isConnecting = true;
    const tokenFactory = () => localStorage.getItem('token') || '';

    const builder = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.Debug);
    const createConnection = (options: any) => builder
      .withUrl(this.hubUrl, options)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: any) => {
          console.log(`SignalR reconnection attempt ${retryContext.previousRetryCount + 1}`);
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      })
      .build();

    const attachHandlers = () => {
      if (!this.hubConnection) return;
      this.hubConnection.on("ReceiveNotification", (payload: any) => {
        console.log('Received SignalR notification:', payload);
        this.receivedMessageSubject.next(
          typeof payload === "string" ? payload : JSON.stringify(payload)
        );
        const mapped = this.mapIncomingPayloadToNotification(payload);
        this.newNotificationSubject.next(mapped);
      });
      this.hubConnection.onclose((error: Error | undefined) => {
        if (error) {
          console.error('SignalR connection closed with error:', error);
        } else {
          console.log('SignalR connection closed');
        }
      });
      this.hubConnection.onreconnecting((error: Error | undefined) => {
        console.log('SignalR reconnecting...', error);
      });
      this.hubConnection.onreconnected((connectionId: string | undefined) => {
        console.log('SignalR reconnected with connection ID:', connectionId);
      });
    };

    const startWithOptions = (options: any): Promise<void> => {
      this.hubConnection = createConnection(options);
      attachHandlers();
      return this.hubConnection.start();
    };

    // 1) Try direct WebSockets without negotiation
    startWithOptions({
      withCredentials: false,
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: true,
      accessTokenFactory: tokenFactory
    })
      .then(() => {
        console.log('SignalR connection established successfully with WebSockets (skipNegotiation)');
        this.isConnecting = false;
      })
      .catch((firstErr: unknown) => {
        console.error('SignalR WebSockets (skipNegotiation) failed:', firstErr);
        if (this.hubConnection) {
          this.hubConnection.stop().catch(() => {});
          this.hubConnection = undefined;
        }

        // 2) Fallback to negotiated connection (let server decide transport)
        startWithOptions({
          withCredentials: false,
          skipNegotiation: false,
          accessTokenFactory: tokenFactory
        })
          .then(() => {
            console.log('SignalR connection established successfully with negotiated transport');
            this.isConnecting = false;
          })
          .catch((secondErr: unknown) => {
            console.error('SignalR negotiated connection failed:', secondErr);
            if (this.hubConnection) {
              this.hubConnection.stop().catch(() => {});
              this.hubConnection = undefined;
            }
            this.isConnecting = false;
          });
      });
  }

  private mapIncomingPayloadToNotification(payload: any): Notification {
    // Payload example from SignalR:
    // {
    //   notificationId: 59,
    //   description: '...',
    //   departmentId: 'uuid',
    //   kpiId: 'uuid',
    //   logId: 'uuid',
    //   actionType: 2,
    //   isRead: false,
    //   createdAt: '2025-10-28T12:24:37.7691692',
    //   userId: 'uuid'
    // }
    const actionType = String(payload?.actionType ?? '');
    const hasKpi = !!payload?.kpiId;
    const category = payload?.departmentId ? 'Department' : 'General';
    return {
      id: payload?.notificationId ?? payload?.id ?? Date.now(),
      message: payload?.description ?? '',
      type: actionType,
      reportType: hasKpi ? 'KpiNotification' : 'GeneralNotification',
      category,
      roleId: '',
      departmentId: payload?.departmentId,
      kpiId: payload?.kpiId,
      commentId: payload?.commentId,
      read: !!payload?.isRead,
      timestamp: payload?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date(payload?.createdAt ?? Date.now())
    } as Notification;
  }

  // Tear down SignalR connection
  stop(): void {
    if (!this.hubConnection) return;
    this.hubConnection.stop().catch(() => {});
    this.hubConnection = undefined;
  }

  // Test connection and get debug information
  getConnectionInfo(): any {
    if (!this.hubConnection) {
      return { connected: false, state: 'Not started', transport: null };
    }
    
    return {
      connected: this.hubConnection.state === signalR.HubConnectionState.Connected,
      state: this.hubConnection.state,
      transport: this.hubConnection.transport,
      hubUrl: this.hubUrl,
      connectionId: this.hubConnection.connectionId
    };
  }

  // Test SignalR connection with a simple ping
  testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
        console.log('SignalR connection not available for testing');
        resolve(false);
        return;
      }

      // Try to invoke a test method on the hub
      this.hubConnection.invoke('Ping')
        .then(() => {
          console.log('SignalR test ping successful');
          resolve(true);
        })
        .catch((error: any) => {
          console.log('SignalR test ping failed:', error);
          resolve(false);
        });
    });
  }

  // Fetch notifications using the new Notifications API
  getNotificationsByRole(
    roleId: string,
    userId: any,
    isOverview: boolean = false
  ): Observable<Notification[]> {
    console.log('GET NOTIFICATIONS BY ROLE',  userId);
    return this.http
      .get<NotificationApiResponse>(
        `${this.baseUrl}/api/v1/notifications?userId=${userId}`
      , { withCredentials: true })
      .pipe(
        map((response: NotificationApiResponse) =>
          response.data.map(
            (notification: UserNotification) =>
              ({
                id: notification.notificationId,
                message: notification.description,
                type: notification.actionType,
                reportType: notification.kpiId
                  ? "KpiNotification"
                  : "GeneralNotification",
                category: notification.departmentId ? "Department" : "General",
                roleId: roleId,
                kpiId: notification.kpiId,
                departmentId: notification.departmentId,
                commentId: notification.commentId,
                read: notification.isRead,
                timestamp: notification.createdAt,
                updatedAt: new Date(notification.createdAt), // Use createdAt since there's no updatedAt
              } as Notification)
          )
        )
      );
  }

  // REST: mark a notification as read using new API
  markAsRead(id: number, userId: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/api/v1/notifications/${id}/mark-read?userId=${userId}`,
      {},
      { withCredentials: true }
    );
  }

  // UI helpers
  showSuccess(message: string, duration: number = 5000): void {
    this.snackBar.open(message, "Ok", {
      duration,
      panelClass: ["success-snackbar"],
    });
  }

  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, "Ok", {
      duration,
      panelClass: ["error-snackbar"],
    });
  }
}
