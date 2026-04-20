import {
  CustomAvatar,
  CustomFlatList,
  CustomText,
  Shadow,
  Tap,
} from '@/components/atoms';
import { keyboardShouldPersistTapsType } from '@/components/atoms/customFlatList/customFlatList';
import { TextVariants } from '@/components/atoms/customText/customText';
import { LinkPreviewCard } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetLinkPreviewHTMLModel } from '@/services/models';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  containsJavaScript,
  getLastUrlFromText,
  isEmpty,
  isUrlComplete,
  showSnackbar,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import CustomHtmlEditor, {
  ContentSizeChangeEvent,
  CustomHtmlEditorRef,
} from './customHtmlEditor';

export enum InputTextAlignVertical {
  auto = 'auto',
  bottom = 'bottom',
  center = 'center',
  top = 'top',
}

type Props<T> = {
  text: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  list: T[];
  nameKey: keyof T;
  profilePicKey?: keyof T;
  idKey: keyof T;
  placeholder?: string;
  showAbove?: boolean;
  allowBackPress?: (value: boolean) => void;
  error?: string;
  textAlign?: InputTextAlignVertical;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  showError?: boolean;
  showSuggestionOutside?: boolean;
  noTaggableUsersLeft?: boolean; // ✅ NEW: true when parent knows *no users are left to tag*
  inputRef?: RefObject<CustomHtmlEditorRef | null>;
  onLinkPreviewChange?: (data?: GetLinkPreviewHTMLModel) => void;
  showLinkPreviewOutside?: boolean;
  resetPreview?: boolean;
  hideSuggestions?: number;
  onContentSizeChange?: (e: ContentSizeChangeEvent) => void;
  extraPreviewHeight?: number;
  showErrorMsg?: (error?: string) => void;
  hidePreview?: boolean;
};

function MentionTextInput<T>({
  showAbove = true,
  showSuggestionOutside = false,
  showLinkPreviewOutside = false,
  resetPreview = false,
  hidePreview = true,
  ...props
}: Props<T>) {
  const theme = useTheme(); // Theme

  const { t } = useTranslation();

  const styles = makeStyles(theme); // Styling

  const inputRef = props.inputRef ?? useRef<CustomHtmlEditorRef>(null);

  const [searchList, setSearchList] = useState<any[]>([]);

  const [showSuggetions, setShowSuggetions] = useState(false);

  const [currentWord, setCurrentWord] = useState(''); // current word for mention

  const MAX_LINES = 6;
  const LINE_HEIGHT = 20;
  const PADDING_VERTICAL = 0;

  const MIN_HEIGHT = 48;
  const MAX_HEIGHT = MAX_LINES * LINE_HEIGHT + PADDING_VERTICAL;

  const [editorHeight, setEditorHeight] = useState(MIN_HEIGHT);

  const onContentSizeChange = (e: any) => {
    const h = e?.nativeEvent?.contentSize?.height ?? MIN_HEIGHT;

    const clamped = Math.max(MIN_HEIGHT, Math.min(h, MAX_HEIGHT));
    setEditorHeight(clamped);
    props.onContentSizeChange?.(e);
  };

  const [latestUrl, setLatestUrl] = useState<string>(); // Latest URL detected
  const [linkPreviewData, setLinkPreviewData] =
    useState<GetLinkPreviewHTMLModel>(); // Data for the link preview
  // Status of the link preview (idle, loading, ready, error)
  const [linkPreviewLoading, setLinkPreviewLoading] = useState<boolean>(false);
  const [showLinkPreviewCard, setShowLinkPreviewCard] = useState(false);

  // for main screen to allow back press if no suggestion is showing
  useEffect(() => {
    if (props.allowBackPress) {
      if (showSuggetions) {
        props.allowBackPress(false);
      } else {
        props.allowBackPress?.(!showSuggetions);
        props.allowBackPress(true);
      }
    }
  }, [showSuggetions]);

  // to hide suggestion when main screen back press is called
  useEffect(() => {
    // ✅ every tick => hard close
    setSearchList([]);
    setShowSuggetions(false);
    setCurrentWord('');
  }, [props.hideSuggestions]);

  useEffect(() => {
    handleReset();
  }, [resetPreview]);
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

  const handleReset = () => {
    setLatestUrl(undefined);
    setLinkPreviewData(undefined);
    setShowLinkPreviewCard(false);
    props.onLinkPreviewChange?.(undefined);
  };

  // set text
  const handleOnChange = (query: string) => {
    // Convert HTML → plain text
    const plainText = query
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();

    // 🚫 BLOCK if JS detected
    if (containsJavaScript(query) || containsJavaScript(plainText)) {
      props.inputRef?.current?.setHtml('');
      props.onChangeText('');

      handleReset();
      showSnackbar(t('InvalidJSMsg'), 'danger');
      props.showErrorMsg?.(t('InvalidJSMsg'));
      props.inputRef?.current?.dismissKeyboard();

      return;
    }

    // ✅ SAFE → continue normally
    props.onChangeText(plainText);
    props.onChangeText(query);

    if (hidePreview) {
      return;
    }
    // 🔑 FORCE URL CHECK HERE (keyboard suggestion safe)
    const lastUrl = getLastUrlFromText(query);

    if (!lastUrl) {
      handleReset();
      return;
    }

    // Prevent reopening if user closed manually
    if (!showLinkPreviewCard && lastUrl === latestUrl) return;

    if (lastUrl !== latestUrl && isUrlComplete(lastUrl)) {
      setLatestUrl(lastUrl);
      setLinkPreviewLoading(true);

      getLinkPreviewHTMLApi.mutate({
        apiPayload: {
          Url:
            lastUrl.includes('http://') || lastUrl.includes('https://')
              ? lastUrl
              : `https://${lastUrl}`,
        },
      });
    }
  };

  const handleCursorInfo = (data: any) => {
    const word = data.word || '';
    const text = data.text || '';
    setCurrentWord(word);

    if (props.noTaggableUsersLeft) {
      setShowSuggetions(false);
      return;
    }

    // Optional HTML safety check
    if (/<([a-z][\w-]*)\b[^>]*>/i.test(text)) {
      props.onChangeText('');
      showSnackbar(t('InvalidJSMsg'), 'danger');
      props.showErrorMsg?.(t('InvalidJSMsg'));
      return;
    }

    if (word.startsWith('@')) {
      const query = word.slice(1).toLowerCase();

      const filtered = props.list.filter(item =>
        String(item[props.nameKey])
          .toLowerCase()
          .replace(/\s+/g, '-')
          .startsWith(query),
      );

      setSearchList(filtered);
      setShowSuggetions(true);
    } else {
      setShowSuggetions(false);
      setSearchList([]);
    }
  };

  /* --------------------------------------------------------------- */
  /* Mention click */
  /* --------------------------------------------------------------- */

  const handleMentionClick = (item: T) => {
    const fullName = String(item[props.nameKey]);
    const mention = `@${fullName.replace(/\s+/g, '-')}`;

    // 🔥 Correct insertion via editor API
    inputRef.current?.insertMention(mention, currentWord);

    setShowSuggetions(false);
    setSearchList([]);
    setCurrentWord('');
  };

  /* --------------------------------------------------------------- */
  /* Editor message handler */
  /* --------------------------------------------------------------- */

  const handleEditorMessage = (data: any) => {
    if (data?.type === 'CURSOR_INFO') {
      handleCursorInfo(data);
    }
  };

  // Render formatted text with mentions like @John-Doe
  const renderFormattedText = (text: string) => {
    const mentionRegex = /(@[A-Za-z0-9_'\-]+)/g;

    // Split the text using the regex to separate mentions
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const isInList = props.list.filter(item => {
          return `@${item[props.nameKey]}`.replace(/\s+/g, '-') == part;
        });
        return `<span style="color:${
          isInList.length > 0 ? theme.colors.links : undefined
        }">${part}</span>`;
      }
      return part.replace(/\n/g, '<br/>');
    });
  };

  const renderMentionItem = (item: any) => {
    return (
      <Tap onPress={() => handleMentionClick(item)} style={styles.itemLay}>
        <View style={styles.itemContainer}>
          <CustomAvatar
            source={
              !isEmpty(item[props.profilePicKey]) && {
                uri: item[props.profilePicKey],
              }
            }
            text={
              isEmpty(item[props.profilePicKey])
                ? item[props.nameKey]
                : undefined
            }
            initialVariant={TextVariants.labelMedium}
            viewStyle={styles.profilePic}
            imageStyle={styles.profilePic}
          />

          <CustomText variant={TextVariants.bodyLarge} style={styles.name}>
            {item[props.nameKey]}
          </CustomText>
        </View>
      </Tap>
    );
  };

  return (
    <>
      {!hidePreview &&
        latestUrl &&
        !linkPreviewLoading &&
        showLinkPreviewCard &&
        !resetPreview && (
          <LinkPreviewCard
            shown={showLinkPreviewCard}
            style={
              showLinkPreviewOutside
                ? {
                    position: 'absolute',
                    bottom: editorHeight + (props.extraPreviewHeight || 0),
                    left: 0,
                    right: 0,
                  }
                : { marginVertical: 5 }
            }
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

      {showSuggetions && searchList.length > 0 && showSuggestionOutside && (
        <Shadow style={[styles.suggestions, styles.suggestionOutside]}>
          <CustomFlatList
            data={searchList}
            //keyExtractor={item => `${item[props.idKey]}`}

            keyboardShouldPersistTaps={keyboardShouldPersistTapsType.handled}
            nestedScrollEnabled={true}
            renderItem={({ item }) => renderMentionItem(item)}
          />
        </Shadow>
      )}
      <View
        style={[
          { flexShrink: 1, marginRight: showSuggestionOutside ? 30 : 0 },
          props.style,
        ]}
      >
        {showSuggetions &&
          searchList.length > 0 &&
          showAbove &&
          !showSuggestionOutside && (
            <Shadow style={[styles.suggestions, styles.suggestionAbove]}>
              <CustomFlatList
                data={searchList}
                //keyExtractor={item => `${item[props.idKey]}`}

                keyboardShouldPersistTaps={
                  keyboardShouldPersistTapsType.handled
                }
                nestedScrollEnabled={true}
                renderItem={({ item }) => renderMentionItem(item)}
              />
            </Shadow>
          )}

        <CustomHtmlEditor
          ref={inputRef}
          value={renderFormattedText(props.text).join(' ')}
          placeholder={props.placeholder}
          onChange={handleOnChange}
          scrollEnabled={true}
          onBlur={() => {
            setShowSuggetions(false);
            setCurrentWord('');
            props.onBlur?.();
          }}
          onFocus={props.onFocus}
          onMessage={handleEditorMessage}
          style={[
            // styles.container,
            props.error && props.error?.length > 0
              ? styles.mentionInputError
              : styles.mentionInput,
            props.contentStyle,
          ]}
          onContentSizeChange={onContentSizeChange}
        />
        {props.showError && (
          <CustomText
            variant={TextVariants.labelMedium}
            color={
              props.error && props.error?.length > 0
                ? theme.colors.error
                : theme.colors.onSurfaceVariant
            }
            style={styles.error}
          >
            {props.error && props.error?.length > 0 ? props.error : ''}
          </CustomText>
        )}
        {showSuggetions &&
          searchList.length > 0 &&
          !showAbove &&
          !showSuggestionOutside && (
            <Shadow style={[styles.suggestions, styles.suggestionBelow]}>
              <CustomFlatList
                data={searchList}
                keyExtractor={item => item[props.idKey]}
                keyboardShouldPersistTaps={keyboardShouldPersistTapsType.always}
                nestedScrollEnabled={true}
                renderItem={({ item }) => renderMentionItem(item)}
              />
            </Shadow>
          )}
      </View>
    </>
  );
}

// Styles
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    background: {
      backgroundColor: theme.colors.popupBg,
      flex: 1,
    },
    above: {
      bottom: 60,
      paddingRight: 100,
      justifyContent: 'flex-end',
    },
    below: {
      top: 60,
      paddingRight: 100,
    },
    suggestions: {
      maxHeight: 300,
      minHeight: 100,
      padding: 0,
      borderRadius: 0,
    },
    suggestionAbove: {
      borderTopLeftRadius: theme.roundness,
      borderTopRightRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
    },
    suggestionOutside: {
      borderTopLeftRadius: theme.roundness,
      borderTopRightRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
    },
    suggestionBelow: {
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
    },
    mentionInput: {
      backgroundColor: theme.colors.surface,
      width: '100%',
      marginHorizontal: 10,
      color: theme.colors.onSurfaceVariant,
      ...Platform.select({
        ios: {
          minHeight: 40, // as same as height,
        },
        android: {
          minHeight: 40,
          paddingVertical: 0,
        },
      }),
    },
    mentionInputError: {
      backgroundColor: theme.colors.surface,
      //borderWidth: 2,
      //borderColor: theme.colors.error,
      //borderRadius: theme.roundness,
      color: theme.colors.onSurfaceVariant,
      ...Platform.select({
        ios: {
          minHeight: 40, // as same as height,
        },
        android: {
          minHeight: 40,
          paddingVertical: 0,
        },
      }),
    },
    itemLay: {
      padding: 5,
    },
    itemContainer: {
      flexDirection: 'row',
    },
    profilePic: {
      height: 30,
      width: 30,
      borderRadius: theme.roundness,
    },
    name: {
      flex: 1,
      marginLeft: 10,
    },
    error: {
      marginHorizontal: 12,
      marginTop: 3,
    },
  });

export default MentionTextInput;
