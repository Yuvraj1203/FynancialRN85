import { CustomButton } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { CustomHeader, FormTextInput } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { ResetPasswordModel } from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { showSnackbar, useLogout } from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
function PasswordSetup() {
  /** Added by @Akshita 05-02-2025 -> navigate to different screen (FYN-11756) */
  const navigation = useAppNavigation();

  /** Added by @Akshita 05-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-11756) */
  const theme = useTheme();

  /** Added by @Akshita 05-02-2025 -> access StylesSheet with theme implemented (FYN-11756) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 05-02-2025 -> translations for labels (FYN-11756) */
  const { t } = useTranslation();

  /** Added by @Akshita 05-02-2025 -> hide and show password (FYN-11756) */
  const [showPassword, setShowPassword] = useState<boolean>(true);

  /** Added by @Akshita 05-02-2025 -> hide and show password (FYN-11756) */
  const [showConfirmedPassword, setShowConfirmedPassword] =
    useState<boolean>(true);

  /** Added by @Akshita 05-02-2025 -> loading state for multitenant login (FYN-11756) */
  const [loading, setLoading] = useState<boolean>(false);

  /** Added by @Akshita 05-02-2025 -> logout user if any api fails (FYN-11756) */
  const { logout } = useLogout();

  /** Added by @Akshita 07-10-2025 -> user store */
  const userDetails = userStore();

  /**
   * Added by @Akshita 05-02-2025 -> Schema defined for validation of form
   * Zod(https://zod.dev/?id=form-integrations)
   */
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()[\]{}^#~+=_.\-]).{8,}$/;

  const schema = z
    .object({
      newPassword: z
        .string()
        .min(8, {
          message: t('PasswordMinLength'), // "Password must be at least 8 characters"
        })
        .regex(passwordRegex, {
          message: t('PasswordStrengthError'),
          // "Password must include uppercase, lowercase, number, and special character"
        }),

      password: z
        .string()
        .min(8, {
          message: t('PasswordMinLength'),
        })
        .regex(passwordRegex, {
          message: t('PasswordStrengthError'),
        }),
    })
    .refine(data => data.newPassword === data.password, {
      message: t('PasswordMismatch'),
      path: ['password'], // show error under confirm password
    });

  /**
   * Added by @Akshita 05-02-2025 -> converted schema to type for React-hook-form (FYN-11756)
   */
  type Schema = z.infer<typeof schema>;

  /**
   * Added by @Akshita 05-02-2025 -> React hook form (https://www.react-hook-form.com/get-started)
   */
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      newPassword: '',
      password: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: Schema) => {
    resetPasswordApi.mutate({
      UserId: userDetails.userDetails?.userID,
      Password: data.newPassword,
    });
  };

  const resetPasswordApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<ResetPasswordModel>({
        endpoint: ApiConstants.ResetPassword,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      /** Added by @Akshita 05-02-2025 -> show loading on login button(FYN-11756) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /**
       * Added by @Akshita 05-02-2025 -> hide loading on login button
       * if any api error occurs (FYN-11756)
       */

      setLoading(false);
    },
    onSuccess: async (data, variables, context) => {
      if (data.result?.status == 1) {
        await logout({ noNavigation: true, hardLogout: true });
        showAlertPopup({
          title: t('Message'),
          msg: t('PasswordUpdatedMsg'),
          PositiveText: t('Proceed'),
          dismissOnBackPress: false,
          onPositivePress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        });
      } else if (data.result?.status == 0 && data.result.message) {
        showSnackbar(data.result.message, 'warning');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View>
        <CustomHeader title={t('CreateNewPassword')} />
        <View style={styles.Container}>
          <View style={styles.inputContainer}>
            <FormTextInput
              control={control}
              name="newPassword"
              placeholder={t('EnterPassword')}
              showLabel={true}
              showErrorIcon={false}
              label={`${t('NewPassword')}*`}
              prefixIcon={{ source: Images.lock, type: ImageType.svg }}
              suffixIcon={{
                source: showPassword ? Images.eye : Images.eyeClosed,
                type: ImageType.svg,
                tap() {
                  setShowPassword(!showPassword);
                },
              }}
              hideText={showPassword}
              onChangeText={() => {
                clearErrors('newPassword');
              }}
            />

            <FormTextInput
              control={control}
              name="password"
              placeholder={t('ReEnterPassword')}
              showLabel={true}
              showErrorIcon={false}
              label={`${t('ConfirmPassword')}*`}
              prefixIcon={{ source: Images.lock, type: ImageType.svg }}
              suffixIcon={{
                source: showConfirmedPassword ? Images.eye : Images.eyeClosed,
                type: ImageType.svg,
                tap() {
                  setShowConfirmedPassword(!showConfirmedPassword);
                },
              }}
              hideText={showConfirmedPassword}
              onChangeText={value => {
                clearErrors('password');
              }}
            />

            <CustomButton
              style={styles.saveBtn}
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            >
              {t('Save')}
            </CustomButton>
          </View>
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    saveBtn: {
      marginTop: 5,
    },
    Container: {
      padding: 20,
    },
    inputContainer: {
      marginTop: 20,
    },
  });
export default PasswordSetup;
