import {CustomImage, Tap} from '@/components/atoms';
import {ImageType} from '@/components/atoms/customImage/customImage';
import {Images} from '@/theme/assets/images';
import {useTheme} from '@/theme/themeProvider/paperTheme';
import React, {useRef} from 'react';
import {Animated, Easing, StyleProp, StyleSheet, ViewStyle} from 'react-native';

const ClickRotateIcon = ({
  onPress,
  iconColor = useTheme().colors.error,
  style,
}: {
  onPress: () => void;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const triggerRotation = () => {
    rotateAnim.setValue(0); // reset
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    onPress(); // your actual retry logic
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Tap style={[styles.iconTap, style]} onPress={triggerRotation}>
      <Animated.View style={{transform: [{rotate: spin}]}}>
        <CustomImage
          source={Images.refresh}
          type={ImageType.svg}
          color={iconColor}
          style={{width: 15, height: 15}}
        />
      </Animated.View>
    </Tap>
  );
};

const styles = StyleSheet.create({
  iconTap: {
    paddingBottom: 2,
    paddingEnd: 0,
  },
});

export default ClickRotateIcon;
