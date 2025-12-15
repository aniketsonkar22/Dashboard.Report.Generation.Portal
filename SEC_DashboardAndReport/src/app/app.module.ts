import { NgModule, inject, provideAppInitializer } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { MatSidenavModule } from "@angular/material/sidenav";
import {
  BrowserAnimationsModule,
  NoopAnimationsModule,
} from "@angular/platform-browser/animations";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";

import { MatDialogModule } from "@angular/material/dialog";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { OverlayModule } from "@angular/cdk/overlay";
import { A11yModule } from "@angular/cdk/a11y";
import { MatMenuModule } from "@angular/material/menu";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatChipsModule } from "@angular/material/chips";
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import {
  ScrollEndDirective,
  ScrollEndRootDirective,
} from "./intersectionDirective";
import { catchError, Observable, of } from "rxjs";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { MatBadgeModule } from "@angular/material/badge";
import { ReportCardComponent } from "./sec/report-card/report-card.component";
import { DashboardComponent } from "./sec/dashboard/dashboard.component";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTooltipModule } from "@angular/material/tooltip";
import { KpiTableComponent } from "./sec/kpi-table/kpi-table.component";
import { NavbarSecComponent } from "./sec/navbar-sec/navbar-sec.component";
import { CommentsPageComponent } from "./sec/comments/comments-page/comments-page.component";
import { LogsPageComponent } from "./sec/log/logs-page/logs-page.component";
import { MatTabsModule } from "@angular/material/tabs";
import { CommentItemComponent } from "./sec/comments/comment-item/comment-item.component";
import { LogItemComponent } from "./sec/log/log-item/log-item.component";
import { CdkTableModule } from "@angular/cdk/table";
import { LogsGroupComponent } from "./sec/log/logs-group/logs-group.component";
import { CommentsGroupComponent } from "./sec/comments/comments-group/comments-group.component";
import { CommentDialogComponent } from "./sec/comments/comment-dialog/comment-dialog.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ReplyDialogComponent } from "./sec/reply-dialog/reply-dialog.component";
import { AuthInterceptor } from "./services/auth.interceptor";
import { CorsInterceptor } from "./services/cors.interceptor";
import { UserListComponent } from "./sec/admin/user-list/user-list.component";
import { UserEditDialogComponent } from "./sec/admin/user-edit-dialog/user-edit-dialog.component";
import { UserDeleteDialogComponent } from "./sec/admin/user-delete-dialog/user-delete-dialog.component";
import { AssignDepartmentDialogComponent } from "./sec/admin/assign-department-dialog/assign-department-dialog.component";
import { AssignKpiDialogComponent } from "./sec/admin/assign-kpi-dialog/assign-kpi-dialog.component";
import { DepartmentKpiEditDialogComponent } from "./sec/admin/department-kpi-edit-dialog/department-kpi-edit-dialog.component";
import { ViewDepartmentUsersDialogComponent } from "./sec/admin/department-list/view-department-users-dialog.component";
import { ViewKpiDepartmentsDialogComponent } from "./sec/admin/kpi-list/view-kpi-departments-dialog.component";
import { UnlockKpiDialogComponent } from "./sec/admin/unlock-kpi-dialog/unlock-kpi-dialog.component";
import { KpiEditDialogComponent } from "./sec/admin/kpi-edit-dialog/kpi-edit-dialog.component";
import { AdminPageComponent } from "./sec/admin/admin-page/admin-page.component";
import { DepartmentListComponent } from "./sec/admin/department-list/department-list.component";
import { DepartmentEditDialogComponent } from "./sec/admin/department-edit-dialog/department-edit-dialog.component";
import { DepartmentDeleteDialogComponent } from "./sec/admin/department-delete-dialog/department-delete-dialog.component";
import { KpiListComponent } from "./sec/admin/kpi-list/kpi-list.component";
import { KpiDeleteDialogComponent } from "./sec/admin/kpi-delete-dialog/kpi-delete-dialog.component";
import { SharedModule } from "./shared/shared.module";
import { MatSortModule } from "@angular/material/sort";
import { StepperComponent } from "./sec/stepper/stepper.component";
import { LoaderComponent } from "./sec/loader/loader.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { AuthServiceAD } from "./services/auth-ad.service";
import { AddKpiDialogComponent } from "./sec/add-kpi-dialog/add-kpi-dialog.component";

function initializeAppFactory(
  authService: AuthServiceAD
): () => Observable<any> {
  return () => authService.populateUserInfo();
}
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

const matModules = [
  BrowserAnimationsModule,
  MatSidenavModule,
  MatToolbarModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatDialogModule,
  MatBottomSheetModule,
  MatListModule,
  MatSelectModule,
  OverlayModule,
  MatMenuModule,
  MatAutocompleteModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonToggleModule,
  MatChipsModule,
  MatProgressSpinnerModule,
  MatBadgeModule,
  MatTableModule,
  MatPaginatorModule,
  MatStepperModule,
  MatTooltipModule,
  MatTabsModule,
  CdkTableModule,
  A11yModule,
  MatCheckboxModule,
  MatSortModule,
  SharedModule,
  MatSnackBarModule,
  MatDatepickerModule,
  MatNativeDateModule,
];
@NgModule({
  declarations: [
    AppComponent,
    ScrollEndDirective,
    ScrollEndRootDirective,
    ReportCardComponent,
    DashboardComponent,
    KpiTableComponent,
    AddKpiDialogComponent,
    NavbarSecComponent,
    CommentsPageComponent,
    LogsPageComponent,
    CommentItemComponent,
    LogItemComponent,
    LogsGroupComponent,
    CommentsGroupComponent,
    CommentDialogComponent,
    ReplyDialogComponent,
    UserListComponent,
    UserEditDialogComponent,
    UserDeleteDialogComponent,
    AssignDepartmentDialogComponent,
    AssignKpiDialogComponent,
    DepartmentKpiEditDialogComponent,
    KpiEditDialogComponent,
    ViewDepartmentUsersDialogComponent,
    ViewKpiDepartmentsDialogComponent,
    UnlockKpiDialogComponent,
    AdminPageComponent,
    DepartmentListComponent,
    DepartmentEditDialogComponent,
    DepartmentDeleteDialogComponent,
    KpiListComponent,
    KpiDeleteDialogComponent,
    StepperComponent,
    LoaderComponent,
  ],
  exports: [],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSidenavModule,
    matModules,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    InfiniteScrollModule,
    TranslateModule.forRoot({
      defaultLanguage: "English",
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    BrowserAnimationsModule,
  ],
  providers: [
    provideAppInitializer(() => {
      const initializerFn = initializeAppFactory(inject(AuthServiceAD));
      return initializerFn();
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorsInterceptor,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
