import { CustomImage, CustomText, Tap } from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { LinkPreviewCard } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetLinkPreviewHTMLModel } from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  containsJavaScript,
  getLastUrlFromText,
  isUrlComplete,
  showSnackbar,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { forwardRef, memo, useEffect, useMemo, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ImageSourcePropType,
  Keyboard,
  KeyboardTypeOptions,
  TextInput as RNTextInput,
  StyleProp,
  StyleSheet,
  TextInputSubmitEditingEvent,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator, TextInput } from 'react-native-paper';
export enum InputVariants {
  flat = 'flat',
  outlined = 'outlined',
}

export enum InputModes {
  phone = 'phone',
  number = 'number',
  name = 'name',
  address = 'address',
  email = 'email',
  password = 'password',
  default = 'default',
}

export enum InputTextCapitalization {
  sentences = 'sentences',
  none = 'none',
  words = 'words',
  characters = 'characters',
}

export enum InputTextAlign {
  left = 'left',
  center = 'center',
  right = 'right',
}

export enum InputReturnKeyType {
  default = 'default',
  go = 'go',
  google = 'google',
  join = 'join',
  next = 'next',
  route = 'route',
  search = 'search',
  send = 'send',
  yahoo = 'yahoo',
  done = 'done',
  emergencyCall = 'emergency-call',
}

export type InputIcon = {
  color?: string;
  source?: ImageSourcePropType;
  type?: ImageType;
  resizeMode?: ResizeModeType;
  tap?: () => void;
};

type Props = {
  ref?: React.Ref<RNTextInput>;
  control?: Control<any>;
  name: string;
  label?: string;
  text?: string;
  mode?: InputVariants;
  onChangeText?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  borderColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  height?: number;
  fillColor?: string;
  txtColor?: string;
  textSize?: number;
  placeholder?: string;
  enabled?: boolean;
  hideText?: boolean;
  helperTxt?: string;
  prefixIcon?: InputIcon;
  suffixIcon?: InputIcon;
  inputMode?: InputModes;
  inputFormatters?: RegExp;
  textAlign?: InputTextAlign;
  textCapitalization?: InputTextCapitalization;
  maxLength?: number;
  maxLines?: number;
  multiLine?: boolean;
  showLabel?: boolean;
  autoCorrect?: boolean;
  spellCheck?: boolean;
  returnKeyType?: InputReturnKeyType;
  loading?: boolean;
  loadingSize?: number;
  onSubmitEditing?: (e: TextInputSubmitEditingEvent) => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<TextStyle>;
  outlineStyle?: StyleProp<ViewStyle>;
  preserveSuffixIconOnError?: boolean;
  showError?: boolean;
  showErrorIcon?: boolean;
  onLinkPreviewChange?: (data?: GetLinkPreviewHTMLModel) => void;
  hidePreview?: boolean;
};

const FormTextInput = forwardRef<RNTextInput, Props>(
  (
    {
      mode = InputVariants.outlined,
      showLabel = true,
      borderWidth = 1,
      height = 48,
      inputMode = InputModes.default,
      textAlign = InputTextAlign.left,
      textCapitalization = InputTextCapitalization.sentences,
      maxLines = 1,
      multiLine = false,
      enabled = true,
      loading = false,
      showError = true,
      showErrorIcon = true,
      preserveSuffixIconOnError = false,
      hidePreview = true,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme(); // theme
    const styles = makeStyles(theme, props); // access StylesSheet with theme implemented
    const { t } = useTranslation();
    const [inputHeight, setInputHeight] = useState<number>(height); // Initial height
    const [latestUrl, setLatestUrl] = useState<string>(); // Latest URL detected
    const [linkPreviewData, setLinkPreviewData] =
      useState<GetLinkPreviewHTMLModel>(); // Data for the link preview
    // Status of the link preview (idle, loading, ready, error)
    const [linkPreviewLoading, setLinkPreviewLoading] =
      useState<boolean>(false);
    const [showLinkPreviewCard, setShowLinkPreviewCard] = useState(false);

    const watchedText = useWatch({
      control: props.control,
      name: props.name,
      defaultValue: '',
    });

    // set keyboard type to show to user on specific input mode
    const setKeyboard = useMemo((): KeyboardTypeOptions => {
      const keyTypeMap: Record<string, KeyboardTypeOptions> = {
        phone: 'phone-pad',
        number: 'phone-pad',
        email: 'email-address',
        password: 'default',
      };
      return inputMode ? keyTypeMap[inputMode] || 'default' : 'default';
    }, [inputMode]);

    // validate text when user type according to specific input mode
    const validateInput = (value: string): boolean => {
      if (!inputMode && !props.inputFormatters) return true;

      const regexMap: Record<string, RegExp> = {
        phone: /^[0-9]+$/,
        number: /^[0-9]*\.?[0-9]+$/,
        name: /^[a-zA-Z ]*$/,
        address: /^[0-9a-zA-Z\s-_.,()]*$/,
        email: /^[0-9a-zA-Z@-_.]*$/,
        password: /^[0-9a-zA-Z@-_.$]*$/,
      };

      if (props.inputFormatters) {
        return props.inputFormatters.test(value);
      }

      return (
        (value.length === 0 ||
          !inputMode ||
          regexMap[inputMode]?.test(value)) ??
        true
      );
    };

    // on change text
    const handleFormatter = (
      value: string,
      onChangeText: (value: string) => void,
    ) => {
      // 🚫 BLOCK JAVASCRIPT / SCRIPT CONTENT
      if (containsJavaScript(value)) {
        onChangeText('');
        props.onChangeText?.('');
        Keyboard.dismiss();
        showSnackbar(t('InvalidJSMsg'), 'danger');
        return;
      }
      if (validateInput(value)) {
        onChangeText(value);
        props.onChangeText?.(value);
      }
    };

    // API Call to fetch Link Preview
    useEffect(() => {
      if (hidePreview) {
        return;
      }
      const lastUrl = getLastUrlFromText(watchedText); // Get the last URL from the text input
      // If no URL, skip

      if (!lastUrl) {
        setLatestUrl(undefined);
        setLinkPreviewData(undefined);
        setShowLinkPreviewCard(false); // ✅ hide
        props.onLinkPreviewChange?.(undefined);
        return;
      }

      // ✅ url exists but preview is already closed manually => don't re-open unless url changes
      if (!showLinkPreviewCard && lastUrl === latestUrl) return;

      if (lastUrl !== latestUrl && isUrlComplete(lastUrl)) {
        setLatestUrl(lastUrl);
        setLinkPreviewLoading(true); // Set loading status

        // Make API call to fetch link preview data
        getLinkPreviewHTMLApi.mutate({
          apiPayload: {
            Url:
              lastUrl.includes('http://') || lastUrl.includes('https://')
                ? lastUrl
                : `https://${lastUrl}`,
          },
        });
      }
    }, [watchedText, latestUrl]);

    /**
     * Added by @Ajay 22-05-25 ---> API call to get imagedata in chat (FYN-4314)*/
    const getLinkPreviewHTMLApi = useMutation({
      mutationFn: (sendData: {
        apiPayload: Record<string, any>;
        openPdf?: boolean;
      }) => {
        return makeRequest<GetLinkPreviewHTMLModel>({
          endpoint: ApiConstants.GetLinkPreviewHTML,
          method: HttpMethodApi.Get,
          data: sendData.apiPayload,
        }); // API Call
      },
      onMutate(variables) {
        /** Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
        /** Set loading state true before API call starts */
        setLinkPreviewLoading(true);
      },
      onSettled(data, error, variables, context) {
        setLinkPreviewLoading(false); // Set error if API call fails
      },
      onSuccess(data, variables, context) {
        if (data?.result) {
          setLinkPreviewData(data.result); // Set preview data if available
          props.onLinkPreviewChange?.(data.result);

          // ✅ open the card
          setShowLinkPreviewCard(true); // ✅ open card
        } else {
          setLinkPreviewLoading(false); // Set error if API call fails
          setLinkPreviewData(undefined);
          props.onLinkPreviewChange?.(undefined);
        }
      },
      onError(error, variables, context) {
        /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/
        setLinkPreviewLoading(false); // Set error if API call fails
        setLinkPreviewData(undefined);
        props.onLinkPreviewChange?.(undefined);
      },
    });

    return (
      <Controller
        control={props.control}
        name={props.name}
        rules={{
          required: true,
        }}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View style={props.style}>
            {showLabel ? (
              <CustomText
                variant={TextVariants.bodyMedium}
                style={styles.heading}
              >
                {props.label}
              </CustomText>
            ) : (
              <></>
            )}
            {!hidePreview &&
              latestUrl &&
              !linkPreviewLoading &&
              showLinkPreviewCard && (
                <LinkPreviewCard
                  shown={showLinkPreviewCard}
                  setShown={setShowLinkPreviewCard}
                  title={linkPreviewData?.title}
                  safeURL={linkPreviewData?.safeUrl}
                  image={linkPreviewData?.imageUrl}
                  destinationURL={linkPreviewData?.originalUrl}
                  orignalUrl={linkPreviewData?.originalUrl}
                  metadataFound={linkPreviewData?.metadataFound}
                  description={linkPreviewData?.description}
                  onClose={() => {
                    setLinkPreviewData(undefined);
                    props.onLinkPreviewChange?.(undefined);
                  }}
                />
              )}
            <View pointerEvents={enabled ? 'auto' : 'none'}>
              <TextInput
                ref={ref}
                mode={mode}
                value={value}
                onChangeText={e => handleFormatter(e, onChange)}
                onBlur={e => {
                  onBlur();
                  if (props.onBlur) {
                    props.onBlur();
                  }
                }}
                onFocus={() => {
                  if (props.onFocus) {
                    props.onFocus();
                  }
                }}
                editable={enabled}
                placeholder={props.placeholder}
                secureTextEntry={props.hideText}
                keyboardType={setKeyboard}
                returnKeyType={
                  props.returnKeyType
                    ? props.returnKeyType
                    : InputReturnKeyType.default
                }
                onSubmitEditing={props.onSubmitEditing}
                textAlign={textAlign}
                textAlignVertical="top"
                autoCapitalize={textCapitalization}
                maxLength={props.maxLength ?? props.maxLength}
                numberOfLines={maxLines}
                multiline={multiLine}
                dense={true}
                autoCorrect={props.autoCorrect}
                spellCheck={props.spellCheck}
                error={error?.message ? true : false}
                style={[
                  styles.textInput,
                  {
                    minHeight: inputHeight,
                    fontSize: props.textSize,
                  },
                  maxLines ? { maxHeight: maxLines * 50 } : {},
                ]}
                contentStyle={[
                  styles.content,
                  props.contentStyle,
                  error && { paddingRight: 25 },
                ]}
                outlineStyle={[styles.outlineStyle, props.outlineStyle]}
                theme={{
                  colors: { onSurfaceVariant: theme.colors.labelLight },
                }}
                maxFontSizeMultiplier={1}
              />
              {props.prefixIcon != null && (
                <Tap onPress={props.prefixIcon.tap} style={styles.prefixIcon}>
                  <CustomImage
                    source={props.prefixIcon.source}
                    color={
                      props.prefixIcon.color
                        ? props.prefixIcon.color
                        : theme.colors.onSurfaceVariant
                    }
                    type={props.prefixIcon.type}
                    resizeMode={props.prefixIcon.resizeMode}
                    style={styles.prefixIconImage}
                  />
                </Tap>
              )}
              {error?.message && showErrorIcon ? (
                <Tap style={styles.suffixIcon}>
                  <CustomImage
                    source={Images.error}
                    color={theme.colors.error}
                    type={ImageType.svg}
                    style={styles.suffixIconImage}
                  />
                </Tap>
              ) : loading ? (
                <Tap disableRipple style={styles.loadingIcon}>
                  <ActivityIndicator
                    size={props.loadingSize}
                    style={styles.inputLoader}
                  />
                </Tap>
              ) : error?.message ? (
                !!error?.message && !preserveSuffixIconOnError ? (
                  <Tap style={styles.suffixIcon}>
                    <CustomImage
                      source={Images.error}
                      color={theme.colors.error}
                      type={ImageType.svg}
                      style={styles.suffixIconImage}
                    />
                  </Tap>
                ) : !!props.suffixIcon &&
                  (!error?.message || !!preserveSuffixIconOnError) ? (
                  <Tap
                    onPress={props.suffixIcon?.tap}
                    disableRipple
                    style={styles.suffixIcon}
                  >
                    <CustomImage
                      source={props.suffixIcon?.source}
                      color={
                        props.suffixIcon?.color
                          ? props.suffixIcon.color
                          : theme.colors.onSurfaceVariant
                      }
                      type={props.suffixIcon?.type}
                      resizeMode={props.suffixIcon?.resizeMode}
                      style={styles.suffixIconImage}
                    />
                  </Tap>
                ) : (
                  <></>
                )
              ) : !!props.suffixIcon &&
                (!error?.message || !!preserveSuffixIconOnError) ? (
                <Tap
                  onPress={props.suffixIcon?.tap}
                  disableRipple
                  style={styles.suffixIcon}
                >
                  <CustomImage
                    source={props.suffixIcon?.source}
                    color={
                      props.suffixIcon?.color
                        ? props.suffixIcon.color
                        : theme.colors.onSurfaceVariant
                    }
                    type={props.suffixIcon?.type}
                    resizeMode={props.suffixIcon?.resizeMode}
                    style={styles.suffixIconImage}
                  />
                </Tap>
              ) : (
                <></>
              )}
            </View>
            {showError && (
              <View style={styles.bottomLayout}>
                <CustomText
                  variant={TextVariants.labelMedium}
                  color={
                    error?.message
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant
                  }
                >
                  {error?.message
                    ? error?.message
                    : props.helperTxt
                    ? props.helperTxt
                    : ''}
                </CustomText>
              </View>
            )}
          </View>
        )}
      />
    );
  },
);

const makeStyles = (theme: CustomTheme, props: Props) =>
  StyleSheet.create({
    heading: {
      paddingLeft: 5,
    },
    textInput: {
      paddingLeft: props.prefixIcon ? 30 : 10,
      paddingRight: props.suffixIcon ? 30 : 10,
      backgroundColor:
        props.fillColor != null
          ? props.fillColor
          : theme.colors.elevation.level0,
      marginTop: 5,
    },
    content: {
      paddingTop: props.prefixIcon || props.suffixIcon ? 0 : 5,
      paddingBottom: props.prefixIcon || props.suffixIcon ? 0 : 5,
      paddingLeft: props.prefixIcon ? 10 : 5,
      paddingRight: props.suffixIcon ? 10 : 5,
    },
    outlineStyle: {
      borderRadius: props.borderRadius ? props.borderRadius : theme.roundness,
    },
    prefixIcon: {
      left: 5,
      position: 'absolute',
      justifyContent: 'center',
      top: 15,
      //bottom: 0,
    },
    prefixIconImage: {
      height: 20,
      width: 20,
    },
    suffixIcon: {
      right: 10,
      position: 'absolute',
      justifyContent: 'center',
      top: 15,
      //bottom: 0,
    },
    loadingIcon: {
      right: 10,
      position: 'absolute',
      justifyContent: 'center',
      top: 20,
    },
    inputLoader: {
      height: 7,
      width: 7,
      marginHorizontal: 10,
    },
    suffixIconImage: {
      height: 20,
      width: 20,
    },
    bottomLayout: {
      marginHorizontal: 12,
      //marginBottom: 3,
      marginTop: 3,
    },
  });

export default memo(FormTextInput);
