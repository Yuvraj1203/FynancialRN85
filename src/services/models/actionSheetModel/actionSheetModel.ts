import {ImageType} from '@/components/atoms/customImage/customImage';

export type ActionSheetModel = {
  title?: string;
  titleColor?: string;
  image?: any;
  imageType?: ImageType;
  loading?: boolean;
  dismissOnPress?: boolean;
  onPress?: () => void;
  imageColor?: string;
};
