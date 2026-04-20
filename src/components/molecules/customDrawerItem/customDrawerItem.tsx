import { CustomImage, CustomText } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { useTheme } from '@/theme/themeProvider/paperTheme';
import { DrawerItem } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { ImageStyle, StyleProp, ViewStyle } from 'react-native';

type Props = {
  title: string;
  icon: any;
  imageType?: ImageType;
  color?: string;
  onPress: () => void;
  closeDrawer?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

function CustomDrawerItem(props: Props) {
  const navigation = useNavigation(); // to close drawer on drawer item click

  const theme = useTheme(); // theme

  var close = props.closeDrawer; // decide if user want to disable close drawer

  if (props.closeDrawer == undefined) {
    close = true;
  }

  return (
    <DrawerItem
      {...props}
      label={() => (
        <CustomText variant={TextVariants.bodyLarge}>{props.title}</CustomText>
      )}
      icon={({ size }) => (
        <CustomImage
          source={props.icon}
          type={props.imageType}
          color={theme.colors.onSurfaceVariant}
          style={{ height: size, width: size }}
        />
      )}
      onPress={() => {
        if (close) {
          //navigation.dispatch(DrawerActions.closeDrawer());
        }
        props.onPress();
      }}
    />
  );
}

export default CustomDrawerItem;
