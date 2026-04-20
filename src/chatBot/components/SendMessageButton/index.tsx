import React, {memo, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {Icon, IconButton} from 'react-native-paper';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import CustomImage, {
  ImageType,
} from '@/components/atoms/customImage/customImage';
import {Images} from '@/theme/assets/images';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {IAskChatContext, useAskChat} from '../../contexts/AskChatProvider';

interface ISendMessageButtonProps {
  handleAskChatPress: (promptText?: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const SendMessageButton: React.FC<ISendMessageButtonProps> = ({
  handleAskChatPress,
  isLoading,
  isDisabled,
}: ISendMessageButtonProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  const iconAnimation: SharedValue<number> = useSharedValue(0);
  const {isMessageStreaming, isMessageGenerating}: IAskChatContext =
    useAskChat();

  useEffect(() => {
    iconAnimation.value = withTiming(
      isMessageStreaming || isMessageGenerating ? 1 : 0,
      {
        duration: 400,
        easing: Easing.ease,
      },
    );
  }, [isMessageStreaming, isMessageGenerating, iconAnimation]);

  const sendIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - iconAnimation.value,
    position: 'absolute',
  }));

  const stopIconStyle = useAnimatedStyle(() => ({
    opacity: iconAnimation.value,
    position: 'absolute',
  }));

  const getIcon = () => (
    <View style={styles.iconContainer}>
      <Animated.View style={[sendIconStyle]}>
        {/* <Icon source={'arrow-right'} size={30} /> */}
        <CustomImage
          source={Images.send}
          type={ImageType.svg}
          color={theme.colors.surface}
          style={styles.send}
        />
      </Animated.View>
      <Animated.View style={[stopIconStyle]}>
        <Icon source={'stop'} size={30} color={theme.colors.surface} />
      </Animated.View>
    </View>
  );

  return (
    <IconButton
      style={styles.sendMessageButton}
      onPress={() => handleAskChatPress()}
      icon={getIcon}
      containerColor={
        isDisabled ? theme.colors.onSurfaceDisabled : theme.colors.primary
      }
      loading={isLoading}
      disabled={isDisabled}
      size={32}
    />
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    sendMessageButton: {
      marginBottom: 0,
    },
    iconContainer: {
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    send: {
      height: 24,
      width: 24,
    },
  });

export default memo(SendMessageButton);
