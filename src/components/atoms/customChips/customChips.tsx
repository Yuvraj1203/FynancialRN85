import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import CustomImage, { ImageType } from '../customImage/customImage';
import CustomText, { TextVariants } from '../customText/customText';
import Skeleton from '../skeleton/skeleton';
import Tap from '../tap/tap';

type Props = {
  chipLabel?: string;
  chipId?: number;
  onCloseClick?: (value?: number) => void;
  closeButton?: boolean;
  onPress?: () => void;
  loading?: boolean;
  skeletonCount?: number;
  style?: StyleProp<ViewStyle>;
  labelColor?: ColorValue;
};

const CustomChips = ({
  closeButton = true,
  loading = false,
  skeletonCount = 1,
  ...props
}: Props) => {
  const theme = useTheme();

  const styles = makeStyles(theme);

  const RenderChip = () => {
    return (
      <>
        <CustomText color={props.labelColor} variant={TextVariants.labelMedium}>
          {props?.chipLabel}
        </CustomText>
        {closeButton && (
          <Tap
            onPress={() => {
              if (props?.chipId && props?.onCloseClick) {
                props?.onCloseClick(props?.chipId);
              }
            }}
            style={styles.iconBox}
          >
            <CustomImage
              style={{ height: 12 }}
              source={Images.close}
              type={ImageType.svg}
              color={theme.colors.onSurfaceVariant}
            />
          </Tap>
        )}
      </>
    );
  };

  if (loading) {
    const dummyArray = Array.from({ length: skeletonCount }); // for skeleton
    return dummyArray.map(item => (
      <Skeleton>
        <View style={[styles.chipContainer, styles.skeletonChip]}></View>
      </Skeleton>
    ));
  }

  return props.onPress ? (
    <Tap onPress={props.onPress} style={[styles.chipContainer, props.style]}>
      <RenderChip />
    </Tap>
  ) : (
    <View style={[styles.chipContainer, props.style]}>
      <RenderChip />
    </View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    chipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inverseOnSurface,
      borderRadius: theme.roundness,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      paddingHorizontal: 5,
      height: 30,
    },
    skeletonChip: {
      backgroundColor: theme.colors.outline,
      width: 60,
    },
    iconBox: {
      marginLeft: 5,
      height: 14,
      width: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
export default CustomChips;
