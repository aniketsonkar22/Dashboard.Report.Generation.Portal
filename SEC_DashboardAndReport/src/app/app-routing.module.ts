import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KpiTableComponent } from './sec/kpi-table/kpi-table.component';

const routes: Routes = [
  { path: '', redirectTo: 'login' , pathMatch:'full'},
  {
    path: '',
    loadChildren: () =>
    import('./login/login.module').then((m) => m.LoginModule),
  },
  //  {
  //   path: 'kpi',
  //   children: [
  //     { path: '', redirectTo: 'bcp', pathMatch: 'full' },
  //     { path: 'bcp', component: BcpComponent },
  //     { path: 'dnt', component: DntComponent },
  //     { path: 'erc', component: ErcComponent }
  //   ]
  // },
  // Single KPI Route with type parameter
  {
    path: 'kpi/:type',
    component: KpiTableComponent,
    data: { title: 'KPI Management' }
  },

  // Redirect /kpi to /kpi/bcp as default
  {
    path: 'kpi',
    redirectTo: 'kpi/bcp',
    pathMatch: 'full'
  },
  {
    path: '',
    loadChildren: () =>
    import('./layout/layout.module').then((m) => m.LayoutModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
