import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import * as React from 'react';
import type {ViewStyle} from 'react-native';
import {StyleSheet, View} from 'react-native';
import type {SharedValue} from 'react-native-reanimated';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  index: number;
  anim: SharedValue<number>;
  textWidth: SharedValue<number>;
  spacing: number;
};

const AnimatedChild = (props: Props) => {
  const stylez = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: props.index * (props.textWidth.value + props.spacing),
      transform: [
        {
          translateX: -(
            props.anim.value %
            (props.textWidth.value + props.spacing)
          ),
        },
      ],
    };
  }, [props.index, props.spacing, props.textWidth]);
  return <Animated.View style={stylez}>{props.children}</Animated.View>;
};

export type MarqueeProps = {
  children: React.ReactNode;
  speed?: number;
  spacing?: number;
  style?: ViewStyle;
};

/**
 * Used to animate the given children in a horizontal manner.
 */
function Marquee({speed = 1, spacing = 0, ...props}: MarqueeProps) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const parentWidth = useSharedValue(0);
  const textWidth = useSharedValue(0);
  const [cloneTimes, setCloneTimes] = React.useState(0);
  const anim = useSharedValue(0);

  useFrameCallback(() => {
    anim.value += speed;
  }, true);

  useAnimatedReaction(
    () => {
      if (textWidth.value === 0 || parentWidth.value === 0) {
        return 0;
      }
      return Math.round(parentWidth.value / textWidth.value) + 1;
    },
    v => {
      if (v === 0) {
        return;
      }
      // This is going to cover the case when the text/element size
      // is greater than the actual parent size
      // Double this to cover the entire screen twice, in this way we can
      // reset the position of the first element when its going to move out
      // of the screen without any noticible glitch
      runOnJS(setCloneTimes)(v * 2);
    },
    [],
  );
  return (
    <Animated.View
      style={props.style}
      onLayout={ev => {
        parentWidth.value = ev.nativeEvent.layout.width;
      }}
      pointerEvents="box-none">
      <Animated.View style={styles.row} pointerEvents="box-none">
        {
          // We are adding the text inside a ScrollView because in this way we
          // ensure that its not going to "wrap".
        }
        <Animated.ScrollView
          horizontal
          style={styles.hidden}
          pointerEvents="box-none">
          <View
            onLayout={ev => {
              textWidth.value = ev.nativeEvent.layout.width;
            }}>
            {props.children}
          </View>
        </Animated.ScrollView>
        {cloneTimes > 0 &&
          [...Array(cloneTimes).keys()].map(index => {
            return (
              <AnimatedChild
                key={`clone-${index}`}
                index={index}
                anim={anim}
                textWidth={textWidth}
                spacing={spacing}>
                {props.children}
              </AnimatedChild>
            );
          })}
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    hidden: {opacity: 0, zIndex: -9999},
    row: {flexDirection: 'row', overflow: 'hidden'},
  });

export default React.memo(Marquee);
