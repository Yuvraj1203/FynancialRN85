// export type ActionItemListModel = {
//   userActions?: null;
//   actionItemsTenantId?: null;
//   title?: string;
//   status?: boolean;
//   id?: number;
//   dueDate?: string;
//   completedDate?: string;
//   actionType?: number;
//   userId?: number;
//   creationTime?: string;
//   assignedBy?: number;
//   fullName?: null;
// };

import {GetTopAssignedActionModel} from '../getTopAssignedActionModel/getTopAssignedActionModel';

export type GetAllUserActionsModel = {
  totalCount?: number;
  items?: GetTopAssignedActionModel[];
};
