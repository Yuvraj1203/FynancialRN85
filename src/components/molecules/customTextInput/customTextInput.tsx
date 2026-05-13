import { CustomText, Tap } from '@/components/atoms';
import CustomImage, {
  ImageType,
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
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  TextInput as RNTextInput,
  StyleProp,
  StyleSheet,
  TextInputSubmitEditingEventData,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator, TextInput } from 'react-native-paper';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  InputIcon,
  InputModes,
  InputReturnKeyType,
  InputTextAlign,
  InputTextCapitalization,
  InputVariants,
} from './formTextInput';

type Props = {
  ref?: React.Ref<RNTextInput>;
  label?: string;
  text: string;
  mode?: InputVariants;
  onChangeText: (value: string) => void;
  onBlur?: () => boolean;
  onFocus?: () => void;
  errorMsg?: string;
  animate?: boolean;
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
  onPress?: () => void;
  validator?: z.ZodType<any, any>;
  showLabel?: boolean;
  autoCorrect?: boolean;
  spellCheck?: boolean;
  returnKeyType?: InputReturnKeyType;
  loading?: boolean;
  loadingSize?: number;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<TextStyle>;
  outlineStyle?: StyleProp<ViewStyle>;
  showError?: boolean;
  showErrorIcon?: boolean;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto' | undefined;
  onLinkPreviewChange?: (data?: GetLinkPreviewHTMLModel) => void;
  hidePreview?: boolean;
};

type ValidateProps = { value: string; validator?: z.ZodType<any, any> };

// custom hook for single CustomTextInput
export const useValidateCustomTextInput = (props: ValidateProps) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [text, setText] = useState(props.value);
  /** Added by @Akshita 05-02-25 ---> to open in app browser links from comments(FYN-4314)*/

  // hook to set text value in state
  const handleSetText = useCallback((value: string) => {
    setText(value);
    setErrorMsg('');
  }, []);

  // hook for validation
  const Validation = useCallback(() => {
    if (props.validator) {
      const validationResult = props.validator.safeParse(text);
      if (!validationResult.success) {
        setErrorMsg(validationResult.error.message);
        return false;
      }
    }
    setErrorMsg('');
    return true;
  }, [text]);

  return { text, setText: handleSetText, Validation, errorMsg };
};

const CustomTextInput = forwardRef<RNTextInput, Props>(
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
      loading = false,
      showError = true,
      showErrorIcon = true,
      hidePreview = true,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme(); // theme
    const { t } = useTranslation();
    const styles = makeStyles(theme, props); // access StylesSheet with theme implemented
    const openInAppBrowser = useCustomInAppBrowser();
    const [inputHeight, setInputHeight] = useState<number>(height); // Initial height
    const [latestUrl, setLatestUrl] = useState<string>(); // Latest URL detected
    const [linkPreviewData, setLinkPreviewData] =
      useState<GetLinkPreviewHTMLModel>(); // Data for the link preview
    // Status of the link preview (idle, loading, ready, error)
    const [linkPreviewLoading, setLinkPreviewLoading] =
      useState<boolean>(false);
    const [showLinkPreviewCard, setShowLinkPreviewCard] = useState(false);

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
        number: /^[0-9]*\.?[0-9]*$/,
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
    const handleFormatter = (value: string) => {
      if (containsJavaScript(value)) {
        props.onChangeText('');
        Keyboard.dismiss();
        showSnackbar(t('InvalidJSMsg'), 'danger');
        return;
      }

      if (validateInput(value)) {
        props.onChangeText(value);
      }
    };

    // API Call to fetch Link Preview
    useEffect(() => {
      if (hidePreview) {
        return;
      }
      const lastUrl = getLastUrlFromText(props.text); // Get the last URL from the text input

      if (!lastUrl) {
        setLatestUrl(undefined);
        setLinkPreviewData(undefined);
        setShowLinkPreviewCard(false); // ✅ hide
        props.onLinkPreviewChange?.(undefined);
        return;
      }
      // If no URL, skip

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
    }, [props.text, latestUrl]);

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
      <View style={props.style}>
        {showLabel && (
          <CustomText variant={TextVariants.bodyMedium} style={styles.heading}>
            {props.label}
          </CustomText>
        )}
        {!hidePreview &&
          latestUrl &&
          !linkPreviewLoading &&
          showLinkPreviewCard && (
            <LinkPreviewCard
              shown={showLinkPreviewCard}
              setShown={setShowLinkPreviewCard}
              title={linkPreviewData?.title}
              image={linkPreviewData?.imageUrl}
              safeURL={linkPreviewData?.safeUrl}
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
        <View>
          <TextInput
            ref={ref}
            mode={mode}
            value={props.text}
            onChangeText={e => handleFormatter(e)}
            onBlur={e => {
              if (props.onBlur) {
                props.onBlur();
              }
            }}
            onFocus={() => {
              if (props.onFocus) {
                props.onFocus();
              }
            }}
            editable={props.enabled}
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
            error={props.errorMsg ? true : false}
            pointerEvents={props.pointerEvents}
            style={[
              styles.textInput,
              {
                minHeight: inputHeight,
                maxHeight: maxLines * 50,
                fontSize: props.textSize,
              },
            ]}
            contentStyle={[styles.content, props.contentStyle]}
            outlineStyle={[styles.outlineStyle, props.outlineStyle]}
            theme={{ colors: { onSurfaceVariant: theme.colors.labelLight } }}
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
          {props.errorMsg && showErrorIcon ? (
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
          ) : props.suffixIcon ? (
            <Tap
              onPress={props.suffixIcon.tap}
              disableRipple
              style={styles.suffixIcon}
            >
              <CustomImage
                source={props.suffixIcon.source}
                color={
                  props.suffixIcon.color
                    ? props.suffixIcon.color
                    : theme.colors.onSurfaceVariant
                }
                type={props.suffixIcon.type}
                resizeMode={props.suffixIcon.resizeMode}
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
                props.errorMsg
                  ? theme.colors.error
                  : theme.colors.onSurfaceVariant
              }
            >
              {props.errorMsg
                ? props.errorMsg
                : props.helperTxt
                ? props.helperTxt
                : ''}
            </CustomText>
          </View>
        )}
      </View>
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
      paddingRight: props.suffixIcon ? 30 : 0,
      backgroundColor: props.fillColor ?? props.fillColor,
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
      top: 13,
      //bottom: 15,
    },
    prefixIconImage: {
      height: 20,
      width: 20,
    },
    suffixIcon: {
      right: 5,
      position: 'absolute',
      justifyContent: 'center',
      top: 15,
      //bottom: 15,
    },
    loadingIcon: {
      right: 10,
      position: 'absolute',
      justifyContent: 'center',
      top: 20,
    },
    inputLoader: {
      height: 8,
      width: 8,
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

export default memo(CustomTextInput);
