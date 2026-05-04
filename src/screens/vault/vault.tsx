import {
  CustomFlatList,
  CustomText,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import CustomImage, {
  ImageType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  EmptyView,
} from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetTamaracFiles3URLModel,
  GetVaultFileModel,
  GetVaultFilesAndFoldersModel,
  GetVaultItemsListModel,
  VaultItemList,
} from '@/services/models';
import { tenantDetailStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import {
  isEmpty,
  showSnackbar,
  useBackPressHandler,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';

import { TamaracVaultItem } from '@/services/models/getVaultFilesAndFoldersModel/getVaultFilesAndFoldersModel';
import { VaultTamaracItemList } from '@/services/models/getVaultItemsListModel/getVaultItemsListModel';
import {
  DownloadDocumentFile,
  OpenDocumentFile,
} from '@/utils/fileDownloadUtils';

/**
 *  Added by @Akshita 05-02-25 --->  Enum to identify from which card user
 * to coming on the vault screen (FYN-4314)*/
export enum VaultScreenParent {
  fromEMoney = 'fromEMoney',
  fromTamarac = 'fromTamarac',
}

export type VaultProps = {
  folderPath?: string;
  folderID?: number;
  cardType?: VaultScreenParent;
};

export type VaultReturnProps = {
  isUpdatedFolderPath?: boolean;
};

function Vault() {
  /** Added by @Akshita 05-02-25 --->Hook to handle navigation within the app (FYN-4314)*/
  const navigation = useAppNavigation();

  /** Added by @Akshita 05-02-25 ---> Hook to handle screen params route (FYN-4314)*/
  const route = useAppRoute('Vault');

  /** Added by @Akshita 05-02-25 ---> theme for consistent UI styling throughout the component (FYN-4314)*/
  const theme = useTheme();

  /** Added by @Akshita 05-02-25 --->  Dynamically creating styles based on the current theme(FYN-4314)*/
  const styles = makeStyles(theme);

  /** Added by @Akshita 05-02-25 ---> Translation hook for handling multilingual support  (FYN-4314)*/
  const { t } = useTranslation();

  /** Added by @Akshita 05-02-25 --->  Fetching user details from the global store(FYN-4314)*/
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Akshita 05-02-2025 -> tenant details store  */
  const tenantDetail = tenantDetailStore();

  /** Added by @Akshita 05-02-25 ---> Tracks the current page of chat data for pagination. (FYN-4314)*/
  const [pageNumber, setPageNumber] = useState(1);

  /** Added by @Akshita 05-02-25 ---> Controls loading status for refreshing data. (FYN-4314)*/
  const [loading, setLoading] = useState(false);

  /** Added by @Akshita 05-02-25 ---> list to store vault items. (FYN-4314)*/
  const [eMoneyVaultItemList, setEMoneyVaultItemList] = useState<
    VaultItemList[]
  >([]);

  /** Added by @Akshita 05-02-25 ---> list to store vault items. (FYN-4314)*/
  const [tamaracVaultItemList, setTamaracVaultItemList] = useState<
    TamaracVaultItem[]
  >([]);

  /** Added by @Akshita 05-02-25 ---> stores the data for file item (FYN-4314)*/
  const [eMoneyVaultFileData, setEMoneyVaultFileData] =
    useState<GetVaultFileModel>();

  /** Added by @Akshita 05-02-25 ---> stores the data for file item (FYN-4314)*/
  const [tamVaultFileData, setTamVaultFileData] =
    useState<GetTamaracFiles3URLModel>();

  /** Added by @Akshita 25-03-25 ---> state to display error message on the screen (FYN-4314) */
  const [errorMessage, setErrorMessage] = useState<string>();

  /** Added by @Akshita 25-03-25 ---> state to display error message on the screen (FYN-4314) */
  const [folderPath, setFolderPath] = useState<string>(
    route.params?.folderPath ? route.params.folderPath : '',
  );

  const [folderIdHistory, setFolderIdHistory] = useState<number[]>([]);

  const [currentFolderId, setCurrentFolderId] = useState<number>(
    route.params?.folderID!,
  );

  /** Added by @Akshita 25-03-25 ---> state to display error message on the screen (FYN-4314) */
  const [pageTitle, setPageTitle] = useState<string>('');

  /**
   * Added by @Akshita 05-02-25 ---> Prevents multiple API calls simultaneously to
   * handle the pagination  (FYN-4314)*/
  const [apiLoading, setApiLoading] = useState(false);

  /**
   * Added by @Akshita 05-02-25 ---> Prevents multiple API calls simultaneously to
   * handle the pagination  (FYN-4314)*/
  const [isDownLoading, setIsDownloading] = useState(false);

  /** Added by @Akshita 05-02-25 ---> Tracks if more data is available for infinite scroll (FYN-4314)*/
  const [moreFeedsAvailable, setMoreFeedsAvailable] = useState(true);

  /** Added by @Akshita 05-02-25 --->   Controls visibility of the admin action sheet popup (FYN-4314)*/
  const [showActionSheetPopUp, setShowActionSheetPopUp] = useState(false);

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const isFromEMoney =
    route.params?.cardType == VaultScreenParent.fromEMoney ? true : false;

  const isFromTamarac =
    route.params?.cardType == VaultScreenParent.fromTamarac ? true : false;

  useEffect(() => {
    if (userDetails) {
      Log('1] isFromTamarac value use effect----------------' + isFromTamarac);
      Log('2 ]folderIdData value use effect----------------' + currentFolderId);

      callGetVaultItemsListApi(
        1,
        folderPath,
        isFromTamarac ? currentFolderId : 0,
      );
      setPageTitle(getLastFolderName(folderPath));
    }
  }, []);

  useEffect(() => {
    // Whenever folderPath changes, update the page title
    if (folderPath != route.params?.folderPath) {
      getPreviousFolderPath(folderPath);
    }
    // if(currentFolderId != route.params?.folderID){

    // }
  }, [folderPath]);

  const handleOnClick = (item: VaultTamaracItemList, longPress?: boolean) => {
    Log('on press of item in the list : ' + JSON.stringify(item));
    if (item.type === 'folder') {
      Log('inside the folder click ');

      handleFolderClick(item.name, item.folderId);
    } else {
      if (isFromEMoney) {
        setSelectedEmoneyVaultItem(item);
        getVaultFileApi.mutate({
          CallPoint: 'app',
          fileId: item.id,
          fileType: item.fileType,
          longPress: longPress,
        });
      } else if (isFromTamarac) {
        setSelectedTamVaultItem(item);
        getTamaracFiles3URLApi.mutate({
          CallPoint: 'app',
          fileId: item.fileId,
          fileType: item.fileType,
          longPress: longPress,
        });
      }
    }
  };

  const getLastFolderName = (path: string): string => {
    // Normalize slashes and split the path
    const parts = path.split(/[/\\]+/);
    return parts[parts.length - 1]; // Return the last part
  };

  const getPreviousFolderPath = (path: string): string => {
    Log('3]  current path: ' + path);

    // 1. split into segments and drop the last folder
    const parts = path.split(/[/\\]+/);
    parts.pop(); // removes 'group'

    // 2. reconstruct the path (or empty string if nothing left)
    const previousPath = parts.length > 0 ? parts.join('\\') : '';

    Log('4] previous path: ' + previousPath);

    // 3. set your folderPath
    setFolderPath(previousPath);

    // 4. derive pageTitle from the new “last” segment (or empty)
    const pageTitleValue =
      parts.length > 0
        ? parts[parts.length - 1] // 'admin'
        : '';
    Log('5] pageTitleValue: ' + pageTitleValue);

    setPageTitle(pageTitleValue);

    return previousPath;
  };

  const restorePreviousFolderId = () => {
    setFolderIdHistory(prev => {
      const updatedHistory = [...prev];
      updatedHistory.pop(); // remove last one
      if (updatedHistory.length > 0) {
        const secondLastFolderId = updatedHistory[updatedHistory.length - 1];
        Log('7] secondLastFolderId-----------> ' + secondLastFolderId);

        setCurrentFolderId(secondLastFolderId);
      }

      return updatedHistory; // Always return the modified history
    });
  };

  /**  Added by @Akshita 26-12-24 ---> handle hardware back press(FYN-4314)*/
  useBackPressHandler(() => updateFolderPath());

  const updateFolderPath = () => {
    // Log('1 ] callinggggggggggggggggggggg updateFolderPath');
    getPreviousFolderPath(folderPath);
    if (isFromTamarac) {
      Log('6 ] callinggggggggggggggggggggg restorePreviousFolderId');

      restorePreviousFolderId();
    }
    return true;
  };

  const handleFolderClick = (item?: string, folderIdValue?: number) => {
    // Reset to first page
    // Construct new folder path
    Log(
      'inside the handleFolderClick function =========>   ' +
        JSON.stringify(item),
    );

    const newFolderPath = item
      ? !isEmpty(folderPath)
        ? `${folderPath}\\${item}`
        : item
      : '';

    setFolderIdHistory(prev => [...prev, folderIdValue!]);

    Log('folder path is: ' + newFolderPath);
    Log('folder Id is: ' + folderIdValue);
    setFolderPath(newFolderPath);
    setCurrentFolderId(folderIdValue!);
    if (isFromEMoney) {
      navigation.push('Vault', {
        folderPath: newFolderPath,
        cardType: route.params?.cardType,
      });
    } else if (isFromTamarac) {
      navigation.push('Vault', {
        folderPath: newFolderPath,
        folderID: folderIdValue!,
        cardType: route.params?.cardType,
      });
    }
  };

  const callGetVaultItemsListApi = (
    pageNo: number,
    folderPath: string,
    folderIdValue?: number,
  ) => {
    /**  Added by @akshita 29-11-24 --->Update current page state */
    setPageNumber(pageNo);
    if (isFromEMoney) {
      getEMoneyVaultItemsListApi.mutate({
        CallPoint: 'app',
        PageNo: pageNo,
        path: folderPath,
      });
    } else if (isFromTamarac) {
      getTamaracVaultFilesAndFoldersApi.mutate({
        CallPoint: 'app',
        PageNo: pageNo,
        folderId: folderIdValue,
        pageSize: 10,
      });
    }
  };

  const getFileIcon = (fileType: string, type: string) => {
    if (type === 'folder') {
      return Images.defaultFolder;
    }

    const knownFileTypes = new Set([
      '.docx',
      '.doc',
      '.pptx',
      '.ppt',
      '.png',
      '.jpg',
      '.jpeg',
      '.pdf',
      '.txt',
      '.xlsx',
      '.xls',
    ]);

    if (type === 'file' && !knownFileTypes.has(fileType.toLowerCase())) {
      return Images.defaultFile;
    }

    switch (fileType.toLowerCase()) {
      case '.docx':
      case '.doc':
        return Images.doc;
      case '.pptx':
      case '.ppt':
        return Images.ppt;
      case '.png':
      case '.jpg':
      case '.jpeg':
        return Images.image;
      case '.pdf':
        return Images.pdf;
      case '.txt':
        return Images.text;
      case '.xlsx':
      case '.xls':
        return Images.excel;
      default:
        return Images.defaultFile; // Ensures a fallback in case of unexpected input
    }
  };

  // const handleItemClick = (
  //   url?: string,
  //   fileType?: string,
  //   fileName?: string,
  // ) => {
  //   //content type=L for link,E=embedded code, I=image, D=document(mp3,.doc,.docx,xls,xlsx,pdf),V=video(mp4)
  //   Log('fileType=========' + fileType);
  //   Log('fileurl=========' + url);
  //   if (fileType == '.jpg' || fileType == '.jpeg' || fileType == '.png') {
  //     Log('1 =========');
  //     if (url) {
  //       showImagePopup({imageList: [url]});
  //     }
  //   } else if (fileType == '.mp4' || fileType == '.mp3') {
  //     Log('2 =========');
  //     openInAppBrowser(url);
  //   } else if (fileType == '.pdf') {
  //     Log('3 =========');
  //     // Use the utility function to download and open the file
  //     // downloadAndOpenFile(itemData.contentURL!, itemData.contentExtension!);
  //     const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
  //       url!,
  //     )}`;
  //     openInAppBrowser(googleDocsUrl);
  //     //openPdfInBrowser(itemData.contentURL!);
  //   } else if (fileType == '.doc' || fileType == '.docx') {
  //     Log('4 =========');
  //     const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
  //       url!,
  //     )}`;
  //     openInAppBrowser(googleDocsUrl);
  //   } else if (fileType == '.xls' || fileType == '.xlsx') {
  //     Log('I am in FileType xlsx =========' + fileType);
  //     const googleDocsUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
  //       url!,
  //     )}`;
  //     openInAppBrowser(googleDocsUrl);
  //   }
  // };

  const handleSelectedActionItem = ({
    ActionParam,
    url,
    fileType,
    fileNameValue,
    id,
  }: {
    ActionParam: string;
    url?: string;
    fileType?: string;
    fileNameValue?: string;
    id?: string;
  }) => {
    /**
     * Added by @Shivang 13-03-2025 -> Handle "Download" Action (FYN-5333)
     * When the user selects "Download", it:
     * - Shows the loader
     * - Downloads the file
     * - Hides the loader after the download completes
     */

    const finish = (fileUri?: string) => {
      setIsDownloading(false);
      if (isFromEMoney) {
        setEMoneyVaultItemList(prev =>
          prev?.map(item => {
            if (selectedEMoneyVaultItem && id == selectedEMoneyVaultItem?.id) {
              return { ...item, progress: undefined, fileLoader: false };
            } else {
              return item;
            }
          }),
        );
      } else if (isFromTamarac) {
        setTamaracVaultItemList(prev =>
          prev?.map(item => {
            if (selectedTamVaultItem && id == selectedTamVaultItem?.fileId) {
              return { ...item, progress: undefined, fileLoader: false };
            } else {
              return item;
            }
          }),
        );
      }

      if (!fileUri) {
        showSnackbar(t('SomeErrorOccured'), 'danger');
      }
    };

    if (ActionParam === 'Download') {
      setIsDownloading(true);
      setShowActionSheetPopUp(false);

      DownloadDocumentFile({
        fileUrl: url!,
        fileExtension: fileType!,
        fileName: fileNameValue!,
        isBase64File: isFromEMoney ? true : false,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });

      /**
       * Added by @Shivang 13-03-2025 -> Handle "Open" Action (FYN-5333)
       * Opens the selected PDF file using Google Docs Viewer in the in-app browser.
       */
    } else if (ActionParam == 'Open') {
      setIsDownloading(true);
      setShowActionSheetPopUp(false);

      OpenDocumentFile({
        fileUrl: url!,
        fileExtension: fileType!,
        fileName: fileNameValue!,
        isBase64File: isFromEMoney ? true : false,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam == 'Cancel') {
      setShowActionSheetPopUp(false);
    }
  };
  const [selectedTamVaultItem, setSelectedTamVaultItem] =
    useState<TamaracVaultItem>();

  const [selectedEMoneyVaultItem, setSelectedEmoneyVaultItem] =
    useState<VaultTamaracItemList>();

  const getEMoneyVaultItemsListApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetVaultItemsListModel>({
        endpoint: ApiConstants.GetVaultItemsList,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setApiLoading(true);
      if (!loading) {
        if (variables.PageNo === 1) {
          /**Added by @akshita 15-11-24---> Show skeleton loader for the first page (#15657)*/
          setLoading(true);
        }
      }
    },
    onSettled(data, error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Reset API loading state (#15657)*/

      if (variables.PageNo === 1) {
        setLoading(false); //Added by @akshita 15-11-24---> Hide skeleton loader for the first page (#15657)
      }
    },
    onSuccess(data, variables, context) {
      /** Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/

      if (data.result) {
        if (
          data.result?.itemList?.length == 0 &&
          !isEmpty(data.result.message)
        ) {
          setMoreFeedsAvailable(false);
          setEMoneyVaultItemList([]);
          setErrorMessage(data.result.message);
        } else if (data.result.itemList && data.result.itemList?.length > 0) {
          setMoreFeedsAvailable(true);
          setErrorMessage(t(''));

          /** Added by @akshita 05-02-25 ---> Replace vault item list on first page (#15657)*/
          const newData: VaultItemList[] = data.result?.itemList?.map(
            element => ({
              //@Akshita 05-02-25 --->Store loader details in the existing list
              // to display activity indicator conditionally (FYN-4314)
              ...element,
              fileLoader: false,
            }),
          );
          if (variables.PageNo === 1) {
            setEMoneyVaultItemList(newData);
          } else {
            /** Added by @akshita 05-02-25 --->Append new chats to the existing list (#15657)*/
            setEMoneyVaultItemList([...eMoneyVaultItemList, ...newData!]);
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/
      showSnackbar(error.message, 'danger');
      setMoreFeedsAvailable(
        false,
      ); /** Added by @akshita 05-02-25 ---> Mark no more feeds available (#15657)*/
      if (variables.PageNo === 1) {
        /** Added by @akshita 05-02-25 --->Clear chat list if error occurs on the first page (#15657)*/
        setEMoneyVaultItemList([]);
      }
    },
  });

  const getVaultFileApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetVaultFileModel>({
        endpoint: ApiConstants.GetVaultFile,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      // Set fileLoader: true for the item being downloaded
      setEMoneyVaultItemList(prevList =>
        prevList.map(item =>
          item.id === variables.fileId // assuming `id` uniquely identifies the file
            ? { ...item, fileLoader: true }
            : item,
        ),
      );
    },
    onSettled(data, error, variables, context) {},
    onSuccess(data, variables, context) {
      /** Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/
      if (data.result) {
        setEMoneyVaultFileData({
          ...data.result,
          fileType: variables.fileType,
        });
        //convertBase64ToFile(data.result.fileBytes!, data.result.fileName!);
        setEMoneyVaultItemList(prevList =>
          prevList.map(item =>
            item.id === variables.fileId // assuming `id` uniquely identifies the file
              ? { ...item, fileLoader: false }
              : item,
          ),
        );
        if (variables.longPress) {
          setShowActionSheetPopUp(true);
        } else {
          setShowActionSheetPopUp(true);

          // downloadAndOpenFile({
          //   fileUrl: data.result.fileBytes!,
          //   fileExtension: variables.fileType,
          //   onDownloadComplete() {
          //     setIsDownloading(false);
          //     if (isFromEMoney) {
          //       setEMoneyVaultItemList(prev =>
          //         prev?.map(item => {
          //           if (
          //             selectedEMoneyVaultItem &&
          //             item.id == selectedEMoneyVaultItem?.id
          //           ) {
          //             return {...item, progress: undefined};
          //           } else {
          //             return item;
          //           }
          //         }),
          //       );
          //     }
          //   },

          //   isBase64File: true,
          // });
        }

        // handleItemClick(variables.fileType, data.result.fileBytes!);
      }
    },
    onError(error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/

      setEMoneyVaultItemList(prevList =>
        prevList.map(item =>
          item.id === variables.fileId // assuming `id` uniquely identifies the file
            ? { ...item, fileLoader: false }
            : item,
        ),
      );
      showSnackbar(error.message, 'danger');
    },
  });

  const getTamaracVaultFilesAndFoldersApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetVaultFilesAndFoldersModel>({
        endpoint: ApiConstants.GetVaultFilesAndFolders,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setApiLoading(true);
      if (!loading) {
        if (variables.PageNo === 1) {
          /**Added by @akshita 15-11-24---> Show skeleton loader for the first page (#15657)*/
          setLoading(true);
        }
      }
    },
    onSettled(data, error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Reset API loading state (#15657)*/

      if (variables.PageNo === 1) {
        setLoading(false); //Added by @akshita 15-11-24---> Hide skeleton loader for the first page (#15657)
      }
    },
    onSuccess(data, variables, context) {
      /** Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/

      if (data.result) {
        if (
          data.result?.fileList?.length == 0 &&
          data.result?.folderList?.length == 0
          // &&
          // !isEmpty(data.result.message)
        ) {
          setMoreFeedsAvailable(false);
          setTamaracVaultItemList([]);
          setErrorMessage(data.result.message);
        } else if (
          (data.result.folderList && data.result.folderList?.length > 0) ||
          (data.result.fileList && data.result.fileList?.length > 0)
        ) {
          setMoreFeedsAvailable(true);
          setErrorMessage(t(''));

          /** Added by @akshita 05-02-25 ---> Replace vault item list on first page (#15657)*/
          const folders: TamaracVaultItem[] = (
            data.result.folderList || []
          ).map(folder => ({
            ...folder,
            type: 'folder',
            name: folder.folderName ?? '',
          }));

          const files: TamaracVaultItem[] = (data.result.fileList || []).map(
            file => ({
              ...file,
              type: 'file',
              name: file.fileName ?? '',
              fileLoader: false,
            }),
          );

          const combinedList: TamaracVaultItem[] = [...folders, ...files];

          if (variables.PageNo === 1) {
            setTamaracVaultItemList(combinedList);
          } else {
            /** Added by @akshita 05-02-25 --->Append new chats to the existing list (#15657)*/
            setTamaracVaultItemList([
              ...tamaracVaultItemList,
              ...combinedList!,
            ]);
          }
        }
      }
    },
    onError(error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/
      showSnackbar(error.message, 'danger');
      setMoreFeedsAvailable(
        false,
      ); /** Added by @akshita 05-02-25 ---> Mark no more feeds available (#15657)*/
      if (variables.PageNo === 1) {
        /** Added by @akshita 05-02-25 --->Clear chat list if error occurs on the first page (#15657)*/
        setTamaracVaultItemList([]);
      }
    },
  });

  const getTamaracFiles3URLApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTamaracFiles3URLModel>({
        endpoint: ApiConstants.GetTamaracFiles3URL,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      // Set fileLoader: true for the item being downloaded
      setTamaracVaultItemList(prevList =>
        prevList.map(item =>
          item.fileId === variables.fileId // assuming `id` uniquely identifies the file
            ? { ...item, fileLoader: true }
            : item,
        ),
      );
    },
    onSettled(data, error, variables, context) {},
    onSuccess(data, variables, context) {
      /** Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/
      if (data.result) {
        setTamVaultFileData({ ...data.result, fileType: variables.fileType });

        if (variables.longPress) {
          setShowActionSheetPopUp(true);
        } else if (!variables.longPress) {
          // handleItemClick(data?.result?.s3URL, variables.fileType);

          handleSelectedActionItem({
            ActionParam: 'Open',
            url: data?.result?.s3URL,
            fileType: variables.fileType,
            fileNameValue: variables.fileNameValue,
            id: variables.fileId,
          });
        }
      }
    },
    onError(error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/

      setEMoneyVaultItemList(prevList =>
        prevList.map(item =>
          item.id === variables.fileId // assuming `id` uniquely identifies the file
            ? { ...item, fileLoader: false }
            : item,
        ),
      );
      showSnackbar(error.message, 'danger');
    },
  });

  const renderFiles = (item: VaultTamaracItemList) => {
    const icon = getFileIcon(item.fileType!, item.type!);
    return (
      <View>
        <Tap
          style={styles.wrapper}
          onLongPress={() => handleOnClick(item, true)}
          onPress={() => handleOnClick(item, false)}
        >
          <View style={styles.wrapper}>
            <View style={styles.heading}>
              <View style={styles.fileLay}>
                {!item.fileLoader ? (
                  <CustomImage
                    source={icon}
                    color={theme.colors.onSurfaceVariant}
                    type={ImageType.svg}
                    style={styles.fileIcon}
                  />
                ) : (
                  <ActivityIndicator style={styles.loader} />
                )}
              </View>

              <CustomText
                variant={TextVariants.titleMedium}
                style={styles.name}
                maxLines={1}
                ellipsis={TextEllipsis.tail}
              >
                {item.name}
              </CustomText>
            </View>

            {item.progress && (
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <ActivityIndicator size={20} />
                <CustomText>{`${item.progress}%`}</CustomText>
              </View>
            )}
          </View>
        </Tap>
        <Divider />
      </View>
    );
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader
          showBack
          title={isFromEMoney ? t('EMoneyVault') : t('TamaracVault')}
          onBackPress={() => updateFolderPath()}
        />
        {loading ? (
          <SkeletonList
            count={15}
            style={styles.container}
            children={
              <View style={styles.skeletonContainer}>
                <View style={styles.skeletonFileIcon} />
                <View style={styles.skeletonSubText} />
              </View>
            }
          />
        ) : (
          <View style={styles.container}>
            {isFromEMoney ? (
              <CustomFlatList
                data={eMoneyVaultItemList}
                contentContainerStyle={
                  eMoneyVaultItemList.length == 0
                    ? styles.flatListContainerStyle
                    : undefined
                }
                refreshing={loading}
                onEndReachedThreshold={0.6}
                onEndReached={() => {
                  if (moreFeedsAvailable && !apiLoading) {
                    callGetVaultItemsListApi(pageNumber + 1, folderPath);
                  }
                }}
                keyExtractor={item => item.id!.toString()!}
                onRefresh={() => callGetVaultItemsListApi(1, folderPath)}
                ListHeaderComponent={() =>
                  !isEmpty(folderPath) && (
                    <View style={styles.listHeader}>
                      <CustomText
                        maxLines={1}
                        ellipsis={TextEllipsis.tail}
                        variant={TextVariants.bodyLarge}
                      >
                        {pageTitle}
                      </CustomText>
                    </View>
                  )
                }
                ListEmptyComponent={
                  <View style={styles.errorContainer}>
                    <EmptyView label={errorMessage} />
                  </View>
                }
                renderItem={({ item }) => renderFiles(item)}
              />
            ) : (
              <CustomFlatList
                data={tamaracVaultItemList}
                contentContainerStyle={
                  tamaracVaultItemList.length == 0
                    ? styles.flatListContainerStyle
                    : undefined
                }
                refreshing={loading}
                onEndReachedThreshold={0.6}
                onEndReached={() => {
                  if (moreFeedsAvailable && !apiLoading) {
                    callGetVaultItemsListApi(pageNumber + 1, folderPath);
                  }
                }}
                keyExtractor={item => `${item.folderId}${item.fileId}`}
                onRefresh={() => callGetVaultItemsListApi(1, folderPath)}
                ListHeaderComponent={() =>
                  !isEmpty(folderPath) && (
                    <CustomText
                      variant={TextVariants.bodyLarge}
                      style={styles.listHeader}
                    >
                      {pageTitle}
                    </CustomText>
                  )
                }
                ListEmptyComponent={
                  <View style={styles.errorContainer}>
                    <EmptyView label={errorMessage} />
                  </View>
                }
                renderItem={({ item }) => renderFiles(item)}
              />
            )}
          </View>
        )}
      </View>
      <CustomActionSheetPoup
        shown={showActionSheetPopUp}
        setShown={setShowActionSheetPopUp}
        centered={false}
        //title={t('Select')}
        hideIcons={false}
        loading={isDownLoading}
        children={[
          {
            title: t('OpenFile'),
            image: Images.link,
            imageType: ImageType.svg,
            onPress: () => {
              handleSelectedActionItem({
                ActionParam: 'Open',
                url: isFromEMoney
                  ? eMoneyVaultFileData?.fileBytes!
                  : tamVaultFileData?.s3URL!,
                fileType: isFromEMoney
                  ? eMoneyVaultFileData?.fileType!
                  : tamVaultFileData?.fileType!,
                fileNameValue: isFromEMoney
                  ? eMoneyVaultFileData?.fileName || ''
                  : '',
                id: isFromEMoney
                  ? eMoneyVaultFileData?.id
                  : tamVaultFileData?.fileId,
              });
            },
          },
          {
            title: t('DownLoadFile'),
            image: Images.download,
            imageType: ImageType.svg,

            onPress: () => {
              setIsDownloading(true);
              handleSelectedActionItem({
                ActionParam: 'Download',
                url: isFromEMoney
                  ? eMoneyVaultFileData?.fileBytes!
                  : tamVaultFileData?.s3URL!,
                fileType: isFromEMoney
                  ? eMoneyVaultFileData?.fileType!
                  : tamVaultFileData?.fileType!,
                fileNameValue: isFromEMoney
                  ? eMoneyVaultFileData?.fileName || ''
                  : '',
                id: isFromEMoney
                  ? eMoneyVaultFileData?.id
                  : tamVaultFileData?.fileId,
              });
            },
          },
        ]}
      />
    </SafeScreen>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listHeader: {
      paddingHorizontal: 13,
      paddingTop: 20,
    },
    flatListContainerStyle: { flex: 1, justifyContent: 'center' },
    errorContainer: {
      alignSelf: 'center',
      justifyContent: 'center',
    },

    skeletonContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25,
    },
    skeletonSubText: {
      backgroundColor: theme.colors.surface,
      width: '73%',
      height: 33,
      borderRadius: theme.roundness,
      marginLeft: 25,
    },
    skeletonFileIcon: {
      backgroundColor: theme.colors.surface,
      width: 35,
      height: 40,
      borderRadius: theme.roundness,
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      paddingLeft: 6,
    },
    fileLay: {
      height: 40,
      width: 40,
    },
    fileIcon: {
      height: 40,
      width: 40,
    },
    name: {
      flex: 1,
      marginLeft: 15,
    },
    loader: {
      marginTop: 7,
    },
  });
export default Vault;
