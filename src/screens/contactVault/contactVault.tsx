import {
  BlinkingBorderView,
  CustomImage,
  CustomText,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import CustomFlatList from '@/components/atoms/customFlatList/customFlatList';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  CustomPopup,
  CustomTextInput,
  EmptyView,
} from '@/components/molecules';
import {
  InputReturnKeyType,
  InputVariants,
} from '@/components/molecules/customTextInput/formTextInput';
import { hideLoader, showLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { CombinedItem, GetFoldersForUsersModel } from '@/services/models';
import { tenantDetailStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  DownloadDocumentFile,
  OpenDocumentFile,
} from '@/utils/fileDownloadUtils';
import Log from '@/utils/logger';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
// import {downloadAndOpenFile} from '@/utils/fileDownloadUtils';
import {
  formatDateUtcReturnLocalTime,
  isEmpty,
  showSnackbar,
  useBackPressHandler,
  useCustomInAppBrowser,
} from '@/utils/utils';
// import {CustomInAppBrowser, openUrl, showSnackbar} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

export enum ActionParam {
  Download = 'download',
  Open = 'open',
  Share = 'share',
}

export enum ContactVaultParentScreenType {
  fromNotification = 'FromNotification',
  fromNotiList = 'FromNotiList',
  fromContactVault = 'FromContactVault',
  fromAdvContactListing = 'fromAdvContactListing',
  fromDashboardShortcutCard = 'fromDashboardShortcutCard',
  fromMyTeamsAdvisor = 'fromMyTeamsAdvisor',
}

export type ContactVaultProps = {
  navigationFrom?: ContactVaultParentScreenType;
  folderPath?: string;
  folderID?: string;
  folderIdHistory?: string;
  fileId?: string;
  errorMsg?: string;
  userId?: number;
  userName?: string;
  myDocId?: string;
  fileIdList?: string[];
};

export type ContactVaultReturnProp = {
  isNewFileAdded?: boolean;
};

function ContactVault() {
  /** Added by @Akshita 05-02-25 --->Hook to handle navigation within the app (FYN-4314)*/
  const navigation = useAppNavigation();
  /**
   * Added by @Akshita 10-02-2025 ->   Get the theme using useTheme hook (FYN-4279)
   */
  const theme = useTheme();

  /**
   * Added by @Akshita 10-02-2025 ->  Generate styles dynamically based on the theme (FYN-4279)
   */
  const styles = makeStyles(theme);

  const route = useAppRoute('ContactVault');

  const { sendDataBack, receiveDataBack } = useReturnDataContext();
  /**
   * Added by @Akshita 10-02-2025 ->  Translation hook for multi-language support (FYN-4279)
   */
  const { t } = useTranslation();

  /** Added by @Akshita 05-02-25 ---> Fetches user details from the global store (FYN-4314)*/
  const userDetails = userStore(state => state.userDetails);

  const tenantDetails = tenantDetailStore.getState().tenantDetails;

  const [hasMoreData, setHasMoreData] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  const [filteredUserDocList, setFilteredUserDocList] = useState<
    CombinedItem[]
  >([]);

  const [allUserDocumentList, setAllUserDocumentList] = useState<
    CombinedItem[]
  >([]);

  const [myDocFolderId, setMyDocFolderId] = useState<string>(
    route.params?.myDocId ? route.params.myDocId : '',
  );

  /** Added by @Akshita 05-02-25 ---> Stores the search query input (FYN-4314)*/
  const [search, setSearch] = useState('');

  const [currentFolderId, setCurrentFolderId] = useState<string>(
    route.params?.folderID ? route.params.folderID : '',
  );

  const [currentFileId, setCurrentFileId] = useState<string>(
    route.params?.fileId ? route.params.fileId : '',
  );

  const [currentFileIdList, setCurrentFileIdList] = useState<string[]>(
    route.params?.fileIdList ? route.params.fileIdList : [],
  );

  /** Added by @Akshita 25-03-25 ---> state to display error message on the screen (FYN-4314) */
  const [folderPath, setFolderPath] = useState<string>(
    route.params?.folderPath ? route.params.folderPath : '',
  );

  const [folderIdHistory, setFolderIdHistory] = useState<string>(
    route.params?.folderIdHistory ? route.params.folderIdHistory : '',
  );

  const [errorMsg, setErrorMsg] = useState<string>(
    route.params?.errorMsg ? route.params.errorMsg : '',
  );

  const isFromAdvContactList =
    route.params?.navigationFrom ==
      ContactVaultParentScreenType.fromAdvContactListing ||
    !isEmpty(route.params?.userId?.toString())
      ? true
      : false;

  const [selectedUserDocItem, setSelectedUserDocItem] =
    useState<CombinedItem>();

  const [showActionPopup, setShowActionPopup] = useState(false); // show report popup

  const [isDownloading, setIsDownloading] = useState(false); // show report popup

  const [selectedFileColor, setSelectedFileColor] = useState<
    string | undefined
  >(theme.colors.surfaceVariant);

  /** Added by @Akshita 10-09-25 --->  Controls visibility of the image picker popup (FYN-4314)*/
  const [deleteFileLoading, setDeleteFileLoading] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const didSkipInitial = useRef(true);

  /**
   * Added by @Akshita 10-02-2025 ->  useEffect to trigger API call on component mount (FYN-4279)
   */
  useEffect(() => {
    if (
      isFromAdvContactList ||
      ((route.params?.navigationFrom ==
        ContactVaultParentScreenType.fromNotification ||
        route.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotiList) &&
        route?.params?.userId!)
    ) {
      callGetFoldersAndFilesByParentIdApi({
        parentFolderIdValue: currentFolderId,
        UserId: route.params?.userId!,
      });
    } else {
      callGetFoldersForUsersApi({ parentFolderIdValue: currentFolderId });
    }
  }, []);

  useEffect(() => {
    if (didSkipInitial.current) {
      didSkipInitial.current = false;
      return;
    }
    if (folderPath !== route.params?.folderPath) {
      getPreviousFolderPath(folderPath);
    }
    // if(currentFolderId != route.params?.folderID){

    // }
  }, [folderPath]);

  useEffect(() => {
    // Whenever folderPath changes, update the page title
    if (
      !isEmpty(folderIdHistory) &&
      folderIdHistory != route.params?.folderIdHistory
    ) {
      restorePreviousFolderId(folderIdHistory);
    }
  }, [folderIdHistory]);

  receiveDataBack('ContactVault', (data: ContactVaultReturnProp) => {
    if (data.isNewFileAdded) {
      if (isEmpty(currentFolderName)) {
        callGetFoldersForUsersApi({ parentFolderIdValue: '' });
      } else {
        callGetFoldersForUsersApi({ parentFolderIdValue: myDocFolderId });
      }
    }
  });

  /**  Added by @Akshita 26-12-24 ---> handle hardware back press(FYN-8851)*/
  useBackPressHandler(() => updateFolderPath());

  const updateFolderPath = () => {
    /**
     * Added by @Akshita 26-12-24 --->   * Back navigation rules (FYN-4314)
     *
     * 1) If the user opened Vault from a notification and has NOT navigated
     *    into any deeper folder (i.e., folderIdHistory has no "\"),
     *    then on back we take them straight to the Dashboard.
     *
     * 2) Otherwise (either not from notification, or they’ve drilled into
     *    subfolders), we step back one level:
     *      - pop the last segment from the visible folderPath
     *      - restore the previous folderId from folderIdHistory
     *
     * (FYN-8851)*/
    Log('folderIdHistory' + folderIdHistory);
    Log('parentFolderName' + parentFolderName);

    if (
      route?.params?.navigationFrom ==
        ContactVaultParentScreenType.fromNotiList ||
      route?.params?.navigationFrom ==
        ContactVaultParentScreenType.fromNotification
    ) {
      if (!folderIdHistory.includes('\\')) {
        // if (!userDetails?.isAdvisor) {
        //   navigation.navigate('DrawerRoutes', {
        //     screen: 'BottomBarRoutes',
        //     params: { screen: 'Dashboard' },
        //   });
        // } else {
        //   navigation.navigate('DrawerRoutes', {
        //     screen: 'BottomBarRoutes',
        //     params: { screen: 'ContactListing' },
        //   });
        // }
        if (!userDetails?.isAdvisor) {
          sendDataBack('Profile', { goBack: true });
        } else {
          sendDataBack('ContactProfile', { goBack: true });
        }

        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }
    } else {
      Log('folderPath in the else case' + folderPath);

      getPreviousFolderPath(folderPath);
      restorePreviousFolderId(folderIdHistory);
    }
    return true;
  };

  /**  Added by @Akshita 8-09-25 --->  1) Derive names from folderPath */
  const pathParts = useMemo(
    () => (folderPath ? folderPath.split(/[/\\]+/).filter(Boolean) : []),
    [folderPath],
  );

  /**  
  * Added by @Akshita 8-09-25 --->  2) Use them in the header:
  - On root: keep your static title ("SecureFiles") and optional username subtitle
  - Deeper: title shows parent, subtitle (middle text) shows current */

  const isRoot = pathParts.length === 0;
  const currentFolderName = pathParts.length
    ? pathParts[pathParts.length - 1]
    : '';
  const parentFolderName =
    pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';

  const getPreviousFolderPath = (path: string): string => {
    Log('3]  path before backpress: ' + path);

    // 1. split into segments and drop the last folder
    const parts = path.split(/[/\\]+/);
    parts.pop(); // removes 'group'

    // 2. reconstruct the path (or empty string if nothing left)
    const previousPath = parts.length > 0 ? parts.join('\\') : '';

    Log('4] path after backpress: ' + previousPath);

    // 3. set your folderPath
    setFolderPath(previousPath);

    return previousPath;
  };

  const restorePreviousFolderId = (idHistory: string): string => {
    Log('8] folder ID history before backpress---------> ' + idHistory);

    // 1. split into segments and drop the last folder
    const parts = idHistory.split(/[/\\]+/);
    parts.pop(); // removes 'group'

    // 2. reconstruct the path (or empty string if nothing left)
    const previousFolderIdHistory = parts.length > 0 ? parts.join('\\') : '';

    // 3. store the last segment (the last part of the original path)
    const lastSegment = !isEmpty(previousFolderIdHistory.split(/[/\\]+/).pop())
      ? previousFolderIdHistory.split(/[/\\]+/).pop()
      : '';

    Log('9] FolderId History after backpress: ' + previousFolderIdHistory);
    Log('10] lastSegment or current folder Id: ' + lastSegment);

    // 4. set your folderPath
    setFolderIdHistory(previousFolderIdHistory);
    setCurrentFolderId(lastSegment!);
    return previousFolderIdHistory;
  };

  const callGetFoldersForUsersApi = ({
    searchString = '',
    parentFolderIdValue = '',
    isRefreshVal = false,
  }: {
    searchString?: string;
    parentFolderIdValue?: string;
    isRefreshVal?: boolean;
  }) => {
    Log('calling folder api ');
    getFoldersForUsersApi.mutate({
      parentFolderId: parentFolderIdValue,
      filter: searchString,
      isRefresh: isRefreshVal,
    });
  };

  const callGetFoldersAndFilesByParentIdApi = ({
    searchString = '',
    parentFolderIdValue = '',
    isRefreshVal = false,
    UserId,
  }: {
    searchString?: string;
    parentFolderIdValue?: string;
    isRefreshVal?: boolean;
    UserId?: number;
  }) => {
    getFoldersAndFilesByParentIdApi.mutate({
      parentFolderId: parentFolderIdValue,
      filter: searchString,
      userId: route.params?.userId,
      isRefresh: isRefreshVal,
    });
  };

  /**
   * Added by @Akshita 13-03-2025 -> Handle Long Press Action (FYN-5333)
   * This function is triggered when the user long-presses on a list item.
   * If the item is a PDF file, it sets the selected item and opens the action popup.
   */
  const handleLongPress = (itemData: CombinedItem) => {
    setSelectedUserDocItem(itemData);
    setShowActionPopup(true);
  };

  const handleCancelActionSheet = () => {
    setShowActionPopup(false);
    // setSelectedUserDocItem(undefined);
  };

  const handleFolderClick = (item: CombinedItem) => {
    // Reset to first page
    // Construct new folder path
    // Construct new folder path

    const newFolderPath = item
      ? !isEmpty(folderPath)
        ? `${folderPath}\\${item.name}`
        : item.name
      : '';

    const newFolderIdHistory = item
      ? !isEmpty(folderIdHistory)
        ? `${folderIdHistory}\\${item.id}`
        : item.id
      : '';
    Log(' 1] Before adding folder ID, current history: ' + newFolderIdHistory);
    setFolderIdHistory(newFolderIdHistory!);
    setCurrentFolderId(item.id!);
    setFolderPath(newFolderPath!);
    Log(
      'folder click item id ---------> ' +
        item.id +
        '  path ---------> ' +
        newFolderPath,
    );
    navigation.push('ContactVault', {
      folderPath: newFolderPath,
      folderID: item.id,
      folderIdHistory: newFolderIdHistory,
      navigationFrom: ContactVaultParentScreenType.fromContactVault,
      userId: route.params?.userId,
      userName: route.params?.userName,
      myDocId: myDocFolderId,
    });
  };

  const handleItemClick = (itemData: CombinedItem, actionParamVal: string) => {
    ///content type=L for link,E=embedded code, I=image, D=document(mp3,.doc,.docx,xls,xlsx,pdf),V=video(mp4)
    setSelectedUserDocItem(itemData);
    if (itemData.isFolder) {
      handleFolderClick(itemData);
    } else {
      Getfilefroms3.mutate({
        fileName: itemData.location,
        fileType: itemData.fileType,
        actionParam: actionParamVal,
      });
    }
  };

  const finish = (fileUri?: string) => {
    setIsDownloading(false);
    setFilteredUserDocList(prev =>
      prev?.map(item => {
        if (selectedUserDocItem && item.id == selectedUserDocItem?.id) {
          return { ...item, progress: undefined };
        } else {
          return item;
        }
      }),
    );
    if (!fileUri) {
      showSnackbar(t('SomeErrorOccured'), 'danger');
    }
  };

  const setDocumentLoading = () => {
    setIsDownloading(true);
    setFilteredUserDocList(prev =>
      prev?.map(item => {
        if (selectedUserDocItem && item.id == selectedUserDocItem?.id) {
          return { ...item, progress: '1' };
        } else {
          return item;
        }
      }),
    );
  };

  const handleItemDirectOpen = (contentURL: string, fileType: string) => {
    setDocumentLoading();
    OpenDocumentFile({
      fileUrl: contentURL!,
      fileExtension: `.${fileType!}`,
      fileName: selectedUserDocItem?.name!,
      onDownloadComplete(fileUri) {
        finish(fileUri);
      },
    });
  };

  const handleItemDownload = (contentURL: string) => {
    setDocumentLoading();
    DownloadDocumentFile({
      fileUrl: contentURL!,
      fileExtension: `.${selectedUserDocItem?.fileType!}`,
      fileName: selectedUserDocItem?.name!,
      onDownloadComplete(fileUri) {
        finish(fileUri);
      },
    });
  };

  /** Added by @Akshita 05-02-25 ---> handles the search results of the add member list (FYN-4314)*/
  const handleSearch = (query: string) => {
    setSearch(query);
    setSearchLoading(true);
    if (isFromAdvContactList) {
      callGetFoldersAndFilesByParentIdApi({
        searchString: query,
        parentFolderIdValue: currentFolderId,
        isRefreshVal: true,
        UserId: route.params?.userId,
      });
    } else {
      callGetFoldersForUsersApi({
        searchString: query,
        parentFolderIdValue: currentFolderId,
        isRefreshVal: true,
      });
    }
  };

  /**
   * Added by @Akshita 22-05-25 ---> API call to get imagedata in chat (FYN-4314)*/
  const Getfilefroms3 = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.Getfilefroms3,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
      setDocumentLoading();
    },
    onSettled(data, error, variables, context) {
      if (error) {
        finish();
      }
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        if (variables.actionParam == ActionParam.Open) {
          handleItemDirectOpen(data.result, variables.fileType);
        }
        if (variables.actionParam == ActionParam.Download) {
          handleItemDownload(data.result);
        }
      }
    },
    onError(error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/
      showSnackbar(error.message, 'danger');
    },
  });

  const getFoldersForUsersApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetFoldersForUsersModel>({
        endpoint: ApiConstants.GetFoldersForUsers,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
      if (
        variables.isRefreshVal &&
        (route?.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotification ||
          route?.params?.navigationFrom ==
            ContactVaultParentScreenType.fromNotiList)
      ) {
        showLoader();
      }
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
      setSearchLoading(false);
      if (
        route?.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotification ||
        route?.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotiList
      ) {
        hideLoader();

        if (route?.params?.errorMsg) {
          showSnackbar(errorMsg, 'danger', 3000);
        }
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result?.combinedItems) {
        if (data?.result?.combinedItems.length > 0 && isRoot) {
          // 🔎 find the folder where permittedToContact is true
          const myDocFolder = data.result.combinedItems.find(
            item => item.permittedToContact === true,
          );

          if (myDocFolder && myDocFolder.id) {
            Log(' current folder id : ' + currentFolderId);

            Log('here we got to set the my document id : ' + myDocFolder.id);
            setMyDocFolderId(myDocFolder.id);

            if (
              route?.params?.navigationFrom ==
              ContactVaultParentScreenType.fromDashboardShortcutCard
            )
              navigation.navigate('UploadSecureFiles', {
                folderID: myDocFolder.id,
              });
          }
        }

        const newData = data.result.combinedItems.map(item => {
          // Ensure creationTime exists before formatting
          if (item.creationTime) {
            return {
              ...item, // Spread the original item properties
              creationTime: formatDateUtcReturnLocalTime({
                date: item.creationTime,
                parseFormat: 'DD MMM YYYY hh:mm:ss A',
                returnFormat: 'DD MMM YYYY hh:mm A',
              }),
            };
          }
          return item; // Return item unchanged if creationTime is missing
        });
        if (
          route?.params?.navigationFrom ==
            ContactVaultParentScreenType.fromNotification ||
          route?.params?.navigationFrom ==
            ContactVaultParentScreenType.fromNotiList
        ) {
          const newAddedFile = newData.find(item => item.id === currentFileId);
          const allFiles = newData.filter(item => item.id !== currentFileId);

          // Filter the combinedItems to find the file that matches currentFileId
          if (route.params.fileIdList) {
            const filesToHighlight = currentFileIdList; // Use fileIdList if provided, else fallback to currentFileId

            // Highlight the files whose IDs are in fileIdList or match currentFileId
            const updatedData = newData.map(item => {
              if (filesToHighlight.includes(item.id!)) {
                return { ...item, selected: true }; // Mark as selected if file ID matches
              }
              return item; // Otherwise, keep it as is
            });

            // Sort the list: Move the selected files to the top
            const sortedData = updatedData.sort((a, b) => {
              // Move selected files to the top
              if (a.selected && !b.selected) return -1;
              if (!a.selected && b.selected) return 1;
              return 0; // Keep original order for the rest
            });

            setAllUserDocumentList(sortedData);
            setFilteredUserDocList(sortedData);
          } else if (newAddedFile) {
            setAllUserDocumentList([
              { ...newAddedFile, selected: true },
              ...allFiles,
            ]);
            setFilteredUserDocList([
              { ...newAddedFile, selected: true },
              ...allFiles,
            ]);
          } else {
            // If no current file, just set the files as they are
            setAllUserDocumentList(allFiles);
            setFilteredUserDocList(allFiles);
          }
        } else {
          // Default behavior if not coming from a notification
          setAllUserDocumentList(newData);
          setFilteredUserDocList(newData);
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const getFoldersAndFilesByParentIdApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetFoldersForUsersModel>({
        endpoint: ApiConstants.GetFoldersAndFilesByParentId,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setLoading(true);
      if (
        variables.isRefreshVal &&
        (route?.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotification ||
          route?.params?.navigationFrom ==
            ContactVaultParentScreenType.fromNotiList)
      ) {
        showLoader();
      }
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
      setSearchLoading(false);
      if (
        route?.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotification ||
        route?.params?.navigationFrom ==
          ContactVaultParentScreenType.fromNotiList
      ) {
        hideLoader();

        if (route?.params?.errorMsg) {
          showSnackbar(errorMsg, 'danger', 3000);
        }
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result?.combinedItems) {
        const newData = data.result.combinedItems.map(item => {
          // Ensure creationTime exists before formatting
          if (item.creationTime) {
            return {
              ...item, // Spread the original item properties

              creationTime: formatDateUtcReturnLocalTime({
                date: item.creationTime,
                parseFormat: 'DD MMM YYYY hh:mm:ss A', // add enum
                returnFormat: 'DD MMM YYYY hh:mm A',
              }),
            };
          }
          return item; // Return item unchanged if creationTime is missing
        });
        if (
          route?.params?.navigationFrom ==
            ContactVaultParentScreenType.fromNotification ||
          route?.params?.navigationFrom ==
            ContactVaultParentScreenType.fromNotiList
        ) {
          // Step 1: Separate files that match the currentFileIdList
          const newAddedFile = newData.filter(
            item => currentFileIdList.includes(item.id!), // Check if file ID exists in the list
          );
          // Step 2: Separate files that do not match the currentFileIdList
          const allFiles = newData.filter(
            item => !currentFileIdList.includes(item.id!), // Check if file ID does not exist in the list
          );
          Log('newAddedFile=>' + JSON.stringify(newAddedFile));

          Log('FileIdList=>' + JSON.stringify(currentFileIdList));
          // Step 3: Combine the lists, with matching files at the top

          if (newAddedFile.length > 0) {
            const combinedFiles = [
              ...newAddedFile.map(item => ({ ...item, selected: true })),
              ...allFiles,
            ];
            setAllUserDocumentList(combinedFiles);
            setFilteredUserDocList(combinedFiles);
          } else {
            // If no current file, just set the files as they are
            setAllUserDocumentList(allFiles);
            setFilteredUserDocList(allFiles);
            showSnackbar(t('UploadedFileDeletedMsg'), 'danger');
          }
        } else {
          // Default behavior if not coming from a notification
          setAllUserDocumentList(newData);
          setFilteredUserDocList(newData);
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  const deleteUserDocumentApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.UserDocumentsDelete,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onMutate(variables) {
      setDeleteFileLoading(true);
    },
    onSettled(data, error, variables, context) {
      setDeleteFileLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        const newData = filteredUserDocList.filter(
          item => item.id !== variables.Id,
        );
        Log('data after delete api call : ' + JSON.stringify(newData));
        setAllUserDocumentList(newData);
        setFilteredUserDocList(newData);
        setShowDeletePopup(false);
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setDeleteFileLoading(false);
    },
  });

  /** Added by @Akshita 24-03-2025 -> Render user doc item using flash list (FYN-5971) */
  const renderUserDocumentItem = (item: CombinedItem) => {
    return (
      <BlinkingBorderView
        blink={item.selected}
        color1={theme.colors.surfaceVariant}
        color2={theme.colors.primary}
        style={styles.newsCard}
        duration={500}
        onFinish={() => {
          setFilteredUserDocList(prev =>
            prev?.map(aitem => {
              if (item.id == aitem.id && aitem.selected) {
                return { ...aitem, selected: undefined };
              } else {
                return aitem;
              }
            }),
          );
        }}
      >
        <Tap
          onPress={() => {
            !isDownloading && handleItemClick(item, ActionParam.Open);
          }}
          onLongPress={() => {
            !item.isFolder && !isDownloading && handleLongPress(item);
          }}
        >
          <View style={styles.cardWrapper}>
            <View style={styles.leftContent}>
              <CustomText
                variant={TextVariants.bodyMedium}
                style={styles.title}
                ellipsis={TextEllipsis.tail}
                maxLines={2} // ✅ Allow wrapping for long names
              >
                {decodeURIComponent(item.name!)}
              </CustomText>
              <View style={styles.fileInfoWrapper}>
                {!item.isFolder && (
                  <CustomText
                    variant={TextVariants.labelMedium}
                    ellipsis={TextEllipsis.tail}
                  >
                    {`${t('AddedBy')} : ${item.addedBy}`}
                  </CustomText>
                )}
                <CustomText variant={TextVariants.labelMedium}>
                  {`${t('AddedOn')} : ${item.creationTime}`}
                </CustomText>
              </View>
              <View style={styles.bottomRow}>
                <View style={styles.wrapper}>
                  <View style={styles.fileTypeBox}>
                    {item.isFolder ? (
                      <CustomText>{t('Folder')}</CustomText>
                    ) : (
                      <CustomText>{item.fileType}</CustomText>
                    )}
                  </View>

                  {item.progress && <ActivityIndicator />}
                </View>
                {!item.isFolder && (
                  <Tap
                    style={styles.iconBgMore}
                    onPress={() => {
                      !isDownloading && handleLongPress(item);
                    }}
                  >
                    <CustomImage
                      source={Images.more}
                      type={ImageType.svg}
                      color={theme.colors.onSurfaceVariant}
                      style={styles.moreIcon}
                    />
                  </Tap>
                )}
              </View>
            </View>

            <View style={styles.rightContent}>
              {!isEmpty(item.coverImageURL) && (
                <CustomImage
                  source={{ uri: item.coverImageURL }}
                  style={styles.thumbnailImg}
                />
              )}

              <CustomImage
                source={
                  item.isFolder
                    ? Images.defaultFolder
                    : !item.isFolder && isEmpty(item.coverImageURL)
                    ? Images.defaultFile
                    : ''
                }
                style={styles.thumbnailImg}
                type={ImageType.svg}
              />
            </View>
          </View>
        </Tap>
      </BlinkingBorderView>
    );
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader
          showBack
          onBackPress={() => updateFolderPath()}
          title={
            isFromAdvContactList
              ? route.params?.userName // If from AdvContactList, show the username
              : isRoot
              ? t('SecureFiles') // If root, show "SecureFiles"
              : !isEmpty(parentFolderName) // If parentFolderName exists, combine parentFolderName and currentFolderName
              ? `${parentFolderName}/${currentFolderName}`
              : `${t('SecureFiles')}/${currentFolderName}` // Default case: combine "SecureFiles" with currentFolderName
          }
          subtitle={
            isFromAdvContactList
              ? isRoot
                ? `${t('SecureFiles')}`
                : !isEmpty(parentFolderName)
                ? `${parentFolderName}/${currentFolderName}`
                : `${t('SecureFiles')}/${currentFolderName}`
              : ''
          }
        />
        <View style={styles.main}>
          <View style={styles.searchContainer}>
            <CustomTextInput
              style={styles.searchInput}
              mode={InputVariants.outlined}
              label={t('Search')}
              placeholder={t('Search')}
              showLabel={false}
              showError={false}
              text={search}
              loading={searchLoading}
              onChangeText={text => {
                if (text == '') {
                  handleSearch('');
                }
                setSearch(text);
              }}
              returnKeyType={InputReturnKeyType.search}
              onSubmitEditing={() => {
                handleSearch(search);
              }}
              prefixIcon={{
                source: Images.search,
                type: ImageType.svg,
              }}
              suffixIcon={
                search.length > 0
                  ? {
                      source: Images.closeCircle,
                      type: ImageType.svg,
                      tap() {
                        handleSearch('');
                      },
                    }
                  : undefined
              }
            />
            {(isRoot || currentFolderId == myDocFolderId) &&
              (!isFromAdvContactList || !userDetails?.isAdvisor) &&
              tenantDetails?.secureFilesContactUpload && (
                <Tap
                  style={styles.btnView}
                  onPress={() => {
                    !loading &&
                      navigation.navigate('UploadSecureFiles', {
                        folderID: myDocFolderId,
                      });
                  }}
                >
                  <CustomText
                    style={styles.addFileBtn}
                    color={theme.colors.onPrimary}
                  >
                    {t('AddFiles')}
                  </CustomText>
                </Tap>
              )}
          </View>
          {loading ? (
            <SkeletonList
              count={5}
              children={
                <View style={styles.skeletonLay}>
                  <View style={styles.skeletonMain}>
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonHeading} />
                      <View style={styles.skeletonDesc} />
                      <View style={styles.skeletonDesc} />
                      <View style={styles.skeletonType} />
                    </View>
                    <View style={styles.skeletonImg} />
                  </View>
                </View>
              }
            />
          ) : (
            <>
              <CustomFlatList
                data={filteredUserDocList}
                refreshing={loading}
                extraData={[
                  filteredUserDocList,
                  allUserDocumentList,
                  selectedFileColor,
                ]}
                onRefresh={() => {
                  if (isFromAdvContactList || route.params?.fileIdList) {
                    Log('calling this Api');
                    callGetFoldersAndFilesByParentIdApi({
                      parentFolderIdValue: currentFolderId,
                      isRefreshVal: true,
                      UserId: route.params?.userId,
                    });
                  } else {
                    callGetFoldersForUsersApi({
                      parentFolderIdValue: currentFolderId,
                      isRefreshVal: true,
                    });
                  }

                  setSearch('');
                }}
                contentContainerStyle={
                  filteredUserDocList.length == 0
                    ? styles.flatListContainerStyle
                    : undefined
                }
                onEndReachedThreshold={0.4}
                onEndReached={() => {}}
                ListEmptyComponent={
                  <EmptyView label={t('NoFilesOrFoldersFound')} />
                }
                // ListFooterComponent={<LoadMore />}
                // ListHeaderComponent={() =>
                //   !isEmpty(folderPath) && (
                //     <View>
                //       <CustomText
                //         variant={TextVariants.bodyLarge}
                //         style={styles.listHeader}>
                //         {folderPath}
                //       </CustomText>
                //     </View>
                //   )
                // }
                keyExtractor={(item, index) => index.toString()!}
                renderItem={({ item }) => renderUserDocumentItem(item)}
              />
            </>
          )}
        </View>

        <CustomActionSheetPoup
          shown={showActionPopup}
          setShown={setShowActionPopup}
          hideIcons={false}
          centered={false}
          onCancelClick={() => handleCancelActionSheet()}
          children={[
            {
              title: 'Open',
              image: Images.link, // Replace with your icon
              imageType: ImageType.svg,
              onPress: () =>
                handleItemClick(selectedUserDocItem!, ActionParam.Open),
            },

            {
              title: 'Download',
              image: Images.download, // Replace with your icon
              imageType: ImageType.svg,
              onPress: () =>
                handleItemClick(selectedUserDocItem!, ActionParam.Download),
            },
            ...(selectedUserDocItem?.permittedToContact == true &&
            (!isFromAdvContactList || !userDetails?.isAdvisor)
              ? [
                  {
                    title: 'Delete',
                    image: Images.delete, // Replace with your icon
                    imageType: ImageType.svg,
                    onPress: () => {
                      setShowDeletePopup(true);
                    },
                  },
                ]
              : []),
          ]}
        />

        <CustomPopup
          shown={showDeletePopup}
          setShown={setShowDeletePopup}
          compact
          title={t('DeleteFile')}
          msg={t('DeleteFileMsg')}
          loading={deleteFileLoading}
          onPositivePress={() => {
            if (selectedUserDocItem?.id) {
              deleteUserDocumentApi.mutate({
                Id: selectedUserDocItem?.id,
              });
            }
          }}
          onNegativePress={() => {
            setShowDeletePopup(false);
            setDeleteFileLoading(false);
          }}
        />
      </View>
    </SafeScreen>
  );
}

/**
 * Added by @Akshita 10-02-2025 ->  Function to generate styles dynamically
 * based on the theme (FYN-4279)
 */
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    main: {
      flex: 1,
      marginTop: 10,
    },
    skeletonLay: {
      width: '90%',
      padding: 15,
      borderRadius: theme.roundness,
      borderColor: theme.colors.surface,
      borderWidth: 1,
      marginTop: 10,
      marginHorizontal: 20,
    },
    skeletonMain: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skeletonContent: { flex: 1, gap: 10 },
    skeletonHeading: {
      width: '60%',
      height: 25,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 10,
      borderRadius: theme.roundness,
    },
    skeletonType: {
      backgroundColor: theme.colors.surface,
      width: '20%',
      height: 15,
      borderRadius: 15,
      marginTop: 10,
    },
    skeletonImg: {
      width: 80,
      height: 80,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    newsCard: {
      marginVertical: 2,
      marginHorizontal: 15,
      padding: 12,
    },

    thumbnailImg: {
      width: 90,
      height: 90,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    newsContent: {
      paddingHorizontal: 3,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 5,
    },
    flatListContainerStyle: {
      justifyContent: 'center',
      flexGrow: 1,
    },
    searchInput: {
      flex: 1,
    },
    fileTypeBox: {
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      justifyContent: 'center',
      textAlignVertical: 'center',
      paddingBottom: 3,
    },
    moreIcon: {
      height: 17,
      width: 17,
    },
    iconBgMore: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
    },
    cardWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    leftContent: {
      flex: 1,
      gap: 3,
    },
    rightContent: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    title: {
      flexShrink: 1,
    },
    fileInfoWrapper: {
      flex: 1,
      marginTop: 8,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    wrapper: {
      flexDirection: 'row',
      gap: 5,
    },
    listHeader: {
      paddingHorizontal: 13,
      paddingTop: 20,
    },
    Container: {
      flex: 1,
    },
    searchContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginHorizontal: 15,
      gap: 10,
      marginBottom: 20,
    },

    addFileBtn: {
      alignSelf: 'center',
      margin: 14,
    },
    btnView: {
      alignItems: 'center',
      justifyContent: 'center',
      alignContent: 'stretch',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness,
      padding: 0,
      marginTop: 6,
    },
  });

export default ContactVault;
