import { Badge, CustomImage, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { ImageStyle } from '@d11/react-native-fast-image';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  title?: string;
  icon: any;
  imageType?: ImageType;
  selected: boolean;
  backgroundColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  badgeCount?: string | number;
  IsColorNoChange?: boolean;
};

function CustomTabItem(props: Props) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const iconStyle = props.selected ? styles.selectedIcon : styles.icon; // Condition to select icon size

  const fontSize = props.selected ? 13 : 12; // Larger font for selected tab

  return (
    <Tap
      style={[styles.container, props.style]}
      onPress={props.onPress}
      onLongPress={props.onLongPress}
    >
      <View style={styles.main}>
        <View style={styles.iconLay}>
          <CustomImage
            source={props.icon}
            type={props.imageType}
            color={
              props.IsColorNoChange
                ? theme.colors.primary
                : props.selected
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant
            }
            style={[iconStyle, props.imageStyle]}
          />
          {props.badgeCount != '' && props.badgeCount != -1 && (
            <Badge value={props.badgeCount} style={styles.badge} />
          )}
        </View>

        <CustomText
          variant={TextVariants.labelMedium}
          allowFontScaling={false}
          color={
            props.selected
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant
          }
          style={[{ fontSize }, props.labelStyle]}
        >
          {props.title}
        </CustomText>
        {props.badgeCount == -1 && <Badge value={''} style={styles.badgeDot} />}
      </View>
    </Tap>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      padding: 0,
      flex: 1,
      height: 60,
      justifyContent: 'center',
    },
    main: { justifyContent: 'center', alignItems: 'center' },
    iconLay: { padding: 5, justifyContent: 'center', alignItems: 'center' },
    icon: {
      height: 26,
      width: 26,
    },
    selectedIcon: {
      height: 30,
      width: 30,
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.error,
    },
    badgeDot: {
      backgroundColor: theme.colors.error,
    },
  });

export default CustomTabItem;
