export type StateObject = {
  id?: number;
  displayName?: string;
};

export type GetAllStateForLookUpTableModel = {
  totalCount?: number;
  items?: StateObject[];
};
