import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BcpComponent } from './sec/kpis/bcp/bcp.component';
import { DntComponent } from './sec/kpis/dnt/dnt.component';
import { ErcComponent } from './sec/kpis/erc/erc.component';

const routes: Routes = [
  { path: '', redirectTo: 'login' , pathMatch:'full'},
  {
    path: '',
    loadChildren: () =>
    import('./login/login.module').then((m) => m.LoginModule),
  },
  
  // Redirect /kpi to /kpi/bcp as default
  {
    path: 'kpi',
    children: [
      { path: '', redirectTo: 'bcp', pathMatch: 'full' },
      { 
        path: 'bcp', 
        component: BcpComponent,
        data: { title: 'BCPs Review & Update' }
      },
      { 
        path: 'dnt', 
        component: DntComponent,
        data: { title: 'Drills & Tests Conducted' }
      },
      { 
        path: 'erc', 
        component: ErcComponent,
        data: { title: 'External Requirements Closure' }
      }
    ]
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
