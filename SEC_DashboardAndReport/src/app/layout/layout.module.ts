import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AuthGuard } from '../services/auth.guard';
import { RoleGuard } from '../services/role.guard';
import { DashboardComponent } from '../sec/dashboard/dashboard.component';
// Report components removed
import { CommentsPageComponent } from '../sec/comments/comments-page/comments-page.component';
import { LogsPageComponent } from '../sec/log/logs-page/logs-page.component';
import { AdminPageComponent } from '../sec/admin/admin-page/admin-page.component';
import { KpiTableComponent } from '../sec/kpi-table/kpi-table.component';
import { KpiHistoryModule } from '../sec/kpi-history/kpi-history.module';
const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    // canActivate: [AuthGuard],
    children: [
      // { path: 'home', component: DashboardComponent },
      { path: 'kpi', component: KpiTableComponent },
      // { path: 'reports', component: ReportsComponent },
      // { path: 'reports/:id', component: ReportComponent },
      { path: 'comments', component: CommentsPageComponent },
      { path: 'comments/:id', component: CommentsPageComponent },
      { path: 'logs', component: LogsPageComponent },
      { path: 'logs/:id', component: LogsPageComponent },
      {
        path: 'admin',
        component: AdminPageComponent,
        canActivate: [RoleGuard],
        data: { allowRoles: ['admin', 'departmentManager'] },
      },
      { path: 'kpi-history/:departmentId/:kpiId', loadChildren: () => import('../sec/kpi-history/kpi-history.module').then(m => m.KpiHistoryModule) },
    ],
  },
];

@NgModule({
  declarations: [LayoutComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
})
export class LayoutModule {}
