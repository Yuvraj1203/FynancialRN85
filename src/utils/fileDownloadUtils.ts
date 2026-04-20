/**
 * Added by @Shivang 13-03-2025 -> File Download and Save Utility Functions (FYN-5333)
 */

import { storage } from '@/App';
import { saveDocuments } from '@react-native-documents/picker';
import { viewDocument } from '@react-native-documents/viewer';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import Log from './logger';
import { handleShare, isEmpty, showSnackbar } from './utils';

/**
 * Get MIME type based on the file extension
 */
export const getMimeType = (fileExtension: string): string => {
  const ext = fileExtension.toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.ppt':
      return 'application/vnd.ms-powerpoint';
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.txt':
      return 'text/plain';
    case '.csv':
      return 'text/csv';
    case '.html':
      return 'text/html';
    case '.htm':
      return 'text/html';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.avi':
      return 'video/x-msvideo';
    case '.mkv':
      return 'video/x-matroska';
    case '.zip':
      return 'application/zip';
    case '.rar':
      return 'application/vnd.rar';
    case '.7z':
      return 'application/x-7z-compressed';
    case '.json':
      return 'application/json';
    case '.xml':
      return 'application/xml';
    case '.apk':
      return 'application/vnd.android.package-archive';
    case '.epub':
      return 'application/epub+zip';
    default:
      return 'application/octet-stream'; // fallback for unknown types
  }
};

/**
 * Request Storage Permission (Android Only)
 */
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || Platform.Version >= 30) return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'This app needs access to your storage to download files.',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    Log(`❌ Permission error: ${error}`);
    return false;
  }
};

/**
 * Convert File Path to Content URI (Android Only)
 */
export const getContentUri = async (
  filePath: string,
): Promise<string | null> => {
  try {
    const statResult = await RNFetchBlob.fs.stat(filePath);
    if (statResult?.path) {
      return `file://${statResult.path}`;
    }
  } catch (error) {
    Log(`❌ Error converting file path: ${error}`);
  }
  return null;
};

/**
 * Show "Save As" Dialog
 */
const promptUserForSaveLocation = async (
  filePath: string,
  fileName: string,
  fileExtension: string,
): Promise<string | null> => {
  try {
    let sourceUri = filePath;

    if (Platform.OS === 'android') {
      const converted = await getContentUri(filePath);
      if (!converted) return null;
      sourceUri = converted;
    } else if (Platform.OS === 'ios') {
      sourceUri = filePath.startsWith('file://')
        ? filePath
        : `file://${filePath}`;
    }

    const [result] = await saveDocuments({
      sourceUris: [sourceUri],
      copy: Platform.OS === 'ios',
      mimeType: getMimeType(fileExtension),
      fileName,
    });

    if (!result?.uri) {
      return null;
    }

    Log('✅ Saved to ' + result.uri);
    return result.uri;
  } catch (error) {
    Log(`❌ promptUserForSaveLocation error: ${error}`);
    return null;
  }
};

/**
 * Generate Unique File Name
 */
export const generateUniqueFilename = (fileExtension: string) => {
  const timestamp = Date.now();
  return `File_${timestamp}.${fileExtension.replace('.', '')}`;
};

export const openFile = async (filePath: string, mimeType?: string) => {
  try {
    if (Platform.OS === 'android') {
      try {
        const rawPath = filePath.replace(/^file:\/\//, '');

        // ✅ Uses FileProvider + grants read permission; Excel apps can open it
        await RNFetchBlob.android.actionViewIntent(rawPath, mimeType ?? '*/*');
        return;
      } catch (error) {
        Log('❌ Failed to open file:' + error);
        const finalUri = filePath.startsWith('file://')
          ? filePath
          : `file://${filePath}`;
        viewDocument({ uri: finalUri });
      }
    } else {
      const finalUri = filePath.startsWith('file://')
        ? filePath
        : `file://${filePath}`;
      viewDocument({ uri: finalUri });
    }
  } catch (error) {
    Log('❌ Failed to open file:' + error);
    showSnackbar('No app found to open this file type.', 'danger');
  }
};

/**
 * Added by @Ajay 26-05-2025-> called from login to check is cached image
 * from user chat are valid or expire (FYN-7497)
 * */
export const clearChatImagesCacheIfExpired = async (forceClear = false) => {
  const now = Date.now();

  const createdAt = Number(
    storage.getNumber('chacheChatImagesCreationTime') ?? 0,
  );

  const cacheFolderPath =
    Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/chatImages`
      : `${RNFS.CachesDirectoryPath}/chatImages`;

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  if (forceClear || !createdAt || now - createdAt > sevenDaysInMs) {
    if (await RNFS.exists(cacheFolderPath)) {
      await RNFS.unlink(cacheFolderPath);
      Log('🗑️ Temp folder deleted:' + cacheFolderPath);

      storage.delete('chacheChatImagesCreationTime');
    } else {
      Log('⚠️ Temp file not found:' + cacheFolderPath);
    }
  } else {
    const remainingDays = (
      (sevenDaysInMs - (now - createdAt)) /
      (1000 * 60 * 60 * 24)
    ).toFixed(1);
    Log(
      `✅ Chat images cache is still valid. Will expire in ~${remainingDays} day(s).`,
    );
  }
};

export const checkIsFileExist = async ({
  fileName,
  onProcessComplete,
}: {
  fileName?: string;
  onProcessComplete?: (fileUri?: string) => void;
}) => {
  const cacheFolderPath =
    Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/chatImages` // iOS cache folder
      : `${RNFS.TemporaryDirectoryPath}/chatImages`; // Android cache folder

  const fileExtension = fileName?.split('.').pop() || 'jpg';
  const uniqueFilename = fileName?.replace(/\//g, '').replace(/\.[^/.]+$/, '');

  // Update the temp file path to include 'cache' folder
  let tempFilePath = `${cacheFolderPath}/${uniqueFilename}.${fileExtension}`;

  const fileExists = await RNFS.exists(tempFilePath);

  if (fileExists) {
    onProcessComplete?.(`file://${tempFilePath}`);
  } else {
    onProcessComplete?.(undefined);
  }
};

export const OpenDocumentFile = async ({
  fileUrl,
  fileExtension,
  fileName,
  isBase64File,
  onDownloadComplete,
}: {
  fileUrl: string;
  fileExtension: string;
  fileName?: string;
  isBase64File?: boolean;
  onDownloadComplete?: (fileUri?: string, mimeType?: string) => void;
}) => {
  downloadLocalFile({
    fileUrl,
    fileExtension,
    fileName,
    isBase64File,
    onDownloadComplete: async (fileUri, fileName, mimeType) => {
      onDownloadComplete?.(fileUri, mimeType);
      if (fileUri) {
        await openFile(fileUri, mimeType);
      }
    },
  });
};

export const DownloadDocumentFile = async ({
  fileUrl,
  fileExtension,
  fileName,
  isBase64File,
  onDownloadComplete,
}: {
  fileUrl: string;
  fileExtension: string;
  fileName?: string;
  isBase64File?: boolean;
  onDownloadComplete?: (fileUri?: string, mimeType?: string) => void;
}) => {
  downloadLocalFile({
    fileUrl,
    fileExtension,
    fileName,
    isBase64File,
    onDownloadComplete: async (fileUri, fileName, mimeType) => {
      if (fileUri && fileName) {
        const uri = await promptUserForSaveLocation(
          fileUri,
          fileName,
          fileExtension,
        );
        if (uri == null) {
          // Error occured in prompting user for save location
          onDownloadComplete?.();
          return;
        } else {
          showSnackbar('Saved Successfully', 'success');
          onDownloadComplete?.(uri, mimeType);

          await openFile(uri, mimeType);
        }
      }
    },
  });
};

export const ShareDocumentFile = async ({
  fileUrl,
  fileExtension,
  fileName,
  onDownloadComplete,
}: {
  fileUrl: string;
  fileExtension: string;
  fileName?: string;
  onDownloadComplete?: (fileUri?: string, mimeType?: string) => void;
}) => {
  downloadLocalFile({
    fileUrl,
    fileExtension,
    fileName,
    onDownloadComplete: async (fileUri, fileName, mimeType) => {
      onDownloadComplete?.(fileUri, mimeType);

      if (fileUri) {
        const finalUri = fileUri?.startsWith('file://')
          ? fileUri
          : `file://${fileUri}`;
        handleShare({ fileUri: finalUri, mimeType: mimeType });
      }
    },
  });
};

const downloadLocalFile = async ({
  fileUrl,
  fileExtension,
  fileName,
  isBase64File,
  onDownloadComplete,
}: {
  fileUrl: string;
  fileExtension: string;
  fileName?: string;
  isBase64File?: boolean;
  onDownloadComplete?: (
    fileUri?: string,
    fileName?: string,
    mimeType?: string,
  ) => void;
}) => {
  const Filename = sanitizeFilename(fileName??'')  
  const uniqueFilename = !isEmpty(Filename)
    ? decodeURIComponent(Filename)
    : generateUniqueFilename(fileExtension);
 
 
    Log('⬇️ Unique filename generated: ' + uniqueFilename);

  if (Platform.OS === 'android' && !(await requestStoragePermission())) {
    Alert.alert('Permission Denied', 'Storage permission is required.');
    return;
  }

  let tempFilePath =
    Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/${uniqueFilename}${fileExtension}`
      : `${RNFS.TemporaryDirectoryPath}/${uniqueFilename}${fileExtension}`;

  try {
    const fileExists = await RNFS.exists(tempFilePath);

    if (fileExists) {
      onDownloadComplete?.(
        tempFilePath,
        uniqueFilename,
        getMimeType(fileExtension),
      );
      return;
    }

    if (isBase64File) {
      await RNFS.writeFile(tempFilePath, fileUrl, 'base64');
    } else {
      const result = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: tempFilePath,
        progress(res) {
          if (!res.contentLength || res.contentLength === 0) return 0;
        },
      }).promise;

      if (result.statusCode !== 200) {
        Log('❌ Download failed: ' + JSON.stringify(result));

        onDownloadComplete?.();
        return;
      }
    }

    onDownloadComplete?.(
      tempFilePath,
      uniqueFilename,
      getMimeType(fileExtension),
    );

    Log('✅ Download complete: ' + tempFilePath);
  } catch (error) {
    Log(`❌ Error processing file: ${error}`);
    onDownloadComplete?.();
  }
};

export const DownloadChatFile = async ({
  fileUrl,
  fileExtension,
  fileName,
  onDownloadComplete,
}: {
  fileUrl: string;
  fileExtension: string;
  fileName?: string;
  onDownloadComplete?: (
    fileUri?: string,
    fileName?: string,
    mimeType?: string,
  ) => void;
}) => {
  try {
    const uniqueFilename = fileName ?? generateUniqueFilename(fileExtension);

    // Use a cache directory for chat images
    const cacheFolderPath =
      Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/chatImages`
        : `${RNFS.CachesDirectoryPath}/chatImages`;

    // Ensure folder exists
    const folderExists = await RNFS.exists(cacheFolderPath);
    if (!folderExists) {
      await RNFS.mkdir(cacheFolderPath);
      storage.set('cacheChatImagesCreationTime', Date.now());
    }

    const tempFilePath = `${cacheFolderPath}/${uniqueFilename}.${fileExtension}`;
    const fileUri = `file://${tempFilePath}`;

    // If file already exists, return it
    if (await RNFS.exists(tempFilePath)) {
      Log(`📂 File already cached: ${fileUri}`);
      onDownloadComplete?.(fileUri, uniqueFilename, getMimeType(fileExtension));
      return;
    }

    // Download file
    const result = await RNFS.downloadFile({
      fromUrl: fileUrl,
      toFile: tempFilePath,
    }).promise;

    if (result.statusCode !== 200) {
      Log(`❌ Download failed [${result.statusCode}]: ${fileUrl}`);
      onDownloadComplete?.();
      return;
    }

    Log(`✅ Download complete: ${fileUri}`);
    onDownloadComplete?.(fileUri, uniqueFilename, getMimeType(fileExtension));
  } catch (error) {
    Log(`❌ DownloadChatFile error: ${JSON.stringify(error)}`);
    onDownloadComplete?.();
  }
};

/** Added by @Akshita : -( Fyn-13058)  Removes URL-breaking characters from a filename (does NOT replace them) **/
// Example: 'Akshi test pdf?"' -> 'Akshi test pdf'
export const sanitizeFilename = (input: string, options?: { keepExtension?: boolean; maxLength?: number }) => {
  const keepExtension = options?.keepExtension ?? true;
  const maxLength = options?.maxLength ?? 200;
Log('🔍 Sanitizing filename: ' + input);
  // Normalize to avoid weird Unicode variants (optional but good)
  const normalized = input.normalize("NFKC");
 
  // Split extension (so we don't accidentally remove it / or create weird ".pdf" issues)
  let base = normalized;
  let ext = "";
 
  if (keepExtension) {
    const lastDot = normalized.lastIndexOf(".");
    // lastDot > 0 avoids treating ".env" as having an extension
    if (lastDot > 0 && lastDot < normalized.length - 1) {
      base = normalized.slice(0, lastDot);
      ext = normalized.slice(lastDot); // includes dot
    }
  }
 
  /**
   * RFC3986 reserved chars:
   * General delimiters: : / ? # [ ] @
   * Sub delimiters: ! $ & ' ( ) * + , ; =
   *
   * Plus extra common breakers in practice:
   * % (starts percent-encoding), \ (backslash), quotes, angle brackets, braces, pipe, caret, backtick
   * And control chars (0x00-0x1F, 0x7F)
   */
  const UNSAFE_RE =
    /[\u0000-\u001F\u007F]|[:\/?#\[\]@!$&'()*+,;=]|[%\\<>\"{}|^`]/g;
 
  base = base.replace(UNSAFE_RE, "");
 
  // Collapse whitespace and trim
  base = base.replace(/\s+/g, " ").trim();
 
  // Avoid trailing dots/spaces (can behave oddly across systems/tools)
  base = base.replace(/[. ]+$/g, "").trim();
 
  // Ensure not empty
  if (!base) base = "file";
 
  // Limit length
  if (base.length > maxLength) base = base.slice(0, maxLength).trim();
 
  // Sanitize extension too (rare edge case)
  if (ext) {
    ext = ext.replace(/[^.\w]/g, ""); // keep dot + letters/numbers/underscore
    // If ext became just "." or invalid, drop it
    if (ext === "." || ext.length < 2) ext = "";
  }
Log('✅ Sanitized filename success : ' + base + ext);
  return `${base}${ext}`;
}
