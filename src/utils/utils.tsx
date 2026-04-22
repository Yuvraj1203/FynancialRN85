import { storage } from '@/App';
import { sessionService } from '@/components/template/biometricPopup/sessionService.ts';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup.tsx';
import { RootStackParamList } from '@/navigators/types/index.ts';
import { cancelAllRequests } from '@/services/apiCancellation.ts';
import { ApiConstants } from '@/services/apiConstants.ts';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance.ts';
import { postDocumentsForFeed } from '@/services/models/communityModel/communityModel.ts';
import {
  GetUsersByGroupIdForTagModel,
  LoginWith,
} from '@/services/models/index.ts';
import {
  appStartStore,
  authenticationTokenStore,
  badgesStore,
  biometricStore,
  dashboardCardsStore,
  notificationPermissionStore,
  templateStore,
  useFailedMessageStore,
  useLogoutStore,
  userStore,
} from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore.ts';
import useSignalRStore from '@/store/signalRStore/signalRStore.ts';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { DdSdkReactNative } from '@datadog/mobile-react-native';
import { signOut } from '@okta/okta-react-native';
import NetInfo from '@react-native-community/netinfo';
import { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import plugin
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppState,
  AppStateStatus,
  BackHandler,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  Platform,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import DeviceInfo from 'react-native-device-info';
import { MessageType, showMessage } from 'react-native-flash-message';
import { trigger } from 'react-native-haptic-feedback';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { RichEditor } from 'react-native-pell-rich-editor/index';
import {
  PERMISSIONS,
  Permission,
  RESULTS,
  check,
  request,
} from 'react-native-permissions';
import Share from 'react-native-share';
import { clearChatImagesCacheIfExpired } from './fileDownloadUtils.ts';
import {
  resetAccessToken,
  saveAccessTokenInKeychain,
} from './keychainUtils.ts';
import Log from './logger';
import { useAppNavigation } from './navigationUtils.tsx';
import { cancelNotification } from './notificationUtils.ts';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime); // Extend dayjs with relativeTime
dayjs.extend(isSameOrBefore);

export function checkString(value?: string, isEmpty: boolean = false): string {
  var na = 'N/A';
  if (value == undefined) {
    return isEmpty ? '' : na;
  } else if (value == null) {
    return isEmpty ? '' : na;
  } else if (value.length == 0) {
    return isEmpty ? '' : na;
  } else {
    return value;
  }
}

export interface Asset {
  base64?: string;
  uri?: string;
  width?: number;
  height?: number;
  originalPath?: string;
  fileSize?: number;
  type?: string;
  fileName?: string;
  duration?: number;
  bitrate?: number;
  timestamp?: string;
  id?: string;
}

export type LogoutProps = {
  noNavigation?: boolean;
  hardLogout?: boolean;
};

export enum HapticFeedbackTypes {
  impactLight = 'impactLight',
  impactMedium = 'impactMedium',
  impactHeavy = 'impactHeavy',
  rigid = 'rigid',
  soft = 'soft',
  notificationSuccess = 'notificationSuccess',
  notificationWarning = 'notificationWarning',
  notificationError = 'notificationError',
  selection = 'selection',
}
const TOGGLE_MORE = 'action://toggle-content';

// export function isEmpty(value: string | undefined | null): boolean {
//   Log('value -' + value);
//   if (value == undefined) {
//     return true;
//   } else if (value == null) {
//     return true;
//   } else if (value?.trim().length == 0) {
//     return true;
//   } else {
//     return false;
//   }
// }

export function isEmpty(value: string | undefined | null): boolean {
  return value == null || /^\s*$/.test(value);
}

export const hasMathUnicode = (text: string) =>
  /[\u{1D400}-\u{1D7FF}\u{FF00}-\u{FFEF}]/u.test(text);

export const normalizeTagWrappers = (html?: string) => {
  if (!html) return html;
  if (!html.includes('tag_txt')) return html;

  let out = html;

  // 1) remove useless wrapper spans only (no UI change)
  out = out.replace(/<span[^>]*>\s*(<span[^>]*>\s*)+/gi, '');
  out = out.replace(/(\s*<\/span>\s*)+/gi, '');

  // 2) IMPORTANT: Multi-tag separation fix
  // Between two tag inputs: add a zero-width separator so renderer doesn't merge backgrounds.
  // This keeps your same tag structure, just ensures each tag is isolated.
  out = out.replace(
    /(<input[^>]*\btag_txt\b[^>]*>)(?:&nbsp;|\s|&#160;)+(?=<input[^>]*\btag_txt\b[^>]*>)/gi,
    '$1&nbsp;<span></span>&nbsp;',
  );

  return out;
};

//added by shivang for ' symbol handling
export const normalizeApostrophe = (s: string) =>
  (s ?? '')
    .normalize('NFKC')
    // common apostrophe variants → plain '
    .replace(/[\u2018\u2019\u02BC\uFF07]/g, "'");

const escapeHtmlAttr = (s: string) =>
  (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// ✅ Normalized compare helper (case + apostrophe)
const normalizeForCompare = (s: string) =>
  normalizeApostrophe((s ?? '').trim()).toLowerCase();

export const ensureBalancedInlineTags = (html: string) => {
  if (!html) return html;

  let out = html;

  const closeMissing = (tag: string) => {
    const open = (out.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const close = (out.match(new RegExp(`</${tag}>`, 'gi')) || []).length;

    if (open > close) out += `</${tag}>`.repeat(open - close);
  };

  closeMissing('mark');
  closeMissing('span');
  closeMissing('a');
  closeMissing('tag'); // ✅ custom mention tag safety

  return out;
};

export const removeTrailingAtFromHtml = (html: string): string => {
  if (!html) return html;

  // Remove ONLY if "@"" is at the very end (after it only tags/spaces/&nbsp; are left)
  return html.replace(/@(?=(?:\s|&nbsp;|<[^>]*>)*$)/g, '');
};

export const formatMentionsInsideHtml = <T extends { fullName?: any }>(
  html: string,
  users: T[],
): string => {
  if (!html) return '';
  if (!users || users.length === 0) return html;
  if (!html.includes('@')) return html;

  // split HTML into [tags + text chunks]
  const chunks = html.split(/(<[^>]+>)/g);

  // prevent double-wrapping when already inside <tag>...</tag>
  let insideMentionTag = 0;

  const isOpenMentionTag = (s: string) =>
    /^<\s*tag\b/i.test(s) && !/^<\s*\/\s*tag\b/i.test(s);

  const isCloseMentionTag = (s: string) => /^<\s*\/\s*tag\b/i.test(s);

  return chunks
    .map(chunk => {
      if (!chunk) return '';

      // HTML tag → keep as-is
      if (chunk.startsWith('<')) {
        if (isOpenMentionTag(chunk)) insideMentionTag += 1;
        else if (isCloseMentionTag(chunk))
          insideMentionTag = Math.max(0, insideMentionTag - 1);

        return chunk;
      }

      // text chunk
      if (insideMentionTag > 0) return chunk; // already formatted mention
      if (!chunk.includes('@')) return chunk;

      // Apply same mention formatting as normal flow
      return formatMentions(chunk as any, users as any).formattedText;
    })
    .join('');
};

//end shivang work

export function getFileExtension(path: string): string {
  if (!path) return '';

  // Normalize and strip query/hash
  const clean = path.replace(/\\/g, '/').split('?')[0].split('#')[0];

  // Get the file name
  const fileName = clean.substring(clean.lastIndexOf('/') + 1);

  // Find last dot
  const dot = fileName.lastIndexOf('.');

  // No extension, hidden file (".env"), or trailing dot -> return empty
  if (dot <= 0 || dot === fileName.length - 1) return '';

  // Return from the dot, e.g. ".pdf"
  return fileName.substring(dot).toLowerCase();
}

export function prettifyAndPrintJSON(tag: string, jsonString: string): void {
  if (__DEV__) {
    try {
      const jsonObject = JSON.parse(jsonString);
      const prettifiedJsonString = JSON.stringify(jsonObject, null, 2);
      const maxLength = 1050;

      if (prettifiedJsonString.length > maxLength) {
        Log(tag + ' START::==>');
        let startIndex = 0;
        while (startIndex < prettifiedJsonString.length) {
          const chunk = prettifiedJsonString.substring(
            startIndex,
            startIndex + maxLength,
          );
          Log(chunk);
          startIndex += maxLength;
        }
        Log(tag + ' <==::END');
      } else {
        Log(tag + ' START::==>\n' + prettifiedJsonString);
        Log(tag + ' <==::END');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Log('Original JSON:' + jsonString);
    }
  }
}

export function showSnackbar(
  msg: string,
  type: MessageType | undefined = 'default',
  delay?: number,
) {
  if (msg.length > 0) {
    showMessage({
      message: msg,
      type: type,
      floating: true,
      ...(delay ? { duration: delay } : {}),
    });
  }
}

/**
 * Added by @Akshita 05-02-2025 -> to validate the Urls */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';

  // Trim whitespace
  const trimmed = url.trim();

  // If already has http/https
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If starts with www. or just domain, prepend http
  return `https://${trimmed}`;
};

export async function handleDocumentItemClick(
  doc: postDocumentsForFeed,
  navigation: NavigationProp<any>,
  openInAppBrowser: (url?: string) => Promise<void>,
  theme: CustomTheme,
) {
  // Grab extension from URL
  const url = doc.contentURL;
  const ext = (url?.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  const isAudio = ['mp3', 'wav', 'aac'].includes(ext);
  const isVideo = ext === 'mp4';

  if (url) {
    // 1) Images: fullscreen popup
    if (isImage && doc.contentType === 'I') {
      return showImagePopup({ imageList: [url] });
    }

    // 2) Audio/Video: open directly in browser/player
    if (isAudio || isVideo || doc.contentType === 'V') {
      return openInAppBrowser(url);
    }

    // 3) Link content
    if (doc.contentType === 'L') {
      return openInAppBrowser(normalizeUrl(url));
    }

    // 4) Embedded/HTML
    if (doc.contentType === 'E' || doc.contentType === 'H') {
      const htmlData = processHtmlContent({
        html: url,
        maxWords: 50,
        linkColor: theme.colors.links,
      });
      return navigation.navigate('HtmlRenderScreen', {
        title: doc.documentName,
        html: htmlData?.Content,
        iFrameList: htmlData?.iFrameList,
        htmlContent: url,
      });
    }

    // 5) PDF or other “D” documents: Google Docs Viewer fallback
    if (doc.contentType === 'D') {
      const viewerUrl = isPdf
        ? url
        : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
            url,
          )}`;

      // PDF → embed directly
      if (isPdf) {
        return openInAppBrowser(
          `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
            viewerUrl,
          )}`,
        );
      }

      // non-PDF docs → Google viewer
      return openInAppBrowser(viewerUrl);
    }

    // 6) Anything else: fallback to direct open
    return openInAppBrowser(url);
  }
}

/**
 * Added by @Tarun 05-02-2025 ->
 * Checks if the specified time interval has passed since the given timestamp.
 *
 * This function compares the current time with the provided `previousTimestamp`
 * and checks if the difference exceeds the specified interval, which can be
 * defined in days, hours, minutes, and seconds. If no interval is provided,
 * the default interval is 1 second.
 *
 * @param {number} previousTimestamp - The timestamp to compare the current time against.
 * @param {Object} [interval] - An optional object specifying the interval in days, hours, minutes, and seconds.
 * @param {number} [interval.days=0] - The number of days in the interval (default is 0).
 * @param {number} [interval.hr=0] - The number of hours in the interval (default is 0).
 * @param {number} [interval.min=0] - The number of minutes in the interval (default is 0).
 * @param {number} [interval.sec=1] - The number of seconds in the interval (default is 1).
 * @returns {boolean} `true` if the current time exceeds the `previousTimestamp` by the specified interval, otherwise `false`.
 */
export const checkIntervalTime = (
  previousTimestamp: number,
  {
    days = 0,
    hr = 0,
    min = 0,
    sec = 1,
  }: { days?: number; hr?: number; min?: number; sec?: number } = {},
): boolean => {
  const currentTime = new Date().getTime();

  // Convert days, hr, min, and sec to milliseconds
  const intervalInMilliseconds =
    ((days * 24 + hr) * 60 + min) * 60 * 1000 + sec * 1000;

  return currentTime - previousTimestamp > intervalInMilliseconds;
};

export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export function runAsyncTask(
  promise: () => void | Promise<void>,
  delayMs?: number,
): void {
  (async () => {
    try {
      if (delayMs) {
        await delay(delayMs);
      }
      await promise();
    } catch (error) {
      console.error('An error occurred while executing the async task:', error);
    }
  })();
}

export const appResumeCallback = (callback: () => void): void => {
  // Define a reference to store the current app state
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Memoize the app state change handler using useCallback
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        callback(); // Execute the callback when the app returns to active state
      }

      appStateRef.current = nextAppState; // Update the ref with the new app state
    },
    [callback],
  ); // Include callback in dependency array

  // Set up the app state change listener using useEffect
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      // Clean up the listener on component unmount
      subscription.remove();
    };
  }, [handleAppStateChange]); // Include handleAppStateChange in dependency array
};

export const useCustomInAppBrowser = () => {
  const theme = useTheme(); // Access theme colors
  const { t } = useTranslation(); // Translations

  const normalizeUrl = (url: string): string => {
    if (!url) return '';

    try {
      // Trim spaces and fix casing of scheme
      const trimmed = url.trim();

      //accept mailto
      if (url.startsWith('mailto')) {
        return trimmed;
      }

      // If scheme is missing, reject
      if (!/^https?:\/\//i.test(trimmed)) {
        return '';
      }

      // Force lowercase scheme (http/https)
      const fixedScheme = trimmed.replace(/^https?:\/\//i, match =>
        match.toLowerCase(),
      );

      // Validate with URL constructor
      const parsed = new URL(fixedScheme);

      // Must be http or https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }

      return parsed.toString();
    } catch {
      return '';
    }
  };

  const openInAppBrowser = async (url?: string, onClose?: () => void) => {
    if (!url || url.length === 0) {
      return;
    }

    try {
      if (await InAppBrowser.isAvailable()) {
        InAppBrowser.close();
        useLogoutStore.getState().setIsLoggingOut(true);
        Log('isLoggingOut=>InAppbrowser = true');
        // ✅ Detect if the URL is a PDF & use Google Docs Viewer
        const isPdf = url.toLowerCase().endsWith('.pdf');
        const finalUrl = isPdf
          ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
              normalizeUrl(url),
            )}`
          : normalizeUrl(url);

        const result = await InAppBrowser.open(finalUrl, {
          // iOS Properties
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: theme.colors.primary,
          preferredControlTintColor: theme.colors.surface,
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: true,
          toolbarColor: theme.colors.surface,
          secondaryToolbarColor: theme.colors.surfaceVariant,
          navigationBarColor: theme.colors.surface,
          navigationBarDividerColor: theme.colors.surface,
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right',
          },
        })
          .catch(() => {
            Log(
              '❌ InAppBrowser Failed: Opening in System Browser=>' + finalUrl,
            );
            Linking.openURL(finalUrl); // Fallback to system browser
          })
          .finally(() => {
            useLogoutStore.getState().setIsLoggingOut(false);
            Log('isLoggingOut=>InAppbrowser = false');
          });

        if (onClose) {
          onClose();
        }
      } else {
        Log('🔗 InAppBrowser not available: Opening in system browser');
        await Linking.openURL(url);
      }
    } catch (error) {
      Log('❌ openInAppBrowser error => ' + error);
    }
  };

  return openInAppBrowser;
};

export const openBase64File = async (
  base64String: string,
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
) => {
  try {
    const url = `data:${mimeType};base64,${base64String}`;

    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, {
        dismissButtonStyle: 'close',
        modalEnabled: true,
        showTitle: true,
      });
    } else {
      Linking.openURL(url);
    }
  } catch (error) {
    console.error(error);
  }
};

// to open url links in external browser
export const openUrl = (url?: string) => {
  if (url == undefined) {
    return;
  } else if (url.length == 0) {
    return;
  }
  Linking.openURL(url).catch(err => Log("Don't know how to open Url: " + url));
};

// Function to find the last instance of an object that matches a condition
export function findLast<T>(
  array: T[] | undefined,
  predicate: (value: T) => boolean,
): T | undefined {
  if (!array || array.length === 0) {
    return undefined;
  }

  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return array[i];
    }
  }

  return undefined;
}

export const parseTime = ({
  time,
  parseFormat,
}: {
  time: string;
  parseFormat: string;
}): Date | undefined => {
  const parsedTime = dayjs(time, parseFormat);
  return parsedTime.isValid() ? parsedTime.toDate() : undefined;
};

export const formatTime = ({
  time,
  parseFormat = '',
  returnFormat = 'HH:mm a',
}: {
  time: string | Date;
  parseFormat?: string;
  returnFormat?: string;
}): string => {
  const parsedTime = parseFormat ? dayjs(time, parseFormat) : dayjs(time);
  return parsedTime.isValid() ? parsedTime.format(returnFormat) : '';
};

export const parseDate = ({
  date,
  parseFormat,
}: {
  date: string;
  parseFormat: string;
}): Date | undefined => {
  const parsedDate = dayjs(date, parseFormat);
  return parsedDate.isValid() ? parsedDate.toDate() : undefined;
};

export const formatDate = ({
  date,
  parseFormat = '',
  returnFormat = 'MMM DD, YYYY',
}: {
  date: string | Date;
  parseFormat?: string;
  returnFormat?: string;
}): string => {
  dayjs.extend(customParseFormat);
  const parsedDate = parseFormat ? dayjs(date, parseFormat) : dayjs(date);
  return parsedDate.isValid() ? parsedDate.format(returnFormat) : '';
};

dayjs.extend(utc);
dayjs.extend(customParseFormat);

// Get current date time for schedule
export const getCurrentDateTime = () => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // If it's after 11:30 PM, set the start date to the next day
  if (currentHours >= 23 && currentMinutes >= 45) {
    now.setDate(now.getDate() + 1); // Set the date to the next day
  }

  // Round to the nearest 15 minutes
  let minutes = Math.ceil(now.getMinutes() / 15) * 15;
  now.setMinutes(minutes);
  now.setSeconds(0);
  now.setMilliseconds(0);

  // Adjust the time if the difference is less than 5 minutes
  const difference = now.getTime() - new Date().getTime(); // Time difference in milliseconds
  if (difference < 5 * 60 * 1000 && difference >= 0) {
    minutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes + 15);
    now.setSeconds(0);
    now.setMilliseconds(0); // Round up to next 15 minutes
  }

  return now;
};

// get end date time for schedule event
export const getEndDateTime = () => {
  const now = getCurrentDateTime();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  if (currentHours >= 23 && currentMinutes >= 45) {
    now.setDate(now.getDate() + 1); // Set the date to the next day
  }
  // Step 2: Format the start date and time as 'MMM DD, YYYY, hh:mm AM/PM'

  // Step 3: Set the end date and time (30 minutes after the start time)
  const currentEndDateTime = new Date(now);
  currentEndDateTime.setMinutes(now.getMinutes() + 30); // End time will be 30 minutes later

  return currentEndDateTime;
};

// Parses a UTC date string into a Date object
export const parseDateUtc = ({
  date,
  parseFormat,
}: {
  date: string;
  parseFormat: string;
}): Date | undefined => {
  const parsedDate = dayjs.utc(date, parseFormat);
  return parsedDate.isValid() ? parsedDate.toDate() : undefined;
};

export const formatDateUtc = ({
  date,
  parseFormat,
  returnFormat = 'YYYY-MM-DDTHH:mm:ss',
}: {
  date: string | Date | number;
  parseFormat?: string;
  returnFormat?: string;
}): string => {
  return dayjs.utc(date, parseFormat).format(returnFormat);
};

// Converts a UTC date to local time and formats it
export const formatDateUtcReturnLocalTime = ({
  date,
  parseFormat,
  returnFormat = 'MMM DD, YYYY',
}: {
  date: string | Date | number;
  parseFormat?: string;
  returnFormat?: string;
}): string => {
  return dayjs.utc(date, parseFormat).local().format(returnFormat);
};

export const parseLocalDateReturnUtc = ({
  date,
  parseFormat,
}: {
  date: string | Date | number;
  parseFormat?: string;
}): Dayjs => {
  return dayjs(date, parseFormat).utc();
};

export const getDatesBetween = ({
  start,
  end,
  returnFormat,
}: {
  start: string;
  end: string;
  returnFormat?: string;
}): string[] => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const dates: string[] = [];

  let current = startDate;

  while (current.isSameOrBefore(endDate, 'day')) {
    dates.push(current.format(returnFormat));
    current = current.add(1, 'day');
  }

  return dates;
};

//check if the date is gone @Yuvraj
export const isPastDate = ({
  date,
  parseFormat,
}: {
  date: string | Date | number;
  parseFormat?: string;
}): boolean => {
  const formattedDate = dayjs.utc(date, parseFormat).local();
  return formattedDate.isBefore(dayjs());
};

//check if the date is in range  @Yuvraj
export const isDateInRange = (
  startEventDate: string,
  endEventDate: string,
  selectedDate: string,
): boolean => {
  const start = dayjs(startEventDate);
  const end = dayjs(endEventDate);
  const selected = dayjs(selectedDate);
  // Check if selected date is equal to start, end, or falls between them
  return (
    selected.isSame(start, 'day') ||
    selected.isSame(end, 'day') ||
    (selected.isAfter(start, 'day') && selected.isBefore(end, 'day'))
  );
};

/** Added by @Akshita 05-02-2025 -> Default formats*/
const DATE_FORMAT = 'MMM DD, YYYY'; // Example: "Feb 12, 2025"
const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'; // Example: "2025-02-12T14:30:00"
const TIME_FORMAT = 'hh:mm a';
const UTC_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** Added by @Akshita 05-02-2025 -> Convert UTC date to current timezone (Date only)*/
export const getUtcDate = (timestamp: string): string => {
  return dayjs.utc(timestamp).local().format(DATE_FORMAT);
};

// Convert UTC date to current timezone (Date + Time)
export const getUtcDateWithTime = (timestamp: string): string => {
  return dayjs.utc(timestamp).local().format(DATE_TIME_FORMAT);
};

// Convert UTC date to current timezone (Time only)
export const getUtcWithTimeOnly = (timestamp: string): string => {
  return dayjs.utc(timestamp).local().format(TIME_FORMAT);
};

// Convert IST (or any current timezone) to UTC
export const getISTToUtcDateWithTime = (timestamp: string): string => {
  return dayjs(timestamp).utc().format(DATE_TIME_FORMAT);
};

// Convert UTC date to current timezone (Same as `getUtcWithTimeOnly`)
export const getUtcDateTime = (timestamp: string | Date): string => {
  return dayjs.utc(timestamp).local().format(TIME_FORMAT);
};

/** Added by @Akshita 03-03-2025 -> Convert new date to utc timezone (Date only)*/
export const getCurrentUTCdate = (): string => {
  const utcDate = dayjs.utc().format(UTC_DATE_FORMAT);
  console.log('UTC Date:', utcDate);
  return utcDate;
};

export const getDisplayAgoTime = (date: string): string => {
  return dayjs(date).fromNow();
};

export const getVideoThumbnail = (iframeString: string): string | undefined => {
  // Regular expression to match YouTube and Vimeo video URLs
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;

  // Check if the iframe string contains a YouTube URL
  const youtubeMatch = iframeString.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[1]) {
    const youtubeId = youtubeMatch[1];
    // Return YouTube thumbnail URL
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  // Check if the iframe string contains a Vimeo URL
  const vimeoMatch = iframeString.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    // Vimeo thumbnails need to be fetched via the Vimeo API
    return `https://vumbnail.com/${vimeoId}.jpg`; // This is a service that provides Vimeo thumbnails
  }

  return undefined; // Return null if neither YouTube nor Vimeo URL is found
};

type PermissionType = 'camera' | 'microphone';

export const requestPermission = async (
  type: PermissionType,
): Promise<boolean> => {
  try {
    let permission: Permission;

    // Determine the correct permission based on type and platform
    switch (type) {
      case 'camera':
        permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.CAMERA
            : PERMISSIONS.ANDROID.CAMERA;
        break;
      case 'microphone':
        permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.MICROPHONE
            : PERMISSIONS.ANDROID.RECORD_AUDIO;
        break;
      default:
        throw new Error(`Unsupported permission type: ${type}`);
    }

    // Check the current permission status
    const status = await check(permission);

    if (status === RESULTS.GRANTED) {
      Log(`${type} permission already granted.`);
      return true;
    } else if (status === RESULTS.DENIED) {
      Log(`${type} permission is not granted. Requesting now...`);
      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        Log(`${type} permission granted.`);
        return true;
      } else {
        Log(`${type} permission denied.`);
        return false;
      }
    } else if (status === RESULTS.BLOCKED) {
      Log(`${type} permission is blocked. Please enable it from settings.`);
      return false;
    } else {
      Log(`${type} permission status: ${status}`);
      return false;
    }
  } catch (error) {
    Log('Error while requesting permission:' + error);
    return false;
  }
};

export const openAppSettings = async (): Promise<void> => {
  try {
    await Linking.openSettings();
  } catch (error) {
    Log('Error opening settings page:' + error);
  }
};

export const hideKeyboard = () => {
  if (Keyboard.isVisible()) {
    Keyboard.dismiss();
  }
};

type HtmlContentConfig = {
  html?: string;
  maxWords?: number;
  linkColor?: string;
  showMore?: boolean;
};

export type HtmlContentReturnType = {
  Content?: string;
  shortContent?: string;
  iFrameList?: string[];
};

export type HtmlContentModel = {
  Content?: string;
  shortContent?: string;
  iFrameList?: string[];
  iFrameThumbnailList?: { iframe: string; thumbnail?: string }[];
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Detect your own toggle links (href="${TOGGLE_MORE}" + See more/less)
const TOGGLE_ANCHOR_REGEX = new RegExp(
  `<a\\s+href="${escapeRegExp(
    TOGGLE_MORE,
  )}"[\\s\\S]*?>[\\s\\S]*?See\\s+(more|less)[\\s\\S]*?<\\/a>`,
  'gi',
);

const stripExistingToggleLinks = (value: string) => {
  if (!value) return value;

  // remove the whole wrapper <span> ... </span> which contains our toggle anchor
  return value.replace(
    new RegExp(
      `<span>[\\s\\S]*?<a\\s+href="${escapeRegExp(
        TOGGLE_MORE,
      )}"[\\s\\S]*?<\\/a>[\\s\\S]*?<\\/span>`,
      'gi',
    ),
    '',
  );
};

/**
 * Added by @Tarun 13-02-2025 -> Processes HTML content to generate shortened content, manage links
 * and iframes (FYN-4204)
 *
 * This function processes HTML content by truncating it to a specified number of words and extracting
 * any links, with customization options for the number of words to display, the color of links, and whether
 * to show a "Show More" option. It returns the processed content in a structured format.
 *
 * @param {HtmlContentConfig} config - The configuration object for processing HTML content.
 * @param {string} [config.html] - The raw HTML content to be processed.
 * @param {number} [config.maxWords=75] - The maximum number of words to display in the shortened content (default is 50).
 * @param {string} [config.linkColor] - The color of links in the content (default is '#1e90ff').
 * @param {boolean} [config.showMore=true] - Flag indicating whether to show a "Show More" option (default is true).
 *
 * @returns {HtmlContentReturnType | undefined} The processed HTML content, including shortened content,
 *         full content, and any iFrame list. If no valid HTML is provided, returns `undefined`.
 */
export const processHtmlContent = ({
  html,
  maxWords = 75,
  linkColor,
  showMore = true,
}: HtmlContentConfig): HtmlContentModel | undefined => {
  html = normalizeTagWrappers(html);
  if (!html) return undefined;

  const iframeOrImgRegex = /(<iframe.*?>.*?<\/iframe>|<img.*?>)/gi;
  const idSpanRegex =
    /<input[^>]*class="[^"]*id_(\d+)"[^>]*data-id="\1"[^>]*value="([^"]+)"[^>]*>/g;
  const anchorTagRegex = /<a\b[^>]*>[\s\S]*?<\/a>/gi;

  const iFrameList: string[] = [];

  const MORE_LINK = `<span>&nbsp;<a href="${TOGGLE_MORE}"  style="color:#006c48 !important; text-decoration:none;">...See more</a></span>`;
  const LESS_LINK = `<span>&nbsp;<a href="${TOGGLE_MORE}"  style="color:#006c48 !important; text-decoration:none;">See less</a></span>`;

  const replaceInputsWithAt = (text: string) => {
    if (!text) return text;

    // If the incoming string may contain escaped quotes like: value=\"Name\"
    // first unescape them to normalize.
    const normalized = hasMathUnicode(text)
      ? text.replace(/\\"/g, '"') // preserve unicode
      : normalizeApostrophe(text).replace(/\\"/g, '"');

    // Replace every <input ... value="Name" ...> with @Name
    const result = normalized.replace(
      /<input[^>]*\bvalue="([^"]+)"[^>]*>/g,
      (_, v) => `<tag>${normalizeApostrophe(v)}</tag>`,
    );

    return result;
  };

  const processText = (rawHtml: string): string => {
    if (!rawHtml) return '';
    let htmlText = rawHtml.replace(/\n/g, '<br>');
    htmlText = replaceInputsWithAt(htmlText);
    const htmlWithMentions = htmlText.replace(
      idSpanRegex,
      (_, id, name) =>
        `<a href="id://${id}" style="color:${linkColor}; cursor:pointer;">${name}</a>`,
    );

    const anchorPlaceholders: string[] = [];

    const protectedHtml = htmlWithMentions.replace(anchorTagRegex, match => {
      anchorPlaceholders.push(match);
      return `<!--ANCHOR_${anchorPlaceholders.length - 1}-->`;
    });
    const parts = protectedHtml.split(iframeOrImgRegex);
    return parts
      .map(part => {
        if (part.match(iframeOrImgRegex)) {
          iFrameList.push(part);
          // Iframes render outside the content block; remove from inline HTML.
          // Images stay inline.
          if (/^<iframe/i.test(part)) {
            return '';
          }
          return part;
        }
        return linkifyHTML(part);
      })
      .join(' ')
      .replace(/<!--ANCHOR_(\d+)-->/g, (_, i) => anchorPlaceholders[+i]);
  };

  const truncateContentBeforeIframe = (rawHtml: string): string => {
    if (!rawHtml) return rawHtml;

    // count words from plain text (ignore tags); treat &nbsp; as whitespace
    const plainWordCount = rawHtml
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;

    if (!showMore || plainWordCount <= maxWords) return rawHtml;

    // tag-safe truncate (never breaks <a> / <img> / etc.)
    const truncateHtmlByWordsOutsideTags = (html: string, limit: number) => {
      let count = 0;
      let out = '';

      const tokens = html.match(/(<[^>]+>|[^<]+)/g) || [];

      for (const tok of tokens) {
        if (tok.startsWith('<')) {
          out += tok; // keep tag
          continue;
        }

        const parts = tok.split(/(\s+)/); // keep spaces

        for (const p of parts) {
          if (!p) continue;

          if (/^\s+$/.test(p)) {
            out += p;
            continue;
          }

          count++;
          out += p;

          if (count >= limit) return out;
        }
      }

      return out;
    };

    const safe = truncateHtmlByWordsOutsideTags(rawHtml, maxWords);

    //  add a space before MORE_LINK so it never sticks to a URL token
    return `${safe} ${MORE_LINK}`;
  };

  const removeTrailingBreaks = (value: string) =>
    value.replace(/(<br\s*\/?>|\s|&nbsp;)+$/gi, '');

  const cleanedHtml = removeTrailingBreaks(html);

  const truncatedHtml = truncateContentBeforeIframe(cleanedHtml);
  let shortContent = processText(truncatedHtml);

  const plainWordCount = html
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  // const removeTrailingBreaks = (html: string) => Log('html ---------->' + html);
  // html.replace(/(<br\s*\/?>|\s|&nbsp;)+$/gi, '');

  const HAS_LESS_LINK_REGEX = new RegExp(
    `<a[^>]*href=["']${TOGGLE_MORE}["'][^>]*>\\s*See\\s*less\\s*<\\/a>`,
    'i',
  );

  const hasLessLinkAlready = HAS_LESS_LINK_REGEX.test(cleanedHtml);
  let Content =
    showMore && plainWordCount > maxWords && cleanedHtml
      ? processText(`${cleanedHtml}${hasLessLinkAlready ? '' : LESS_LINK}`)
      : processText(cleanedHtml ?? '');

  // const Content =
  //   showMore && plainWordCount > maxWords && html
  //     ? processText(`${html}${LESS_LINK}`)
  //     : processText(html ?? '');
  Content = ensureBalancedInlineTags(Content);
  shortContent = ensureBalancedInlineTags(shortContent);

  return {
    Content, // 👈 full + Show less
    shortContent, // 👈 truncated + ...More
    iFrameList,
  };
};

/**
 * Extracts link preview HTML (rich anchor blocks) from message HTML so they
 * can be rendered outside the "See more / See less" truncation section.
 *
 * Regular linkified URLs produce simple anchors: <a href="…">url</a>
 * Link preview cards produced by the API contain child HTML elements inside
 * the anchor. We distinguish the two by checking for child tags in the content.
 */
/**
 * Extracts embedded iframes (YouTube, Vimeo, Loom, etc.) from HTML so they
 * can be rendered outside the "See more / See less" truncation section.
 */
export const extractEmbeddedIframes = (
  html: string,
): { cleanHtml: string; embeddedIframeHtml?: string } => {
  if (!html) return { cleanHtml: html };
  const iframes: string[] = [];
  const cleanHtml = html.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, match => {
    iframes.push(match);
    return '';
  });
  return {
    cleanHtml: cleanHtml.trim(),
    embeddedIframeHtml: iframes.length > 0 ? iframes.join('') : undefined,
  };
};

export const extractLinkPreviewHtml = (
  html: string,
): { cleanHtml: string; linkPreviewHtml?: string } => {
  if (!html) return { cleanHtml: html };

  let linkPreviewHtml: string | undefined;

  const cleanHtml = html.replace(
    /<a\s+[^>]*href="https?:\/\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
    (match, innerContent: string) => {
      // Link preview cards contain child HTML elements; plain linkified URLs do not
      if (!linkPreviewHtml && /<[a-z][^>]*>/i.test(innerContent)) {
        linkPreviewHtml = match;
        return '';
      }
      return match;
    },
  );

  return { cleanHtml: cleanHtml.trim(), linkPreviewHtml };
};

/**
 * After processHtmlContent has linkified URLs, remove the plain URL link
 * that corresponds to the extracted link preview card.
 * e.g. <a href="https://w3schools.com/">https://w3schools.com/</a> → removed
 * Called on Content/shortContent when linkPreviewHtml is present.
 */
export const stripPreviewUrlFromHtml = (
  html: string | undefined,
  linkPreviewHtml: string | undefined,
): string | undefined => {
  if (!html || !linkPreviewHtml) return html;
  const urlMatch = linkPreviewHtml.match(/href="([^"]+)"/i);
  if (!urlMatch?.[1]) return html;
  const base = urlMatch[1].replace(/\/$/, ''); // strip trailing slash
  const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match simple <a> whose href starts with the preview URL (handles trailing slash variants)
  return html.replace(
    new RegExp(`<a\\b[^>]*href="${esc}[^"]*"[^>]*>[^<]*<\\/a>`, 'gi'),
    '',
  );
};

//convert html in simple text with gap
export const elimateHtmlElement = (html: string) => {
  if (!html) return '';

  return (
    html
      // Replace <br>, <div>, <p>, etc. with a space
      .replace(/<(br|div|p|li|ul|ol|h[1-6])[^>]*>/gi, ' ')
      .replace(/<\/(div|p|li|ul|ol|h[1-6])>/gi, ' ')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace multiple spaces/newlines with a single space
      .replace(/\s+/g, ' ')
      .trim()
  );
};

// Added by @akshita 8-11-24 ---> Generic function to handle sharing based on platform
export const handleShare = async ({
  message,
  subject,
  fileUri,
  mimeType,
}: {
  message?: string;
  subject?: string;
  fileUri?: string;
  mimeType?: string;
}) => {
  if (!message && !fileUri) return;

  //   // Function to determine MIME type for the message
  //   const getMimeType = (message: string) => {
  //     // Check if the message is a URL (basic check for http/https protocol)
  //     const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
  //     if (urlRegex.test(message)) {
  //       return 'text/html'; // MIME type for URLs
  //     }
  //     return ''; // Default MIME type for non-URL messages
  //   };

  //   Share.open({
  //     message: message,
  //     url: fileUri,
  //     type: 'text/html', // Use the appropriate MIME type
  //     subject: subject,
  //   })
  //     .then(res => {
  //       Log('Share => ' + JSON.stringify(res));
  //     })
  //     .catch(err => {
  //       err && Log('Share Error => ' + JSON.stringify(err));
  //     });
  // } else {
  Share.open({
    message: message,
    url: fileUri,
    type: mimeType, // 🛠️ Pass the MIME type here
    subject: subject,
  })
    .then(res => {
      Log('Share => ' + JSON.stringify(res));
    })
    .catch(err => {
      err && Log('Share Error => ' + JSON.stringify(err));
    });
};

export const useBackPressHandler = (callback: () => boolean): void => {
  // Memoize the back button handler to avoid unnecessary re-renders
  const handleBackPress = useCallback(() => {
    return !callback(); // Execute the callback when the back button is pressed
  }, [callback]);

  // Set up the back button listener using useEffect
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      // Clean up the back button listener on component unmount
      backHandler.remove();
    };
  }, [handleBackPress]); // Include handleBackPress in dependency array
};

export const handleBase64 = (media: Asset) => {
  return `data:${media.type};base64,${media.base64}`;
};

export function updateArrayWithChanges<T, K extends keyof T>({
  targetArray,
  sourceArray,
  key,
  addOnTop = false,
}: {
  targetArray: T[];
  sourceArray: T[];
  key: K;
  addOnTop?: boolean;
}): T[] {
  // Replace or keep existing items
  const updatedArray = targetArray
    .map(targetItem => {
      const matchingSourceItem = sourceArray.find(
        sourceItem => sourceItem[key] === targetItem[key],
      );

      // Replace if the item exists in the source and has changed
      if (
        matchingSourceItem &&
        JSON.stringify(matchingSourceItem) !== JSON.stringify(targetItem)
      ) {
        return matchingSourceItem;
      }

      // Otherwise, keep the original item
      return targetItem;
    })
    // Remove items that are not present in the source array
    .filter(targetItem =>
      sourceArray.some(sourceItem => sourceItem[key] === targetItem[key]),
    );

  // Add new items from the source array that don't exist in the target array
  const newItems = sourceArray.filter(
    sourceItem =>
      !targetArray.some(targetItem => targetItem[key] === sourceItem[key]),
  );

  if (addOnTop) {
    return [...newItems, ...updatedArray];
  } else {
    return [...updatedArray, ...newItems];
  }
}

export const handleOpenDialer = (mobileNo?: string) => {
  if (isEmpty(mobileNo)) {
    return;
  }
  let phoneNumber = '';
  if (Platform.OS === 'android') {
    phoneNumber = `tel:${mobileNo}`;
  } else {
    phoneNumber = `telprompt:${mobileNo}`;
  }
  openUrl(phoneNumber);
};

export const useDebouncedSearch = (searchQuery?: string, delay = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    if (searchQuery === undefined) return; // Skip debounce if undefined

    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);

    return () => clearTimeout(handler); // Cleanup on next input
  }, [searchQuery, delay]);

  return debouncedQuery;
};

export const getFileInfoWithMime = (url?: string) => {
  if (!url) {
    return;
  }
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    // Add more if needed
  };

  const decodedUrl = decodeURIComponent(url);
  const parts = decodedUrl.split('/');
  const fileName = parts[parts.length - 1];
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = mimeMap[extension] || 'application/octet-stream'; // fallback if unknown

  return {
    fileName,
    mimeType,
  };
};

export const getImageSize = (
  imageUrl: string,
  callback: (size: { width: number; height: number }) => void,
) => {
  const MAX_WIDTH = Dimensions.get('window').width * 0.75;
  const MAX_HEIGHT = Dimensions.get('window').height * 0.6;

  if (!imageUrl) {
    callback({ width: MAX_WIDTH, height: MAX_HEIGHT });
    return;
  }

  Image.getSize(
    imageUrl,
    (srcWidth: number, srcHeight: number) => {
      const ratio = Math.min(MAX_WIDTH / srcWidth, MAX_HEIGHT / srcHeight);
      callback({ width: srcWidth * ratio, height: srcHeight * ratio });
    },
    /** Added by @akshita 05-02-25 --->Callback if the image fails to load*/
    () => callback({ width: MAX_WIDTH, height: MAX_HEIGHT }),
  );
};

// function to convert the html <a> tag to @mentions for mentionTextInput
// conversion is based on groupMembersAllList api
export const reverseFormatMentions = (
  formattedText: string,
  membersList: GetUsersByGroupIdForTagModel[],
): string => {
  return removeTrailingAtFromHtml(
    formattedText.replace(
      /<input[^>]*\bclass="[^"]*\btag_txt\b[^"]*"[^>]*\bvalue="([^"]+)"[^>]*>\s*(?:&nbsp;)*\s*/g,
      (match, value) => {
        const trimmed = value.trim();

        const isInList = membersList.some(
          u => u.fullName?.trim().toLowerCase() === trimmed.toLowerCase(),
        );

        if (!isInList) return match;

        const handle = '@' + trimmed.replace(/\s+/g, '-');
        return handle + ' ';
      },
    ),
  );
};

// convert the @mentions for addComment api
// also return mentioned members id's
export const formatMentions = (
  text: string,
  membersList: GetUsersByGroupIdForTagModel[],
): { formattedText: string; mentionedIds: string } => {
  text = removeTrailingAtFromHtml(text); //replace only end "@"
  let mentionedIds: string[] = [];

  // ✅ normalize input (handles ’ vs ')
  const normalizedText = normalizeApostrophe(text);

  // ✅ allow unicode apostrophe also (’)
  const formattedText = normalizedText.replace(
    /@([\w’'-]+)/g,
    (match, nameWithDash) => {
      // Replace '-' with space to get actual name
      const name = nameWithDash.replace(/-/g, ' ').trim();

      // ✅ compare after normalization (case + apostrophe)
      const member = membersList.find(
        m =>
          normalizeForCompare(m.fullName || '') === normalizeForCompare(name),
      );

      if (member && member.id) {
        mentionedIds.push(member.id.toString());

        // ✅ VERY IMPORTANT: escape value attr so HTML never breaks
        const safeFullName = escapeHtmlAttr(
          normalizeApostrophe(member.fullName || ''),
        );

        return `<input id="user-tag-1" type="button" class="tag_txt id_${member.id}" carpos="9" data-id="${member.id}" tabindex="-1" value="${safeFullName}">&nbsp;`;
      }

      // Return original if no member found
      return match;
    },
  );

  return {
    formattedText,
    mentionedIds: mentionedIds.join(','),
  };
};

export const internetReachable = async () => {
  // const timeout = (milliseconds: number) =>
  //   new Promise(resolve => setTimeout(resolve, milliseconds));

  // let isInternetReachable: boolean | null = false;

  // isInternetReachable = (await NetInfo.fetch()).isInternetReachable;

  // if (isInternetReachable) {
  //   return isInternetReachable;
  // }

  // await timeout(200);

  // isInternetReachable = (await NetInfo.fetch()).isInternetReachable;
  // return isInternetReachable;
  const netInfo = await NetInfo.fetch();
  if (Platform.OS == 'ios') {
    if (!netInfo.isConnected) {
      return false;
    }
  } else {
    if (!netInfo.isInternetReachable) {
      return false;
    }
  }
  return true;
};

/** added by @YUvraj 05-08-2025 --> Keyboard dismissing function or hook */
export const handleKeyboardDismiss = (inputRef: RefObject<any>) => {
  useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidHide', () => {
      inputRef.current?.blur();
    });
    return () => listener.remove();
  }, []);
};

/** added by @Yuvraj 01-09-2025 --> Haptic trigger */
export const hapticTrigger = (HapticFeedback: HapticFeedbackTypes) => {
  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  trigger(HapticFeedback, hapticOptions);
};

//checking the current page is login scren
export const loginScreenOpened = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
) => {
  if (navigation.getState() && navigation.getState().routes) {
    const currentRoute = navigation.getState().routes?.at(-1); // Get last route in stack
    if (currentRoute?.name == 'Login') {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
/** added by @YUvraj 10-10-2025 --> dismiss the popup when security minimize popup shows */
export const handlePopupDismiss = (shown: boolean, dimiss: () => void) => {
  if (Platform.OS == 'ios') {
    const setShowBiometricBgPopup = biometricStore(
      state => state.setShowBiometricBgPopup,
    );

    useEffect(() => {
      if (shown && !useLogoutStore.getState().isLoggingOut) {
        // closing all modal on background
        const subscription = AppState.addEventListener(
          'change',
          nextAppState => {
            dimiss();
            setShowBiometricBgPopup(true);
          },
        );

        return () => {
          subscription.remove();
        };
      }
    }, [shown]);
  }
};

// 🔒 Detect JavaScript / script injection (inline, partial, encoded)
export const containsJavaScript = (input?: string): boolean => {
  if (!input) return false;

  let text = input.toLowerCase();

  // Decode URI encoding
  try {
    text = decodeURIComponent(text);
  } catch {}

  // Decode common HTML encodings
  text = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x3c;/gi, '<')
    .replace(/&#60;/gi, '<')
    .replace(/\s+/g, ' ');

  // 🚫 script tags (partial or full)
  if (/<\s*\/?\s*scr/i.test(text)) return true;

  // 🚫 inline JS handlers (onclick, onload, etc.)
  if (/\bon\w+\s*=/i.test(text)) return true;

  // 🚫 javascript: / vbscript:
  if (/(javascript|vbscript)\s*:/i.test(text)) return true;

  // 🚫 JS execution patterns
  if (/(document\.|window\.|eval\(|settimeout\(|setinterval\()/i.test(text))
    return true;

  return false;
};

// mentionTextInput scroll to the cursor for placeholder/anything append in mentionText input
export const insertWithScroll = (
  editorRef: RefObject<RichEditor | null>,
  html: string,
) => {
  if (!editorRef.current) return;

  editorRef.current.insertHTML(html);

  editorRef.current.injectJavascript(`
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Collapse range to caret position
        range.collapse(false);

        // Marker
        const marker = document.createElement("span");
        marker.id = "__caret_marker__";
        marker.textContent = "\\u200B";
        range.insertNode(marker);

        // Scroll into view
        if (marker.scrollIntoViewIfNeeded) {
          marker.scrollIntoViewIfNeeded(true);
        } else {
          marker.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Cleanup
        setTimeout(() => {
          const remove = document.getElementById("__caret_marker__");
          if (remove) remove.remove();
        }, 50);
      }
    }, 120);
  `);
};

type triggerSentryPayload = {
  title: string;
  data: any;
};

// sentry trigger function
export const triggerSentry = async (payload: triggerSentryPayload) => {
  try {
    return Sentry.withScope(scope => {
      scope.setExtra('DataInfo', {
        DeviceModel: DeviceInfo.getModel(),
        ...payload.data,
      });
      Sentry.captureMessage(payload.title);
    });
  } catch (e) {
    Log('Error in sentry' + JSON.stringify(e));
  }
};

// linkying the links
export const linkifyHTML = (text: string) => {
  if (!text) return text;

  const parts = smartSplit(text);

  const extractEmail = (v: string) =>
    v.match(
      /^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(.*)$/, // email + trailing
    );

  const extractDomains = (text: string): string[] => {
    if (!text) return [];

    // Regex to match domains like google.com, www.test.org/path, abc.co.uk
    const domainRegex = /\b(?:[a-zA-Z0-9-]+\.)+[A-Za-z]{2,}(\/[^\s]*)?\b/g;

    const matches = text.match(domainRegex);

    return matches || [];
  };

  const isPhone = (v: string) => /^\+?\d{7,15}$/.test(v);

  const isDomain = (v: string) =>
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,}(\/[^\s]*)?$/i.test(
      v,
    );

  const isHttpUrl = (v: string) => /^https?:\/\/[^\s]+$/i.test(v);

  const converted = parts.map(token => {
    const emailMatch = extractEmail(token);

    if (emailMatch) {
      const email = emailMatch[1]; // valid email only
      const trailing = emailMatch[2]; // ANYTHING after email

      return `<a href="mailto:${email}">${email}</a>${trailing}`;
    }

    //handle the https:// and http:// links first. // Extract the main word + trailing punctuation
    const match = token.match(/^(.+?)([,:;!?]+)?$/);
    const core = match?.[1] || token; // word without punctuation
    const punct = match?.[2] || ''; // punctuation after word
    let replaced = core;

    if (isHttpUrl(core)) {
      replaced = `<a href="${core}">${core}</a>`;
      return replaced + punct;
    }

    //extract all domains
    const allDomains = extractDomains(token);
    if (allDomains.length > 0) {
      let replacedToken = token;

      allDomains.forEach(domain => {
        const domainLink = `<a href="https://${domain}">${domain}</a>`;
        replacedToken = replacedToken.replace(domain, domainLink);
      });

      return replacedToken;
    }

    if (isDomain(core)) {
      replaced = `<a href="https://${core}">${core}</a>`;
    }
    // else if (isPhone(core)) {
    //   replaced = `<a href="tel:${core}">${core}</a>`;
    // }

    return replaced + punct;
  });

  // Preserve multiple spaces by converting to &nbsp; so HTML rendering keeps them
  return converted
    .join('')
    .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));
};

export function smartSplit(input: string): string[] {
  if (!input) return [];

  const tokens: string[] = [];

  // Regex to catch:
  // - full anchor tags: <a ...>...</a>
  // - full custom <tag>...</tag> blocks
  // - any single HTML tag: <div>, </div>, <span>, etc.
  // - plain text segments between tags
  const regex =
    /(<a\b[^>]*>[\s\S]*?<\/a>)|(<tag\b[^>]*>[\s\S]*?<\/tag>)|(<\/?[^>]+>)|([^<]+)/gi;

  let match;
  while ((match = regex.exec(input)) !== null) {
    const [full, anchor, customTagBlock, htmlTag, text] = match;

    // Anchor tag → push as ONE token
    if (anchor || customTagBlock) {
      tokens.push(full);
      continue;
    }

    // Any HTML tag → push as its own token
    if (htmlTag) {
      tokens.push(htmlTag);
      continue;
    }

    // Plain text → further split by spaces and punctuation
    if (text) {
      // First, split text into HTML entities, bare ampersands, and non-entity chunks
      //    e.g. "Hi&nbsp;there &gt; test" → ["Hi", "&nbsp;", "there", " ", "&gt;", " ", "test"]
      //    e.g. "me&He" → ["me", "&", "He"]
      const entityRegex = /(&[a-zA-Z0-9#]+;)|(&)|([^&]+)/g;
      let subMatch;

      while ((subMatch = entityRegex.exec(text)) !== null) {
        const [fullChunk, entity, literalAmp, nonEntity] = subMatch;

        if (entity) {
          // HTML entity like &gt;, &nbsp; → keep as-is
          tokens.push(entity);
        } else if (literalAmp) {
          // bare '&' should be preserved
          tokens.push('&');
        } else if (nonEntity) {
          // 3️⃣ For normal text, split by spaces and punctuation
          // keep spaces so we preserve original spacing, then normalize at the end
          const splitText = nonEntity
            .split(/(\s+|[,;!])/g)
            .filter(t => t !== '');

          tokens.push(...splitText);
        }
      }
    }
  }

  return tokens;
}

// Utility to extract the last URL from the message text using regex
export const getLastUrlFromText = (text: string): string | null => {
  const unifiedRegex =
    /((https?:\/\/[^\s"<]+)|(www\.[^\s"<]+)|((?:[a-z0-9-]+\.)+(?:com|net|org|io|co|us|uk|de|gov|edu|info|biz|app|dev|in|ca|au|nz)))/gi;
  const matches = [...text.matchAll(unifiedRegex)];
  if (!matches.length) return null;
  return matches[matches.length - 1][0]; // Return the last matched URL
};

// Check if the URL is complete (i.e., ends with a valid TLD like .com, .net, etc.)
export const isUrlComplete = (url: string): boolean => {
  const urlCompleteRegex =
    /\.(com|net|org|io|co|us|uk|de|gov|edu|info|biz|app|dev|in|ca|au|nz)(\/|\?|#|$)/i;
  return urlCompleteRegex.test(url);
};

type TargetAudienceValidatorParams = {
  targetAudienceType: string;
  selectedTagList: any[];
  selectedContactList: any[];
  selectedContactTypeList: any[];
  selectedTemplate?: any;
  setError: Function;
  clearErrors: Function;
  t: Function;
};

export const validateTargetAudience = ({
  targetAudienceType,
  selectedTagList,
  selectedContactList,
  selectedContactTypeList,
  selectedTemplate,
  setError,
  clearErrors,
  t,
}: TargetAudienceValidatorParams): boolean => {
  const hasTags = selectedTagList.length > 0;
  const hasContacts = selectedContactList.length > 0;
  const hasTemplate = !!selectedTemplate;
  const hasContactTypes = selectedContactTypeList.length > 0;

  let isValid = false;

  switch (targetAudienceType) {
    case 'Tags':
      isValid = hasTags;
      break;
    case 'Contacts':
      isValid = hasContacts;
      break;
    case 'Templates':
      isValid = hasTemplate;
      break;
    case 'ContactType':
      isValid = hasContactTypes;
      break;
    default:
      isValid = hasTags || hasContacts || hasTemplate || hasContactTypes;
  }

  if (!isValid) {
    setError('selectedTarget', {
      type: 'manual',
      message: t('TargetAudienceRequired'),
    });
    return false;
  }

  clearErrors('selectedTarget');
  return true;
};

export const useLogout = () => {
  const { clearSession, clearCredentials } = useAuth0(); // Auth0 authentication

  const navigation = useAppNavigation(); // navigation

  const logout = async ({ noNavigation, hardLogout }: LogoutProps) => {
    if (
      !hardLogout &&
      biometricStore.getState().userBiometricEnabled ==
        UserBiometricOption.enabled
    ) {
      cancelAllRequests();
      //await resetAccessToken();
      await saveAccessTokenInKeychain(JSON.stringify({ loggedIn: true }));

      biometricStore.getState().setBiometricLoading(false);
      sessionService.stop();

      navigation.reset({
        index: 0,
        routes: [{ name: noNavigation ? 'Splash' : 'Login' }],
      });
      return true;
    }

    try {
      sessionService.scheduleSessionExpireNotification(true);
      useLogoutStore.getState().setIsLoggingOut(true);
      Log('isLoggingOut=> hard logout = true');
      authenticationTokenStore.getState().setIsLoggedIn(false);
      sessionService.stop();

      cancelAllRequests();

      //commented by @Shivang 29-01-26 Notification handling for multiple user logins on same device - FYN-12272

      // const accessToken = await getAccessTokenFromKeychain();
      // if (storage.getString('FcmToken') && accessToken) {
      //   await deleteByUdidApi();
      // }

      await resetAccessToken();

      await logoutAuthenticationService();
    } catch (error) {
      console.error('Logout error:', error);
      showSnackbar('Logout failed. Please try again.', 'danger');
    } finally {
      await deleteUserData(noNavigation);
      useLogoutStore.getState().setIsLoggingOut(false);
      Log('isLoggingOut=>logout complete = false');
    }
  };

  const resetUser = async () => {
    try {
      useLogoutStore.getState().setIsLoggingOut(true);
      Log('isLoggingOut=>reset user = true');
      authenticationTokenStore.getState().setIsLoggedIn(false);

      cancelAllRequests();

      //const accessToken = await getAccessTokenFromKeychain();
      // if (storage.getString('FcmToken') && accessToken) {
      //   await deleteByUdidApi();
      // }
      //shivang 29-01-26 Notification handling for multiple user logins on same device - FYN-12272

      await resetAccessToken();
    } catch (error) {
      console.error('Logout error:', error);
      showSnackbar('Logout failed. Please try again.', 'danger');
    } finally {
      await deleteUserData(true);
      useLogoutStore.getState().setIsLoggingOut(false);
      Log('isLoggingOut=>reset user finally = true');
    }
  };

  /**
   * Added by @Tarun 31-01-2025 -> deleteByUdidApi call to delete fcm token
   * from server START (FYN-4204)
   */
  const deleteByUdidApi = async () => {
    try {
      await makeRequest<null>({
        endpoint: ApiConstants.DeleteByUdid,
        method: HttpMethodApi.Delete,
        data: { udid: storage.getString('FcmToken') },
        byPassRefresh: true,
      });
    } catch (error) {
      Log('deleteByUdidApi error => ' + error);
    }
  };
  /**
   * Added by @Tarun 31-01-2025 -> deleteByUdidApi call to delete fcm token
   * from server END (FYN-4204)
   */

  /** Added by @Tarun 31-01-2025 -> logout Auth0 or okta (FYN-4204) */
  const logoutAuthenticationService = async () => {
    try {
      const loginWith = userStore.getState().userDetails?.loginWith;

      if (
        loginWith === LoginWith.auth0 ||
        loginWith === LoginWith.oktaWithAuth0
      ) {
        await clearCredentials();
        // if (Platform.OS === 'ios') {
        //   await clearCredentials();
        // } else {
        //   await clearSession();
        // }
      } else if (loginWith === LoginWith.okta) {
        await signOut();
      }
    } catch (error: any) {
      Log('Logout service error => ' + JSON.stringify(error));
      showSnackbar(error?.message || 'Logout failed', 'danger');
    }
  };

  /** Added by @Tarun 31-01-2025 -> delete user data from stores and navigate (FYN-4204) */
  const deleteUserData = async (noNavigation?: boolean): Promise<boolean> => {
    try {
      if (!noNavigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        });
      }

      [
        'inactiveTime',
        'biometricAuthenticateTime',
        'browserTokenRefresh',
        'failedMessageStorage',
        'FaceIdSettings',
        'FcmToken',
      ].forEach(key => storage.delete(key));

      userStore.getState().clearAll();
      useFailedMessageStore.getState().clearAll();

      templateStore.getState().clearAll();
      dashboardCardsStore.getState().clearAll();
      useSignalRStore.getState().logout();

      biometricStore.getState().clearAll(); // async biometric cleanup
      authenticationTokenStore.getState().clearAll(); // async auth token details clear/reset
      appStartStore.getState().clearAll();
      badgesStore.getState().clearAll();
      notificationPermissionStore.getState().clearAll();
      clearChatImagesCacheIfExpired(true);

      cancelNotification({ clearAll: true }); // clear notifications

      try {
        DdSdkReactNative.clearUserInfo();
        Sentry.setUser(null);
      } catch (e) {
        Log('error in removing user from data dog and sentry');
        return true;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  };

  return { logout, resetUser };
};
