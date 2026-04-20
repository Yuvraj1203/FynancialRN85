import { CustomImage, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { ImageStyle } from '@d11/react-native-fast-image';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SvgProps } from 'react-native-svg';

type Props = {
  source: any;
  color?: string;
  fillColor?: string;
  label?: string;
  labelVariant?: TextVariants;
  onPress?: () => void;
  onIconPress?: () => void;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle> | SvgProps;
  labelStyle?: StyleProp<TextStyle>;
};

const FeatureButton = (props: Props) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling

  return (
    <Tap onPress={props.onPress} style={props.style}>
      <View style={styles.container}>
        <Tap disableRipple onPress={props.onIconPress}>
          <CustomImage
            source={props.source}
            color={props.color ? props.color : theme.colors.onSurfaceVariant}
            fillColor={props.fillColor}
            type={ImageType.svg}
            style={props.imageStyle ? props.imageStyle : styles.icon}
          />
        </Tap>
        <CustomText
          variant={
            props.labelVariant ? props.labelVariant : TextVariants.labelLarge
          }
          style={[styles.text, props.labelStyle]}
        >
          {props.label}
        </CustomText>
      </View>
    </Tap>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: { height: 20, width: 20 },
    text: {
      marginLeft: 5,
    },
    iconPress: {
      padding: 0,
    },
  });

export default FeatureButton;
