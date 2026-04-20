import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React, {useCallback, useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';

type Props = {
  children: React.ReactNode;
  intensity?: number;
  stepTime?: number;
  iterations?: number;
  disable?: boolean;
  style?: any;
};

function ShakeView({
  intensity = 2,
  iterations = 2,
  stepTime = 1000,
  ...props
}: Props) {
  const theme = useTheme(); // Access the custom theme
  const styles = makeStyles(theme); // Generate styles with the theme

  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const animation = useRef(new Animated.Value(0)).current;

  const shakeAnimation = useCallback(() => {
    if (props.disable) return; // Stop animation if isShaking is false

    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: -intensity,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: intensity,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]),
      {iterations},
    ).start();
  }, [animation, intensity, iterations, props.disable]);

  useEffect(() => {
    if (!props.disable) {
      interval.current = setInterval(shakeAnimation, stepTime);
    } else {
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
        animation.setValue(0); // Reset animation to the initial position
      }
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [shakeAnimation, stepTime, props.disable]);

  return (
    <Animated.View
      style={[props.style, {transform: [{translateX: animation}]}]}>
      {props.children}
    </Animated.View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {},
  });

export default ShakeView;
