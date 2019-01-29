import {
  IUserFavoritesGroupsState,
  getDefaultFavoriteGroup,
  IUserFavoriteGroup,
  getDefaultFavoriteGroupsState,
  IUserFavoritesGroups
} from '../../types/favorite-groups.types';
import { Action } from '@ngrx/store';
import {
  GetUserFavoritesSuccessAction,
  GetUserFavoritesAction,
  GetUserFavoritesFailedAction
} from '../../actions/user-favourites-actions/get-user-favorites-action';
import { RemoveUserFavoriteSuccessAction } from '../../actions/user-favourites-actions/remove-user-favorite-action';
import { SaveUserFavoriteSuccessAction } from '../../actions/user-favourites-actions/save-user-favorite-action';
import { isEndpointTypeFavorite, getEndpointFavorite } from '../../../core/user-favorite-helpers';
import { UserFavorite, IFavoriteMetadata } from '../../types/user-favorites.types';

export function userFavoriteGroupsReducer(
  state: IUserFavoritesGroupsState = getDefaultFavoriteGroupsState(),
  action: Action
): IUserFavoritesGroupsState {
  switch (action.type) {
    case GetUserFavoritesAction.ACTION_TYPE:
      return {
        ...state,
        busy: true,
        error: false,
        message: ''
      };
    case GetUserFavoritesSuccessAction.ACTION_TYPE:
      return {
        ...state,
        busy: false,
        error: false,
        message: '',
        groups: buildFavoritesGroups(action as GetUserFavoritesSuccessAction)
      };
    case GetUserFavoritesFailedAction.ACTION_TYPE:
      return {
        ...state,
        busy: false,
        error: true,
        message: 'Failed to fetch favorites',
      };
    case RemoveUserFavoriteSuccessAction.ACTION_TYPE:
      return {
        ...state,
        groups: removeFavoriteFromGroup(state.groups, action as RemoveUserFavoriteSuccessAction)
      };
    case SaveUserFavoriteSuccessAction.ACTION_TYPE:
      return {
        ...state,
        groups: addEntityFavorite(state.groups, action as SaveUserFavoriteSuccessAction)
      };
  }
  return state;
}

function buildFavoritesGroups(action: GetUserFavoritesSuccessAction) {
  const { favorites } = action;
  return favorites.reduce((favoriteGroups, favorite) => {
    const { guid } = getEndpointFavorite(favorite);
    favoriteGroups[guid] = addFavoriteToGroup(favoriteGroups[guid], favorite);
    return favoriteGroups;
  }, {} as IUserFavoritesGroups);
}

function removeFavoriteFromGroup(state: IUserFavoritesGroups, action: RemoveUserFavoriteSuccessAction): IUserFavoritesGroups {
  const { favorite } = action;
  const endpointFavorite = getEndpointFavorite(favorite);
  const userGroup = state[endpointFavorite.guid] || getDefaultFavoriteGroup();
  if (isEndpointTypeFavorite(favorite)) {
    if (!groupHasEntities(userGroup)) {
      return removeGroup(state, endpointFavorite.guid);
    }
    // The endpoint has been removed but dependant entities are still within the group
    // The group is now ethereal
    return {
      ...state,
      [endpointFavorite.guid]: {
        ...userGroup,
        ethereal: true
      }
    };
  } else {
    const entitiesIds = userGroup.entitiesIds.filter(id => id !== favorite.guid);
    if (!entitiesIds.length && userGroup.ethereal) {
      return removeGroup(state, endpointFavorite.guid);
    }
    return {
      ...state,
      [endpointFavorite.guid]: {
        ...userGroup,
        entitiesIds
      }
    };
  }
}

function removeGroup(state: IUserFavoritesGroups, endpointGuid: string): IUserFavoritesGroups {
  const {
    [endpointGuid]: removedEndpoint,
    ...newState
  } = state;
  return newState;
}

function groupHasEntities(group: IUserFavoriteGroup) {
  return group.entitiesIds.length > 0;
}

function addEntityFavorite(favoriteGroups: IUserFavoritesGroups, action: SaveUserFavoriteSuccessAction): IUserFavoritesGroups {
  const { favorite } = action;
  const { guid } = getEndpointFavorite(favorite);
  const group = favoriteGroups[guid];
  const newGroup = addFavoriteToGroup(group, favorite);
  return {
    ...favoriteGroups,
    [guid]: newGroup
  };
}

function addFavoriteToGroup(_favoriteGroup: IUserFavoriteGroup = getDefaultFavoriteGroup(), favorite: UserFavorite<IFavoriteMetadata>) {
  const favoriteGroup = { ..._favoriteGroup };
  const { guid } = favorite;
  const isEndpoint = isEndpointTypeFavorite(favorite);
  if (!isEndpoint && guid && !favoriteGroup.entitiesIds.includes(guid)) {
    favoriteGroup.entitiesIds.push(guid);
  }
  if (isEndpoint) {
    favoriteGroup.ethereal = false;
  }
  return favoriteGroup;
}
