import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../core/src/features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import { GetAppAutoscalerPolicyTriggerAction } from '../../../store/app-autoscaler.actions';
import { AppScalingTrigger } from '../../../store/app-autoscaler.types';


export class AppAutoscalerMetricChartDataSource extends ListDataSource<APIResource<AppScalingTrigger>> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<APIResource<AppScalingTrigger>>
  ) {
    const action = new GetAppAutoscalerPolicyTriggerAction(null, appGuid, cfGuid);
    super(
      {
        store,
        action,
        schema: entityFactory(action.entityKey),
        getRowUniqueId: getRowMetadata,
        paginationKey: action.paginationKey,
        isLocal: true,
        listConfig
      }
    );
  }
}
