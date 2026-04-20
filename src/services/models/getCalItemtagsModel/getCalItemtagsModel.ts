export type Tag = {
  tagName?: null;
  id?: number;
};

export type GetCalItemtagsModel = {
  tag?: Tag;
  id?: number;
  tagName?: string;
  isSelected?: boolean;
  contactCount?: number;
};
