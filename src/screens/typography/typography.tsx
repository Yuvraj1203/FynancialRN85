import {CustomButton, CustomText} from '@/components/atoms';
import {ButtonVariants} from '@/components/atoms/customButton/customButton';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomTextInput} from '@/components/molecules';
import {SafeScreen} from '@/components/template';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {ScrollView, StyleSheet, View} from 'react-native';

function TypographyScreen() {
  /** Added by @Tarun 05-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4204) */
  const theme = useTheme();

  /** Added by @Tarun 05-02-2025 -> access StylesSheet with theme implemented (FYN-4204) */
  const styles = makeStyles(theme);

  return (
    <SafeScreen>
      <ScrollView>
        <View style={{margin: 10}}>
          <CustomText
            variant={TextVariants.displayLarge}
            style={styles.container}>
            {TextVariants.displayLarge}
          </CustomText>
          <CustomText
            variant={TextVariants.displayMedium}
            style={styles.container}>
            {TextVariants.displayMedium}
          </CustomText>
          <CustomText
            variant={TextVariants.displaySmall}
            style={styles.container}>
            {TextVariants.displaySmall}
          </CustomText>
          <CustomText
            variant={TextVariants.headlineLarge}
            style={styles.container}>
            {TextVariants.headlineLarge}
          </CustomText>
          <CustomText
            variant={TextVariants.headlineMedium}
            style={styles.container}>
            {TextVariants.headlineMedium}
          </CustomText>
          <CustomText
            variant={TextVariants.headlineSmall}
            style={styles.container}>
            {TextVariants.headlineSmall}
          </CustomText>
          <CustomText
            variant={TextVariants.titleLarge}
            style={styles.container}>
            {TextVariants.titleLarge}
          </CustomText>
          <CustomText
            variant={TextVariants.titleMedium}
            style={styles.container}>
            {TextVariants.titleMedium}
          </CustomText>
          <CustomText
            variant={TextVariants.titleSmall}
            style={styles.container}>
            {TextVariants.titleSmall}
          </CustomText>
          <CustomText variant={TextVariants.bodyLarge} style={styles.container}>
            {TextVariants.bodyLarge}
          </CustomText>
          <CustomText
            variant={TextVariants.bodyMedium}
            style={styles.container}>
            {TextVariants.bodyMedium}
          </CustomText>
          <CustomText variant={TextVariants.bodySmall} style={styles.container}>
            {TextVariants.bodySmall}
          </CustomText>
          <CustomText
            variant={TextVariants.labelLarge}
            style={styles.container}>
            {TextVariants.labelLarge}
          </CustomText>
          <CustomText
            variant={TextVariants.labelMedium}
            style={styles.container}>
            {TextVariants.labelMedium}
          </CustomText>
          <CustomText
            variant={TextVariants.labelSmall}
            style={styles.container}>
            {TextVariants.labelSmall}
          </CustomText>
          <CustomTextInput
            style={styles.container}
            text="Soemthing"
            onChangeText={value => {}}
          />
          <CustomButton style={styles.container}>{'Button'}</CustomButton>
          <CustomButton mode={ButtonVariants.outlined} style={styles.container}>
            {'Button'}
          </CustomButton>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
    },
  });

export default TypographyScreen;
