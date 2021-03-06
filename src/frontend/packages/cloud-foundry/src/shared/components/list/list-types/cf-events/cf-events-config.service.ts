import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, first, map } from 'rxjs/operators';

import { CfEvent } from '../../../../../../../core/src/core/cf-api.types';
import { arraysEqual } from '../../../../../../../core/src/core/utils.service';
import {
  valueOrCommonFalsy,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-pagination-controller';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  ListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { AddParams, RemoveParams } from '../../../../../../../store/src/actions/pagination.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { CFAppState } from '../../../../../cf-app-state';
import { QParam, QParamJoiners } from '../../../../q-param';
import { CfEventsDataSource } from './cf-events-data-source';
import { TableCellEventActeeComponent } from './table-cell-event-actee/table-cell-event-actee.component';
import { TableCellEventActionComponent } from './table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from './table-cell-event-detail/table-cell-event-detail.component';
import { TableCellEventTimestampComponent } from './table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from './table-cell-event-type/table-cell-event-type.component';

export class CfEventsConfigService extends ListConfig<APIResource> implements IListConfig<APIResource<CfEvent>> {

  static acteeColumnId = 'actee';
  eventSource: CfEventsDataSource;

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'actor', headerCell: () => 'Actor', cellComponent: TableCellEventActionComponent, cellFlex: '2'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cellComponent: TableCellEventTypeComponent, cellFlex: '2'
    },
    {
      columnId: CfEventsConfigService.acteeColumnId,
      headerCell: () => 'Actee',
      cellComponent: TableCellEventActeeComponent,
      cellFlex: '3',
      cellConfig: {
        setActeeFilter: (actee: string) => this.setActeeFilter(actee)
      }
    },
    {
      columnId: 'detail', headerCell: () => 'Detail', cellComponent: TableCellEventDetailComponent, cellFlex: '6'
    },
    {
      columnId: 'timestamp',
      headerCell: () => 'Timestamp',
      cellComponent: TableCellEventTimestampComponent,
      sort: true,
      cellFlex: '3'
    },
  ];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null,
    noEntries: 'There are no events'
  };

  constructor(
    private store: Store<CFAppState>,
    cfGuid?: string,
    orgGuid?: string,
    spaceGuid?: string,
    public acteeGuid?: string,
  ) {
    super();
    if (acteeGuid) {
      this.columns = this.columns.filter(column => column.columnId !== CfEventsConfigService.acteeColumnId);
    }

    this.eventSource = new CfEventsDataSource(
      store,
      cfGuid,
      this,
      orgGuid,
      spaceGuid,
      acteeGuid,
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.eventSource;
  getMultiFiltersConfigs = () => [];

  setActeeFilter(actee: string) {
    this.getEventFilters().pipe(
      first()
    ).subscribe(currentFilters => {
      this.setEventFilters({
        actee,
        type: currentFilters.type
      });
    });
  }

  setEventFilters(values: { actee: string, type: string[] }) {
    this.getEventFilters().pipe(
      first()
    ).subscribe(currentFilters => {
      const action = this.eventSource.action as PaginatedAction;


      const addQs: { [key: string]: string } = {};
      const removeQs: string[] = [];

      if (!arraysEqual(values.type, currentFilters.type)) {
        if (!!values.type && !!values.type.length) {
          addQs.type = new QParam('type', values.type, QParamJoiners.in).toString();
        } else {
          removeQs.push('type');
        }
      }

      if (valueOrCommonFalsy(values.actee) !==
        valueOrCommonFalsy(currentFilters.actee)) {

        if (!!values.actee && !!values.actee.length) {
          addQs.actee = new QParam('actee', values.actee, QParamJoiners.in).toString();
        } else {
          removeQs.push('actee');
        }
      }

      if (!!Object.keys(addQs).length) {
        const existingQ: { [key: string]: string } = {} = {};
        if (currentFilters.type && currentFilters.type.length) {
          existingQ.type = new QParam('type', currentFilters.type, QParamJoiners.in).toString();
        }
        if (currentFilters.actee) {
          existingQ.actee = new QParam('actee', currentFilters.actee, QParamJoiners.in).toString();
        }
        const newQ = {
          ...existingQ,
          ...addQs
        };
        this.store.dispatch(new AddParams(action, this.eventSource.paginationKey, { q: Object.values(newQ) }));
      }
      if (!!removeQs.length) {
        this.store.dispatch(new RemoveParams(action, action.paginationKey, [], removeQs));
      }
    });
  }

  getEventFilters(): Observable<{
    type: string[],
    actee: string
  }> {
    return this.getDataSource().pagination$.pipe(
      distinctUntilChanged(),
      map(pag => QParam.fromStrings(pag.params.q as string[])),
      map(qParams => {
        const qType = qParams.find(qParam => qParam.key === 'type');
        const qActee = qParams.find(qParam => qParam.key === 'actee');
        return {
          type: qType ? (qType.value as string).split(',') : [],
          actee: qActee ? qActee.value as string : undefined
        };
      })
    );
  }
}
