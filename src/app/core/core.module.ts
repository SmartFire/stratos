import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuardService } from './auth-guard.service';
import { MDAppModule } from './md.module';
import { SideNavService } from './side-nav-service/side-nav.service';

@NgModule({
  imports: [
    MDAppModule
  ],
  exports: [
    MDAppModule,
    RouterModule
  ],
  providers: [
    AuthGuardService,
    SideNavService
  ]
})
export class CoreModule { }
