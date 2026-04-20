import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React, {memo, useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {IconButton} from 'react-native-paper';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface IScrollToBottomButtonProps {
  scrollToBottom: () => void;
  isScrollToBottomVisible: boolean;
}

const ScrollToBottomButton: React.FC<IScrollToBottomButtonProps> = ({
  scrollToBottom,
  isScrollToBottomVisible,
}: IScrollToBottomButtonProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  const animationValue: SharedValue<number> = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animationValue.value,
  }));

  useEffect(() => {
    animationValue.value = withTiming(isScrollToBottomVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.ease,
    });
  }, [isScrollToBottomVisible]);

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents={isScrollToBottomVisible ? 'auto' : 'none'}>
      <IconButton
        containerColor={theme.colors.primary}
        icon={'chevron-down'}
        size={16}
        onPress={scrollToBottom}
        disabled={!isScrollToBottomVisible}
      />
    </Animated.View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 10,
      alignSelf: 'center',
    },
  });

export default memo(ScrollToBottomButton);
