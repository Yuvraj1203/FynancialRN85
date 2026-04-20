import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View } from 'react-native';
import { SvgProps } from 'react-native-svg';

export enum ImageType {
  png = 'png',
  svg = 'svg',
}

export enum ResizeModeType {
  cover = 'cover',
  contain = 'contain',
  stretch = 'stretch',
  center = 'center',
}

export type CustomImageProps = {
  source: any; // Accepts require() for local images or a URI for remote images
  errorSource?: any;
  color?: string; // Optional tint color
  fillColor?: string; // Optional tint color
  style?: StyleProp<ImageStyle> | SvgProps; // Unified style prop for both SVG and PNG
  type?: ImageType;
  resizeMode?: ResizeModeType;
  loading?: boolean;
};

function CachedImage({
  errorSource = Images.errorImage,
  type = ImageType.png,

  loading = true,
  ...props
}: CustomImageProps) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  return (
    <View style={[props.style as StyleProp<ImageStyle>]}>
      <FastImage
        source={props.source}
        style={[props.style as StyleProp<ImageStyle>]}
        tintColor={props.color}
        resizeMode={props.resizeMode && FastImage.resizeMode[props.resizeMode]}
        onError={() => {
          //setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    loader: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignContent: 'center',
    },
  });

export default CachedImage;
