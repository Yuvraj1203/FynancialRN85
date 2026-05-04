import { Platform } from 'react-native';
import { MD3Type } from 'react-native-paper/lib/typescript/types';

export const CustomFonts = {
  Regular: 'Poppins-Regular',
  Light: 'Poppins-ExtraLight',
  Bold: 'Poppins-SemiBold',
};

export const _fontConfig = {
  displaySmall: {
    fontFamily: CustomFonts.Regular,
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 44,
  } as MD3Type,

  displayMedium: {
    fontFamily: CustomFonts.Bold,
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  } as MD3Type,

  displayLarge: {
    fontFamily: CustomFonts.Bold,
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  } as MD3Type,

  headlineSmall: {
    fontFamily: CustomFonts.Regular,
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 32,
  } as MD3Type,

  headlineMedium: {
    fontFamily: CustomFonts.Regular,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0,
    lineHeight: 36,
  } as MD3Type,

  headlineLarge: {
    fontFamily: CustomFonts.Bold,
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 40,
  } as MD3Type,

  titleSmall: {
    fontFamily: CustomFonts.Regular,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  } as MD3Type,

  titleMedium: {
    fontFamily: CustomFonts.Regular,
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  } as MD3Type,

  titleLarge: {
    fontFamily: CustomFonts.Bold,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
  } as MD3Type,

  labelSmall: {
    fontFamily: CustomFonts.Regular,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 12,
  } as MD3Type,

  labelMedium: {
    fontFamily: CustomFonts.Regular,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  } as MD3Type,

  labelLarge: {
    fontFamily: CustomFonts.Bold,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  } as MD3Type,

  bodySmall: {
    fontFamily: CustomFonts.Regular,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  } as MD3Type,

  bodyMedium: {
    fontFamily: CustomFonts.Regular,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  } as MD3Type,

  bodyLarge: {
    fontFamily: CustomFonts.Bold,
    fontWeight: Platform.OS === 'ios' ? 'bold' : '600',
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 24,
  } as MD3Type,
};

export const fontConfig = {
  //fontFamily: CustomFonts.RobotoRegular,
  default: _fontConfig,
};
