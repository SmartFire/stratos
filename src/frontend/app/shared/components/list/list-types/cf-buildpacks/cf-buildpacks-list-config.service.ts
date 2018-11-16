import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IBuildpack } from '../../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfBuildpackCardComponent } from './cf-buildpack-card/cf-buildpack-card.component';
import { CfBuildpacksDataSource } from './cf-buildpacks-data-source';

@Injectable()
export class CfBuildpacksListConfigService extends BaseCfListConfig<APIResource<IBuildpack>> {
  cardComponent = CfBuildpackCardComponent;
  dataSource: CfBuildpacksDataSource;
  isLocal = true;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no buildpacks',
    error: 'Failed to display buildpacks'
  };
  columns: ITableColumn<APIResource>[] = [{
    columnId: 'position',
    headerCell: () => 'Position',
    sort: {
      type: 'sort',
      orderKey: 'position',
      field: 'entity.position'
    },
  }, {
    columnId: 'name',
    headerCell: () => 'Name',
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'entity.name'
    }
  }, {
    columnId: 'createdAt',
    headerCell: () => 'Creation',
    sort: {
      type: 'sort',
      orderKey: 'createdAt',
      field: 'metadata.created_at'
    },
  }];
  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfBuildpacksDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
