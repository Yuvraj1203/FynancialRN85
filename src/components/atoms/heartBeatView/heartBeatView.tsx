import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';

type Props = {
  children: React.ReactNode;
  intensity?: number;
  stepTime?: number;
  iterations?: number;
  disable?: boolean;
  style?: any;
};

function HeartBeatView({
  intensity = 0.3,
  iterations = -1,
  stepTime = 600,
  ...props
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (props.disable) {
      scale.setValue(1);
      return;
    }

    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1 + intensity,
          duration: stepTime / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: stepTime / 2,
          useNativeDriver: true,
        }),
      ]),
      {iterations},
    );

    heartbeat.start();

    return () => heartbeat.stop();
  }, [scale, intensity, stepTime, iterations, props.disable]);

  return (
    <Animated.View style={[props.style, {transform: [{scale}]}]}>
      {props.children}
    </Animated.View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {},
  });

export default HeartBeatView;
