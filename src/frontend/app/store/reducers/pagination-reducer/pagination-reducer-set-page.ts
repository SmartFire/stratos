import { SetPage } from '../../actions/pagination.actions';
import { PaginationEntityState } from '../../types/pagination.types';

export function paginationSetPage(state: PaginationEntityState, action: SetPage) {
  return {
    ...state,
    currentPage: action.pageNumber
  };
}

