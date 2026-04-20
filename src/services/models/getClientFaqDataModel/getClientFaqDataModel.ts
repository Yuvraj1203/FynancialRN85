export type FaQArray = {
  question?: string;
  answer?: string;
  categoryID?: number;
  answerHTML?: string;
  iFrameList?: string[];
  id?: number;
};

export type GetClientFaqDataModel = {
  categoryId?: number;
  categoryTitle?: string;
  faQs?: Array<FaQArray>;
};

export type FaqDataModel = {
  title: string;
  data: FaQArray[];
};
