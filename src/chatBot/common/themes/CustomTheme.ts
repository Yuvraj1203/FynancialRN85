import { MD3LightTheme, MD3Theme } from 'react-native-paper';

const customColors = {
  ...MD3LightTheme.colors,
  primary: '#6ECCA1',
};

export const CustomTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: customColors,
};
