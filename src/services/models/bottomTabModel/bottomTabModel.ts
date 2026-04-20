import {ImageType} from '@/components/atoms/customImage/customImage';
import {BottomTabStackParamList} from '@/navigators/types';

export type BottomTabModel = {
  name: keyof BottomTabStackParamList;
  title?: string;
  image?: any;
  imageType?: ImageType;
  badgeCount?: string | number;
};
