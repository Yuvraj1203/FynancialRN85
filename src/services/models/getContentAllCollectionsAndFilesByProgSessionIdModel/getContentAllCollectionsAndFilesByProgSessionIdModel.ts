import {FeaturedItems} from '../getUserContentForDashboardModel/getUserContentForDashboardModel';

export type GetContentAllCollectionsAndFilesByProgSessionIdModel = {
  fileList?: FeaturedItems[];
  hasNextPage?: boolean;
};
