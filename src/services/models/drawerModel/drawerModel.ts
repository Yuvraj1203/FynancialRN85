import {ImageType} from '@/components/atoms/customImage/customImage';

export type DrawerModel = {
  title: string;
  image: any;
  imageType?: ImageType;
  onPress?: () => void | undefined;
};
