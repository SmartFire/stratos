import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../cf-types';
import { GetOrganization } from '../../actions/organization.actions';
import { GetSpace } from '../../actions/space.actions';
import {
  cfUserEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../cf-entity-schema-types';
import { getCFEntityKey } from '../../cf-entity-helpers';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { APIResponse } from '../../../../store/src/actions/request.actions';
import { GeneralEntityAppState, GeneralRequestDataState, IRequestEntityTypeState } from '../../../../store/src/app-state';
import { selectPaginationState } from '../../../../store/src/selectors/pagination.selectors';
import { APIResource } from '../../../../store/src/types/api.types';
import { PaginatedAction, PaginationEntityState } from '../../../../store/src/types/pagination.types';
import { RequestEntityLocation, WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';
import { deepMergeState, mergeEntity } from '../../../../store/src/helpers/reducer.helper';
import {
  createEntityRelationPaginationKey,
  ValidateEntityResult,
  ValidateResultFetchingState,
} from '../entity-relations.types';
import { CfUser, OrgUserRoleNames, CfUserRoleParams, SpaceUserRoleNames } from '../../store/types/user.types';

/**
 * Add roles from (org|space)\[role\]\[user\] into user\[role\]
 */
function updateUser(
  apiUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  existingUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  newUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  orgOrSpace,
  orgSpaceParamName: string,
  userParamName: string) {
  if (orgOrSpace[orgSpaceParamName]) {
    orgOrSpace[orgSpaceParamName].forEach(userGuid => {
      const existingUser = apiUsers[userGuid] || existingUsers[userGuid];
      const existingRoles = existingUser.entity[userParamName] || [];

      if (existingRoles.indexOf(orgOrSpace.guid) < 0) {
        newUsers[userGuid] = mergeEntity({
          entity: {
            [userParamName]: [
              ...existingRoles,
              orgOrSpace.guid
            ]
          }
        }, newUsers[userGuid] || existingUser);
      } else {
        newUsers[userGuid] = existingUser;
      }
    });
  }
  return newUsers;
}

/**
 * Given a request to fetch an org or space, extract the roles from the entity and ensure users have corresponding role. For instance
 * an org such as { entity: billing_managers: [ userA ] } would result in userA: { billing_managed_organizations: [ org ]}.
 * In the normal flow the user's role array will already have the org. However, when a user is an org billing_managers in more than 50 orgs
 * the role array is missing. It's for those cases that we then bring across the role from the org to the user.
 */
export function orgSpacePostProcess(
  store: Store<GeneralEntityAppState>,
  action: GetOrganization | GetSpace,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  const entities = apiResponse ? apiResponse.response.entities : allEntities;
  const { entityKey: cfOrgOrSpaceEntityKey } = entityCatalogue.getEntity(action.endpointType, action.entityType);
  const orgOrSpace = entities[cfOrgOrSpaceEntityKey][action.guid];
  const userCatalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, cfUserEntityType);
  const { entityKey: cfUserEntityKey } = userCatalogueEntity;
  const users = entities[cfUserEntityKey];
  const existingUsers = allEntities[cfOrgOrSpaceEntityKey];

  const newUsers = {};
  if (cfOrgOrSpaceEntityKey === getCFEntityKey(organizationEntityType)) {
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.USER, CfUserRoleParams.ORGANIZATIONS);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.MANAGER, CfUserRoleParams.MANAGED_ORGS);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.BILLING_MANAGERS,
      CfUserRoleParams.BILLING_MANAGER_ORGS);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.AUDITOR, CfUserRoleParams.AUDITED_ORGS);
  } else if (cfOrgOrSpaceEntityKey === getCFEntityKey(spaceEntityType)) {
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, SpaceUserRoleNames.DEVELOPER, CfUserRoleParams.SPACES);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, SpaceUserRoleNames.MANAGER, CfUserRoleParams.MANAGED_SPACES);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, SpaceUserRoleNames.AUDITOR, CfUserRoleParams.AUDITED_SPACES);
  }
  if (!Object.keys(newUsers).length) {
    return;
  }
  if (apiResponse) {
    // The apiResponse will make it into the store, as this is an api.effect validation
    apiResponse.response.entities = deepMergeState(apiResponse.response.entities, { [cfUserEntityKey]: newUsers });
    return;
  } else {

    // The apiResponse will NOT make it into the store, as this is a general validation. So create a mock event to push to store
    const response = {
      entities: {
        [cfUserEntityKey]: newUsers
      },
      result: Object.keys(newUsers)
    };

    const paginatedAction: PaginatedAction = {
      actions: [],
      endpointGuid: action.endpointGuid,
      entity: userCatalogueEntity.getSchema(),
      entityLocation: RequestEntityLocation.ARRAY,
      entityType: userCatalogueEntity.definition.type,
      endpointType: CF_ENDPOINT_TYPE,
      type: '[Entity] Post-process Org/Space Users',
      paginationKey: createEntityRelationPaginationKey(action.entityType, action.guid)
    };

    const successAction = new WrapperRequestActionSuccess(response, paginatedAction, 'fetch', 1, 1);
    return {
      action: successAction,
      fetchingState$: store.select(selectPaginationState(cfUserEntityKey, paginatedAction.paginationKey)).pipe(
        map((state: PaginationEntityState) => {
          const res: ValidateResultFetchingState = {
            fetching: !state || !state.ids[1]
          };
          return res;
        })
      )
    };
  }
}
