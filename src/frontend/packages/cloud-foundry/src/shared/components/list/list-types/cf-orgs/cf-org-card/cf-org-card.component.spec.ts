import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { ISpace } from '../../../../../../../../core/src/core/cf-api.types';
import { EntityServiceFactory } from '../../../../../../../../core/src/core/entity-service-factory.service';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { EntityMonitorFactory } from '../../../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { MetadataCardTestComponents } from '../../../../../../../../core/test-framework/core-test.helper';
import { getInitialTestStoreState, testSessionData } from '../../../../../../../../core/test-framework/store-test-helper';
import { VerifiedSession } from '../../../../../../../../store/src/actions/auth.actions';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import {
  generateCfBaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { CfOrgCardComponent } from './cf-org-card.component';

describe('CfOrgCardComponent', () => {
  let component: CfOrgCardComponent;
  let fixture: ComponentFixture<CfOrgCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CfOrgCardComponent,
        MetadataCardTestComponents
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        PaginationMonitorFactory,
        EntityMonitorFactory,
        generateTestCfUserServiceProvider(),
        CfOrgSpaceDataService,
        generateTestCfEndpointServiceProvider(),
        EntityServiceFactory,
        ConfirmationDialogService
      ]
    })
      .compileComponents();

    const store = TestBed.get(Store);
    store.dispatch(new VerifiedSession(testSessionData));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfOrgCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        spaces: Object.values(getInitialTestStoreState().requestData.cfSpace) as APIResource<ISpace>[],
        guid: '',
        cfGuid: '',
        name: 'test0',
        private_domains: [{
          entity: {
            guid: 'test',
            cfGuid: 'test'
          },
          metadata: null
        }],
        quota_definition: {
          entity: {
            memory_limit: 1000,
            app_instance_limit: -1,
            instance_memory_limit: -1,
            name: '',
            trial_db_allowed: true,
            app_task_limit: 1,
            total_service_keys: 1,
            total_reserved_route_ports: 1,
            total_services: -1,
            total_routes: -1
          },
          metadata: null
        }
      },
      metadata: {
        guid: '',
        created_at: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
