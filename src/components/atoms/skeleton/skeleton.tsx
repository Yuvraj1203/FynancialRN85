import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import MaskedView from '@react-native-masked-view/masked-view';
import React, {useEffect, useState} from 'react';
import {
  LayoutRectangle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {LinearGradient} from 'react-native-linear-gradient';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactElement;
  background?: string;
  highlight?: string;
  style?: StyleProp<ViewStyle>;
};

function Skeleton(props: Props) {
  const theme = useTheme(); //theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const shared = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => {
    const x = interpolate(
      shared.value,
      [0, 1],
      [layout ? -layout.width : 0, layout ? layout.width : 0],
    );
    return {
      transform: [{translateX: x}],
    };
  });

  useEffect(() => {
    shared.value = withRepeat(withTiming(1, {duration: 1000}), Infinity);
  }, []);

  if (!layout) {
    return (
      <View
        onLayout={event => setLayout(event.nativeEvent.layout)}
        style={props.style}>
        {props.children}
      </View>
    );
  }

  return (
    <MaskedView
      maskElement={props.children}
      style={[{width: layout.width, height: layout.height}, props.style]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: props.background
              ? props.background
              : theme.colors.skeletonBg,
          },
        ]}
      />

      <Reanimated.View
        style={[StyleSheet.absoluteFill, animStyle, props.style]}>
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={StyleSheet.absoluteFill}
              colors={['transparent', 'black', 'transparent']}
            />
          }>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: props.highlight
                  ? props.highlight
                  : theme.colors.skeletonHighlight,
              },
            ]}
          />
        </MaskedView>
      </Reanimated.View>
    </MaskedView>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      overflow: 'hidden',
    },
  });

export default Skeleton;
