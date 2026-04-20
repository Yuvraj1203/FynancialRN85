import {CustomImage, CustomText} from '@/components/atoms';
import {ImageType} from '@/components/atoms/customImage/customImage';
import {Images} from '@/theme/assets/images';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {ImageStyle} from '@d11/react-native-fast-image';
import React from 'react';
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native';

type Props = {
  source?: any;
  label?: string;
  imageType?: ImageType;
  imageColor?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const EmptyView = ({imageType = ImageType.svg, ...props}: Props) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling

  return (
    <View style={[styles.emptyLay, props.style]}>
      {props.source && (
        <CustomImage
          source={props.source ? props.source : Images.search}
          type={imageType}
          color={props.imageColor ?? theme.colors.primary}
          style={[styles.emptyIcon, props.imageStyle]}
        />
      )}
      <CustomText style={[styles.emptyLabel, props.labelStyle]}>
        {props.label}
      </CustomText>
    </View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    emptyLay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIcon: {height: 50, width: 50},
    emptyLabel: {marginTop: 10, textAlign: 'center'},
  });

export default EmptyView;
