import {
  CustomButton,
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomHeader,
  CustomImagePicker,
  EmptyView,
} from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { openFile } from '@/utils/fileDownloadUtils';
import Log from '@/utils/logger';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { Asset, isEmpty, showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export type UploadSecureFilesProps = {
  folderID?: string;
};

function UploadSecureFiles() {
  const navigation = useAppNavigation();

  const route = useAppRoute('UploadSecureFiles');

  const theme = useTheme();

  const styles = makeStyles(theme);

  const { t } = useTranslation();

  /**  Added by @Yuvraj 19-03-2025 -> Retrieve user details from store (FYN-5821)*/
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Akshita 10-09-25 --->  Controls visibility of the image picker popup (FYN-4314)*/
  const [showFileSelectionPopup, setShowFileSelectionPopup] = useState(false);

  /** Added by @Akshita 10-09-25 --->  Controls visibility of the image picker popup (FYN-4314)*/
  const [uploadFileLoading, setUploadFileLoading] = useState(false);

  /** Added by @Akshita 10-09-25 --->  Controls visibility of the image picker popup (FYN-4314)*/
  const [errorMsg, setErrorMsg] = useState<string>();

  /** Added by @Akshita 10-09-25 --->  Controls visibility of the image picker popup (FYN-4314)*/
  const [selectedFileList, setSelectedFileList] = useState<Asset[]>([]);

  const [selectedFileListitem, setselectedFileListitem] = useState<Asset>();

  const [showImageSendPopup, setShowImageSendPopup] = useState(false);

  // Track file progress
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});

  const [selectedUserDocItem, setSelectedUserDocItem] = useState<Asset>();

  const { sendDataBack } = useReturnDataContext();

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    Log('file type in get file icon function : ' + ext);
    switch (ext) {
      case 'docx':
      case 'doc':
        return Images.doc;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return Images.image;
      case 'pdf':
        return Images.pdf;
      case 'xlsx':
      case 'xls':
        return Images.excel;
      default:
        return Images.defaultFile; // Ensures a fallback in case of unexpected input
    }
  };

  const bytesToMB = (bytes: number, decimals = 2): number | undefined => {
    if (bytes === 0) return 0;
    const mb = bytes / (1024 * 1024);
    return parseFloat(mb.toFixed(decimals));
  };

  // Allowed file extensions
  const allowedTypes = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'jpg',
    'jpeg',
    'png',
  ];

  const validateFiles = (files: Asset[]) => {
    let validFiles: Asset[] = [];
    for (let f of files) {
      const ext = f.fileName?.split('.').pop()?.toLowerCase() || '';
      const sizeMB = f.fileSize ? bytesToMB(f.fileSize) ?? 0 : 0;

      if (!allowedTypes.includes(ext)) {
        if (f.type?.includes('video')) {
          showSnackbar('Video files are not supported', 'danger');
        } else {
          showSnackbar('Invalid file type selected', 'danger');
        }
        continue;
      }
      if (sizeMB > 25) {
        showSnackbar(`${f.fileName} exceeds 25 MB`, 'danger');
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length + selectedFileList.length > 10) {
      showSnackbar('Maximum 10 files allowed', 'danger');
      return [];
    }

    return validFiles;
  };
  /** Added by @Yuvraj 19-03-2025 -> on selecting new picture from local device (FYN-5821) */
  const handleMediaList = (newFiles: Asset[]) => {
    const validated = validateFiles(newFiles);
    if (validated.length > 0) {
      const updatedList = [...selectedFileList, ...validated];
      setSelectedFileList(updatedList);
      Log('selected files by user : ' + JSON.stringify(updatedList));
    }
  };

  const handleDeleteFile = (fileName: string) => {
    setSelectedFileList(prev => prev.filter(f => f.fileName !== fileName));
  };

  const handleUploadFile = () => {
    const formData = new FormData();

    if (selectedFileList.length > 0) {
      selectedFileList.forEach(file => {
        formData.append('files', {
          uri: file.uri,
          name: file.fileName ?? `file_${Date.now()}`,
          type: file.type,
        });
      });
    }
    // append the extra fields as strings
    formData.append('userid', String(userDetails?.userID ?? 0));
    formData.append(
      'SecureFolderId',
      !isEmpty(route.params?.folderID) ? route.params?.folderID : '',
    );
    formData.append('PermittedToContact', 'true');

    uploadSecureFileApi.mutate(formData);
  };

  const handleItemClick = (itemData: Asset) => {
    openFile(itemData.uri!, itemData.type);
  };

  const uploadSecureFileApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<string>({
        endpoint: ApiConstants.UploadSecureFile,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      setUploadFileLoading(true);
    },
    onSettled(data, error, variables, context) {
      setUploadFileLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        showSnackbar(t('FileUploadSuccessMsg'), 'success');
        sendDataBack('ContactVault', { isNewFileAdded: true });
        if (navigation.canGoBack()) {
          navigation.goBack(); // navigate back
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setUploadFileLoading(false);
    },
  });

  /** Function to render each team member */
  const renderSeletedFiles = (item: Asset) => {
    const ext = item.fileName?.split('.').pop()?.toLowerCase();
    const icon = getFileIcon(item.fileName!);
    return (
      <Shadow onPress={() => handleItemClick(item)} style={styles.card}>
        <View style={styles.cardContent}>
          <Tap
            style={styles.closeTap}
            onPress={() => handleDeleteFile(item.fileName!)}
          >
            <CustomImage
              color={theme.colors.onSurfaceVariant}
              style={styles.closeIcon}
              source={Images.close}
              type={ImageType.svg}
            />
          </Tap>

          <CustomImage
            color={theme.colors.onSurfaceVariant}
            style={styles.fileIcon}
            source={icon}
            type={ImageType.svg}
          ></CustomImage>
          <CustomText
            style={styles.fileName}
            variant={TextVariants.bodySmall}
            maxLines={1}
            ellipsis={TextEllipsis.tail}
          >
            {decodeURIComponent(item.fileName!)}
          </CustomText>
        </View>
      </Shadow>
    );
  };

  return (
    <SafeScreen>
      <CustomHeader
        showBack
        title={t('UploadFiles')}
        actionButton={
          <Tap
            onPress={() => {
              setShowFileSelectionPopup(true);
            }}
            style={styles.addGroupHeaderBtn}
          >
            <CustomText variant={TextVariants.bodyLarge}>
              {t('AddFiles')}
            </CustomText>
          </Tap>
        }
      />

      <View style={styles.main}>
        <View style={{ flex: 1 }}>
          {selectedFileList.length === 0 ? (
            <EmptyView label={t('SelectFilesToUpload')} />
          ) : (
            <CustomFlatList
              data={selectedFileList}
              numColumns={DeviceInfo.isTablet() ? 4 : 2}
              extraData={[selectedFileList]}
              keyExtractor={(item, index) =>
                `${item.id}-${item.fileName}-${index.toString()}`
              }
              renderItem={({ item }) => renderSeletedFiles(item)}
            />
          )}
        </View>
        <CustomText>{errorMsg}</CustomText>
        {selectedFileList?.length > 0 && (
          <CustomButton
            style={styles.uploadButton}
            loading={uploadFileLoading}
            onPress={() => {
              if (selectedFileList?.length == 0) {
                setErrorMsg(t('PleaseSelectFilesToUpload'));
              } else {
                handleUploadFile();
              }
            }}
          >
            {t('Upload')}
          </CustomButton>
        )}
      </View>

      <CustomImagePicker
        showPopup={showFileSelectionPopup}
        setShowPopup={setShowFileSelectionPopup}
        mediaList={(files: Asset[]) => handleMediaList(files)}
        crop={true}
        showAllFile
      />
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    noImgLay: {
      alignItems: 'center',
    },
    noImgMsg: {
      textAlign: 'center',
      marginTop: 10,
    },

    icon: {
      height: 20,
      width: 20,
      marginTop: 5,
    },
    noImgLayContainer: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness,
      padding: 10,
      marginTop: 10,
      height: 200,
      justifyContent: 'center',
    },
    uploadButton: {
      marginBottom: 15,
      marginTop: 20,
      marginHorizontal: 10,
    },
    card: {
      flex: 1,
      // margin: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.teamCard,
      margin: 8,
      width: 160,
      alignSelf: 'center',
    },
    cardContent: {
      alignItems: 'center',
    },
    fileIcon: {
      height: 60,
      width: 80,
    },
    closeIcon: {
      height: 15,
      width: 15,
    },
    closeTap: {
      alignSelf: 'flex-end',
    },
    fileName: {
      marginTop: 10,
    },
    addGroupHeaderBtn: {
      height: 30,
      minWidth: 110, //by Yuvraj for new group  ui issue ios
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5,
      borderWidth: 0.8,
      borderColor: theme.colors.outline,
      marginRight: 20,
      borderRadius: theme.roundness,
      padding: 0,
      paddingHorizontal: 15, //by Yuvraj for new group  ui issue ios
    },
  });

export default UploadSecureFiles;
