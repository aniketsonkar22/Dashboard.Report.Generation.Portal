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
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NavbarSecComponent } from "./sec/navbar-sec/navbar-sec.component";
import { MatTabsModule } from "@angular/material/tabs";
import { CdkTableModule } from "@angular/cdk/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CorsInterceptor } from "./services/cors.interceptor";
import { SharedModule } from "./shared/shared.module";
import { MatSortModule } from "@angular/material/sort";
import { StepperComponent } from "./sec/stepper/stepper.component";
import { LoaderComponent } from "./sec/loader/loader.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { AuthServiceAD } from "./services/auth-ad.service";
import { AddKpiDialogComponent } from "./sec/add-kpi-dialog/add-kpi-dialog.component";
import { BcpComponent } from "./sec/kpis/bcp/bcp.component";
import { DntComponent } from "./sec/kpis/dnt/dnt.component";
import { ErcComponent } from "./sec/kpis/erc/erc.component";

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
    AddKpiDialogComponent,
    BcpComponent,
    DntComponent,
    ErcComponent,
    NavbarSecComponent,
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
      useClass: CorsInterceptor,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
