import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { CreateQuotaStepComponent } from './create-quota-step.component';
import { CFBaseTestModules } from '../../../../../../cloud-foundry/test-framework/cf-test-helper';

describe('CreateQuotaStepComponent', () => {
  let component: CreateQuotaStepComponent;
  let fixture: ComponentFixture<CreateQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateQuotaStepComponent, QuotaDefinitionFormComponent],
      imports: [...CFBaseTestModules],
      providers: [PaginationMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
