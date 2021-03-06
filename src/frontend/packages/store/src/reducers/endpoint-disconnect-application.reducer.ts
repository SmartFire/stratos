import { IApp, StratosCFEntity } from '../../../core/src/core/cf-api.types';
import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint, UNREGISTER_ENDPOINTS_SUCCESS } from '../actions/endpoint.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';

// #3704 - These can be removed after this ticket is completed
export function endpointDisconnectRemoveEntitiesReducer() {
  return (state: IRequestEntityTypeState<any>, action: DisconnectEndpoint) => {
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
      case UNREGISTER_ENDPOINTS_SUCCESS:
        return deletionApplicationFromEndpoint(state, action.guid);
    }
    return state;
  };
}

function deletionApplicationFromEndpoint(
  state: IRequestEntityTypeState<APIResource<StratosCFEntity> | StratosCFEntity>,
  endpointGuid: string
) {
  return Object.keys(state).reduce((newEntities, guid) => {
    const entity = state[guid] as StratosCFEntity;
    const apiEntity = state[guid] as APIResource<StratosCFEntity>;
    if (apiEntity.entity) {
      if (apiEntity.entity.cfGuid !== endpointGuid && apiEntity.metadata.guid) {
        newEntities[guid] = entity;
      }
    } else {
      if (entity.cfGuid !== endpointGuid) {
        newEntities[guid] = entity;
      }
    }
    return newEntities;
  }, {});
}
