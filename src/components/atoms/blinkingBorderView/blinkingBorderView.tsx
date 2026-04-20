import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color1?: string;
  color2?: string;
  duration?: number; // duration for one color change (half blink)
  onFinish?: () => void;
  blink?: boolean;
  blinkCount?: number;
};

function BlinkingBorderView({
  duration = 800, // now slower and smoother
  color1,
  color2,
  blink = false,
  blinkCount = 5,
  onFinish,
  style,
  children,
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const borderColor1 = color1 ?? theme.colors.surfaceVariant;
  const borderColor2 = color2 ?? theme.colors.primary;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!blink) {
      progress.value = 0;
      return;
    }

    const repeatCount = Math.max(1, blinkCount);

    // Each blink = go to color2 → return to color1
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      repeatCount,
      false,
      finished => {
        if (finished && onFinish) {
          runOnJS(onFinish)();
        }
      },
    );

    return () => {
      progress.value = 0;
    };
  }, [blink, blinkCount, duration, onFinish]);

  const animatedStyle = useAnimatedStyle(() => {
    const animatedBorderColor = interpolateColor(
      progress.value,
      [0, 1],
      [borderColor1, borderColor2],
    );

    return {
      borderColor: animatedBorderColor,
      borderWidth: 1.2,
    };
  });

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 14,
      shadowColor: theme.colors.onSurfaceVariant,
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
  });

export default BlinkingBorderView;
