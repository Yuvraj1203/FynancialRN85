import { appThemeStore } from '@/store';
import { ThemeVariants } from '@/store/themeStore/themeStore';
import { _fontConfig } from '@/theme/assets/fonts/index';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import {
  MD3Theme,
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperDefaultTheme,
  configureFonts,
} from 'react-native-paper';
import {
  MD3Typescale,
  NavigationTheme,
} from 'react-native-paper/lib/typescript/types';
import { Colors } from '../assets/colors';

/* Theme definition, colors, fonts */
export const AppTheme = () => {
  const fonts = {
    ...configureFonts({ config: _fontConfig }),
    regular: {
      fontFamily: _fontConfig.bodyMedium.fontFamily,
      fontWeight: _fontConfig.bodyMedium.fontWeight as FontStyle['fontWeight'],
    },
    medium: {
      fontFamily: _fontConfig.bodyMedium.fontFamily,
      fontWeight: _fontConfig.bodyMedium.fontWeight as FontStyle['fontWeight'],
    },
    bold: {
      fontFamily: _fontConfig.bodyLarge.fontFamily,
      fontWeight: _fontConfig.bodyLarge.fontWeight as FontStyle['fontWeight'],
    },
    heavy: {
      fontFamily: _fontConfig.bodyLarge.fontFamily,
      fontWeight: _fontConfig.bodyLarge.fontWeight as FontStyle['fontWeight'],
    },
  };

  const CombinedDefaultTheme: CustomTheme = {
    ...PaperDefaultTheme,
    ...NavigationDefaultTheme,
    fonts: fonts,
    roundness: 25,
    extraRoundness: 40,
    lightRoundness: 6,
    colors: {
      ...PaperDefaultTheme.colors,
      ...NavigationDefaultTheme.colors,
      ...Colors.light,
      gradientColorLevel1: '#FBFCFD00', // custom color
      gradientColorLevel2: '#FBFCFD6B', // custom color
      gradientColorLevel3: '#fbfcfdcb', // custom color
      gradientColorLevel4: '#FBFCFD', // custom color
      skeletonBg: '#b6b6b6', // custom color
      skeletonHighlight: '#d6d6d6', // custom color
      primarySelected: '#e3e5e6', // custom color
      primaryHighlight1: '#c5e69f', // custom color
      primaryHighlight2: '#d7dcff', // custom color
      primaryHighlight3: '#cceaec', // custom color
      links: '#1e90ff',
      popupBg: '#00000060',
      transparent: 'transparent',
      labelLight: '#A0A0A0',
      success: '#e4fde8ff',
      red: '#a40000',
      danger: '#d9544f',
      statusBusyColor: '#fdbe12',
      statusAvailableColor: '#249b38ff',
      completed: '#21552aff',
      teamCard: '#f1f1f1',
      userMessage: '#d1f5d3',
      best: '#2cad9cff',
      worst: '#e22b2b',
      imgTimeStamp: '#eeecec',
      assetCardBg: '#ffffff',
      assetCardText: '#404943',
      blue: '#3699FF',
      orange: '#FF7F50',
      green: '#51A351',
      outOfOfcLevel2: '#A066F6',
      outOfOfcLevel1: '#F5EDFF',
    },
  };
  const CombinedDarkTheme: CustomTheme = {
    ...PaperDarkTheme,
    ...NavigationDarkTheme,
    fonts: fonts,
    roundness: 25,
    extraRoundness: 40,
    lightRoundness: 6,
    colors: {
      ...PaperDarkTheme.colors,
      ...NavigationDarkTheme.colors,
      ...Colors.dark,
      gradientColorLevel1: '#191C1D00', // custom color
      gradientColorLevel2: '#191C1D71', // custom color
      gradientColorLevel3: '#191c1ddc', // custom color
      gradientColorLevel4: '#191C1D', // custom color
      skeletonBg: '#9d9d9d', // custom color
      skeletonHighlight: '#d6d6d6', // custom color
      primarySelected: '#303030', // custom color
      primaryHighlight1: '#c5e69f', // custom color
      primaryHighlight2: '#d7dcff', // custom color
      primaryHighlight3: '#cceaec', // custom color
      links: '#1e90ff',
      popupBg: '#00000080',
      transparent: 'transparent',
      labelLight: '#A0A0A0',
      success: '#21552aff',
      red: '#a40000',
      danger: '#d9544f',
      statusBusyColor: '#fdbe12',
      statusAvailableColor: '#249b38ff',
      completed: '#21552aff',
      teamCard: '#1b1b1b',
      userMessage: '#295842',
      best: '#2cad9cff',
      worst: '#e22b2b',
      imgTimeStamp: '#ebe8e8',
      assetCardBg: '#ffffff',
      assetCardText: '#404943',
      blue: '#3699FF',
      orange: '#FF7F50',
      green: '#51A351',
      outOfOfcLevel2: '#A066F6',
      outOfOfcLevel1: '#F5EDFF',
    },
  };

  return { CombinedDefaultTheme, CombinedDarkTheme };
};

export function useTheme() {
  const colorTheme = useColorScheme(); // get system theme light or dark.
  const { CombinedDefaultTheme, CombinedDarkTheme } = AppTheme();
  const appTheme = appThemeStore(state => state.AppTheme); // reactive subscription

  if (appTheme === ThemeVariants.light) {
    return CombinedDefaultTheme;
  } else if (appTheme === ThemeVariants.dark) {
    return CombinedDarkTheme;
  } else {
    return colorTheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme;
  }

  return CombinedDefaultTheme;
}

export interface CustomTheme extends MD3Theme {
  extraRoundness: number;
  lightRoundness: number;
  colors: MD3Theme['colors'] &
    NavigationTheme['colors'] & {
      primaryHighlight1: string;
      primaryHighlight2: string;
      primaryHighlight3: string;
      skeletonBg: string;
      skeletonHighlight: string;
      primarySelected: string;
      gradientColorLevel1: string;
      gradientColorLevel2: string;
      gradientColorLevel3: string;
      gradientColorLevel4: string;
      links: string;
      popupBg: string;
      transparent: string;
      lightPrimaryContainer: string;
      labelLight: string;
      success: string;
      red: string;
      danger: string;
      statusBusyColor: string;
      statusAvailableColor: string;
      completed: string;
      teamCard: string;
      userMessage: string;
      best: string;
      worst: string;
      imgTimeStamp: string;
      assetCardBg: string;
      assetCardText: string;
      blue: string;
      orange: string;
      green: string;
      outOfOfcLevel1: string;
      outOfOfcLevel2: string;
    };
  fonts: MD3Typescale & {
    regular: FontStyle;
    medium: FontStyle;
    bold: FontStyle;
    heavy: FontStyle;
  };
}

type FontStyle = {
  fontFamily: string;
  fontWeight:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
};
