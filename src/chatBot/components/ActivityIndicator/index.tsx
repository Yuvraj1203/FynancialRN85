import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MD3Theme,
  ActivityIndicator as PaperActivityIndicator,
  useTheme,
} from 'react-native-paper';

interface IActivityIndicatorProps {
  isLoading: boolean;
}

const ActivityIndicator: React.FC<IActivityIndicatorProps> = ({
  isLoading,
}: IActivityIndicatorProps) => {
  const theme: MD3Theme = useTheme();

  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <PaperActivityIndicator
        animating={true}
        size={'large'}
        color={theme.colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default ActivityIndicator;
