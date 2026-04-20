import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {ImageStyle} from '@d11/react-native-fast-image';
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {SvgProps} from 'react-native-svg';
import CustomImage, {
  ImageType,
  ResizeModeType,
} from '../customImage/customImage';
import CustomText, {TextVariants} from '../customText/customText';
type Props = {
  source?: any;
  text?: string;
  initialVariant?: TextVariants;
  errorSource?: any;
  color?: string;
  fillColor?: string;
  imageStyle?: StyleProp<ImageStyle> | SvgProps;
  viewStyle?: StyleProp<ViewStyle>;
  type?: ImageType;
  resizeMode?: ResizeModeType;
  initialsVariant?: TextVariants;
};

/**
 * Added by @Akshita 13-02-2025 -> Component to show avatar image or text (FYN-4846)
 *
 * A component that displays an avatar. It can show either an image or text, and supports
 * both local and remote images. The avatar can be styled with different options like color,
 * tint color, and resize mode. It can also display an error image if provided.
 *
 * @param {Object} props - The props for the CustomAvatar component.
 * @param {any} [props.source] - The source of the image. It can accept a local image using `require()`
 *                               or a remote image URI.
 * @param {string} [props.text] - The text to display inside the avatar if no image is provided.
 * @param {any} [props.errorSource] - The source for the error image to display in case the avatar fails to load.
 * @param {string} [props.color] - Optional tint color for the avatar.
 * @param {string} [props.fillColor] - Optional tint color for filling the avatar.
 * @param {StyleProp<ImageStyle> | SvgProps} [props.imageStyle] - Unified style prop for both SVG and PNG images.
 * @param {StyleProp<ViewStyle>} [props.viewStyle] - Style for the container of the avatar.
 * @param {ImageType} [props.type] - The type of image (e.g., PNG, SVG).
 * @param {ResizeModeType} [props.resizeMode] - The resize mode of the image (e.g., cover, contain).
 *
 * @returns {JSX.Element} The avatar component that displays either an image or text.
 */
function CustomAvatar({
  initialVariant = TextVariants.titleLarge,
  ...props
}: Props) {
  /** Added by @Akshita 13-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4846) */
  const theme = useTheme();

  /** Added by @Akshita 13-02-2025 -> access StylesSheet with theme implemented (FYN-4846) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 13-02-2025 -> Extract initials from the provided text (FYN-4846) */
  const getInitials = (text: string) => {
    const cleanedText = text.replace(/[^a-zA-Z\s]/g, '').trim();
    return text
      .trim()
      .replace(/[^a-zA-Z\s]/g, cleanedText == '' ? text : '')
      .split(/\s+/) // handles multiple spaces
      .slice(0, 2) // limit to first two words
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View
      style={[
        styles.main,
        props.viewStyle,
        {
          backgroundColor: props.fillColor
            ? props.fillColor
            : theme.colors.outlineVariant,
        },
      ]}>
      {props.text ? (
        <CustomText
          color={props.color}
          variant={initialVariant ? initialVariant : TextVariants.bodyMedium}>
          {getInitials(props.text)}
        </CustomText>
      ) : (
        <CustomImage
          source={props.source}
          errorSource={props.errorSource}
          type={props.type}
          style={props.imageStyle ?? styles.img}
          resizeMode={props.resizeMode}
        />
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      height: 40,
      width: 40,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    img: {
      height: 40,
      width: 40,
      borderRadius: theme.roundness,
    },
  });

export default CustomAvatar;
