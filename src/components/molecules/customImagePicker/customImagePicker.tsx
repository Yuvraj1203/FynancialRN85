import { ImageType } from '@/components/atoms/customImage/customImage';
import { SelectResourcePopup } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { DocumentDetails } from '@/services/models/getListOfDocumentsForFeedModel/getListOfDocumentsForFeedModel';
import { useLogoutStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { generateUniqueFilename } from '@/utils/fileDownloadUtils';
import Log from '@/utils/logger';
import {
  openAppSettings,
  requestPermission,
  showSnackbar,
} from '@/utils/utils';
import { keepLocalCopy, pick, types } from '@react-native-documents/picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {
  Asset,
  ImageLibraryOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import CustomActionSheetPoup from '../customPopup/customActionSheetPopup';

export type Props = {
  showPopup: boolean;
  setShowPopup: (value: boolean) => void;
  selectionLimit?: number;
  crop?: boolean;
  cropHeight?: number;
  cropWidth?: number;
  showFile?: boolean;
  showAllFile?: boolean;
  showResource?: boolean;
  mediaList?: (value: Asset[]) => void;
  onClose?: () => void;
  //resourceList?: (value: DocumentDetails[]) => void;
  initialMediaList?: Asset[];
  initialResourceList?: DocumentDetails[];
  onResourceListChange?: (value: DocumentDetails[]) => void;
  selectOneItemAtATime?: boolean; //toggle validation that enforces choosing only ONE of image/pdf/resource at a time
  IsManualCrop?: boolean; // NEW - controls whether to skip automatic cropping
};

// ✅ EXPORT this function — place it outside your component file (bottom or top)
export const openImageCropperManual = async (
  uri: string,
  callback?: (asset: Asset) => void,
  cropWidth?: number,
  cropHeight?: number,
) => {
  try {
    Image.getSize(
      uri,
      async (origW, origH) => {
        const cropped = await ImagePicker.openCropper({
          mediaType: 'photo',
          path: uri,
          includeBase64: true,
          compressImageQuality: 1,
          compressImageMaxWidth: origW,
          compressImageMaxHeight: origH,
          ...(cropWidth
            ? { width: cropWidth }
            : { width: Platform.OS == 'ios' ? origW : undefined }),
          ...(cropHeight
            ? { height: cropHeight }
            : { height: Platform.OS == 'ios' ? origH : undefined }),
          forceJpg: true,
          cropperCircleOverlay: false,
          freeStyleCropEnabled: cropWidth && cropHeight ? false : true,
          hideBottomControls: false,
          enableRotationGesture: true,
          cropperToolbarTitle: 'Crop Image',
        });

        const asset: Asset = {
          fileName: cropped.filename ?? `img_${Date.now()}.jpg`,
          uri: cropped.path,
          base64: cropped.data ?? undefined,
          width: cropped.width,
          height: cropped.height,
          fileSize: cropped.size,
          type: cropped.mime,
          timestamp: cropped.creationDate,
          id: cropped.filename ?? `img_${Date.now()}`,
        };

        callback?.(asset);
      },
      error => {
        Log('Image.getSize failed:' + error);
        //showSnackbar('Some error occurred');
      },
    );
  } catch (e) {
    Log('Manual cropper error:' + JSON.stringify(e));
  }
};

const CustomImagePicker = ({
  selectionLimit = 1,
  selectOneItemAtATime = false,
  IsManualCrop = false,
  ...props
}: Props) => {
  const theme = useTheme(); // theme
  const styles = makeStyles(theme); // styling
  const { t } = useTranslation(); // translations
  // at top of the component
  const [selectedAssetsState, setSelectedAssetsState] = useState<Asset[]>([]);

  const [showResourceSelector, setShowResourceSelector] = useState(false);
  const [resourceListState, setResourceListState] = useState<DocumentDetails[]>(
    [],
  );

  const [originalUri, setOriginalUri] = useState<string | null>(null);

  // mirror incoming array into our local state
  useEffect(() => {
    setResourceListState(props.initialResourceList || []);
  }, [props.initialResourceList]);

  useEffect(() => {
    // whenever parent’s mediaList changes we re-sync
    setSelectedAssetsState(props.initialMediaList ?? []);
  }, [props.initialMediaList]);

  // 1) At the top, after you sync props → state, compute three booleans:
  const hasResource = resourceListState.length > 0;

  // look at each Asset’s MIME to distinguish “real” images vs. PDFs
  const hasImage = selectedAssetsState.some(a => a.type?.startsWith('image/'));
  const hasPdf = selectedAssetsState.some(a => a.type === 'application/pdf');

  // Derived blocks (only when flag ON)
  const blockImageActions = selectOneItemAtATime && (hasPdf || hasResource);
  const blockFileActions = selectOneItemAtATime && (hasImage || hasResource);
  const blockResourceActions = selectOneItemAtATime && (hasImage || hasPdf);

  const handleResourceSelection = (docs?: DocumentDetails[]) => {
    if (docs) {
      setResourceListState(docs);
      props.onResourceListChange?.(docs);
    }
    setShowResourceSelector(false);
  };

  // 🔹 NEW FUNCTION - manually open cropper later from any screen (like chat)
  const openImageCropperManual = async (
    uri: string,
    callback?: (asset: Asset) => void,
  ) => {
    try {
      const { cropHeight, cropWidth } = props;
      Image.getSize(
        uri,
        async (origW, origH) => {
          const cropped = await ImagePicker.openCropper({
            mediaType: 'photo',
            path: uri,
            includeBase64: true,
            compressImageQuality: 1,
            compressImageMaxWidth: origW,
            compressImageMaxHeight: origH,
            ...(cropWidth ? { width: cropWidth } : { width: origW }),
            ...(cropHeight ? { height: cropHeight } : { height: origH }),
            forceJpg: true,
            cropperCircleOverlay: false,
            freeStyleCropEnabled: cropWidth && cropHeight ? false : true,
            hideBottomControls: false,
            enableRotationGesture: true,
            cropperToolbarTitle: 'Crop Image',
          });

          const asset: Asset = {
            fileName: cropped.filename ?? `img_${Date.now()}.jpg`,
            uri: cropped.path,
            base64: cropped.data ?? undefined,
            width: cropped.width,
            height: cropped.height,
            fileSize: cropped.size,
            type: cropped.mime,
            timestamp: cropped.creationDate,
            id: cropped.filename,
          };

          callback?.(asset);
        },
        error => {
          Log('Image.getSize failed:' + error);
          showSnackbar('Some error occurred');
        },
      );
    } catch (e) {
      Log('Manual cropper error:' + JSON.stringify(e));
    }
  };

  const handleMediaSelection = async (
    type: 'camera' | 'gallery' | 'pdf' | 'file' | 'resource',
  ) => {
    props.setShowPopup(false);

    const returnWithType = (assets: Asset[]) => {
      let limitedAsset;
      const errorMessage: string[] = [];
      if (type == 'camera' || type == 'gallery') {
        limitedAsset = assets.filter(item => {
          if (item.fileSize! > 10485760) {
            errorMessage.push(t('MaxSize10'));
            return false;
          } else {
            return true;
          }
        });
      } else {
        limitedAsset = assets.filter(item => {
          if (item.fileSize! > 20971520) {
            errorMessage.push(t('MaxSize20'));
            return false;
          } else {
            return true;
          }
        });
      }
      if (errorMessage.length > 0) {
        showSnackbar(errorMessage[0], 'danger');
      }
      if (limitedAsset.length == 0) return;
      setSelectedAssetsState(limitedAsset);
      props.mediaList?.(
        limitedAsset.map(asset => ({
          ...asset,
          typeSelected: type, // Injecting type origin
        })),
      );
    };

    const imageOptions: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: true,
      selectionLimit: selectionLimit,
    };
    const imageCallback = async (response: {
      didCancel?: boolean;
      errorCode?: string;
      assets?: Asset[];
    }) => {
      if (response.didCancel) {
        Log('User cancelled media picker');
      } else if (response.errorCode) {
        Log('Media Picker Error: ' + response.errorCode);
        showSnackbar(t('SomeErrorOccured'));
      } else if (response.assets && response.assets.length > 0) {
        if (selectionLimit === 1 && props.crop && response.assets?.[0]?.uri) {
          setTimeout(() => {
            const tempOriginalUri = response.assets?.[0].uri!;
            setOriginalUri(tempOriginalUri); // ✅ save it globally for later use

            Log(
              'selected image data :  ' + JSON.stringify(response.assets?.[0]),
            );

            if (IsManualCrop) {
              Log('Manual crop mode enabled — skipping auto crop.');
              returnWithType([
                {
                  ...response.assets?.[0],
                  uri: tempOriginalUri,
                  id: response.assets?.[0].fileName ?? `img_${Date.now()}.jpg`,
                },
              ]);
              return;
            }

            // Measure the original image’s dimensions before cropping
            Image.getSize(
              tempOriginalUri,
              (origW, origH) => {
                useLogoutStore.getState().setIsLoggingOut(true);
                ImagePicker.openCropper({
                  mediaType: 'photo',
                  path: response.assets?.at(0)?.uri!,
                  includeBase64: true,
                  compressImageQuality: 1,
                  compressImageMaxWidth: origW,
                  compressImageMaxHeight: origH,
                  ...(props.cropWidth
                    ? { width: props.cropWidth }
                    : { width: origW }),
                  ...(props.cropHeight
                    ? { height: props.cropHeight }
                    : { height: origH }),
                  forceJpg: true,
                  cropperCircleOverlay: false,
                  freeStyleCropEnabled:
                    props.cropWidth && props.cropHeight ? false : true,
                  hideBottomControls: false,
                  enableRotationGesture: true,
                  cropperToolbarTitle: 'Crop Image',
                })
                  .then(cropped => {
                    Log('cropped image data :::::  ' + JSON.stringify(cropped));

                    returnWithType([
                      {
                        fileName: cropped.filename ?? `img_${Date.now()}.jpg`,
                        uri: cropped.path,
                        base64: cropped.data ?? undefined,
                        width: cropped.width,
                        height: cropped.height,
                        fileSize: cropped.size,
                        type: cropped.mime,
                        timestamp: cropped.creationDate,
                        id: cropped.filename,
                      },
                    ]);
                  })
                  .finally(() => {
                    useLogoutStore.getState().setIsLoggingOut(false);
                  });
              },
              error => {
                Log('Image.getSize failed:' + error);
                showSnackbar(t('SomeErrorOccured'));
              },
            );
          }, 500);
        } else {
          returnWithType(response.assets);
        }
      }
    };

    setTimeout(async () => {
      if (type === 'gallery') {
        await launchImageLibrary(imageOptions, imageCallback);
      } else if (type === 'camera') {
        useLogoutStore.getState().setIsLoggingOut(true);
        await requestPermission('camera')
          .then(async value => {
            if (value) {
              await launchCamera(imageOptions, imageCallback); // Use camera
            } else {
              showAlertPopup({
                title: t('PermissionDenied'),
                msg: t('CameraPermissionDenied'),
                PositiveText: t('Allow'),
                NegativeText: t('Cancel'),
                onPositivePress: () => {
                  openAppSettings();
                },
              });
            }
          })
          .finally(() => {
            useLogoutStore.getState().setIsLoggingOut(false);
          });
      } else if (type === 'pdf') {
        await pick({
          type: [types.pdf],
        })
          .then(async res => {
            if (res && res.length > 0) {
              const selectedFile = res[0];

              const [copyResult] = await keepLocalCopy({
                files: [
                  {
                    uri: selectedFile.uri,
                    fileName: selectedFile.name
                      ? selectedFile.name
                      : generateUniqueFilename('pdf'),
                  },
                ],
                destination: 'documentDirectory',
              });
              if (copyResult.status === 'success') {
                // do something with the local copy:

                const fileAsset: Asset = {
                  fileName: selectedFile.name ? selectedFile.name : undefined,
                  uri: copyResult.localUri ?? '',
                  type: selectedFile.type ?? undefined,
                  fileSize: selectedFile.size ?? undefined,
                };
                returnWithType([fileAsset]);
              }
            }
          })
          .catch(error => {
            Log('File Picker Error=>' + JSON.stringify(error));
            //showSnackbar(t('SomeErrorOccured'));
          });
      } else if (type === 'file') {
        await pick({
          type: [
            types.xlsx,
            types.doc,
            types.pdf,
            types.docx,
            types.xls,
            types.images,
          ],
          allowMultiSelection: true,
        })
          .then(async res => {
            if (res && res.length > 0) {
              type FileToCopy = {
                uri: string;
                fileName: string;
              };
              // prepare files for local copy
              const filesToCopy: [FileToCopy, ...FileToCopy[]] = res.map(f => ({
                uri: f.uri,
                fileName: f.name ? f.name : generateUniqueFilename('file'),
              })) as [FileToCopy, ...FileToCopy[]];

              // copy them locally
              const copyResults = await keepLocalCopy({
                files: filesToCopy,
                destination: 'documentDirectory',
              });

              // build Asset[] out of results
              const fileAssets: Asset[] = copyResults
                .filter(cr => cr.status === 'success')
                .map((cr, i) => ({
                  fileName: res[i].name ? res[i].name : undefined,
                  uri: cr.localUri ?? '',
                  type: res[i].type ?? undefined,
                  fileSize: res[i].size ?? undefined,
                  id: res[i].name ?? `${Date.now()}-${i}`, // give unique id if needed
                }));

              if (fileAssets.length > 0) {
                returnWithType(fileAssets);
              }
            }
          })
          .catch(error => {
            Log('File Picker Error=>' + JSON.stringify(error));
            // showSnackbar(t('SomeErrorOccured'));
          });
      } else if (type === 'resource') {
        setShowResourceSelector(true);
        return;
      }
    }, 200);
  };

  return (
    <>
      <CustomActionSheetPoup
        shown={props.showPopup}
        setShown={props.setShowPopup}
        centered={false}
        hideIcons={false}
        onCancelClick={props.onClose}
        children={[
          {
            title: t('UploadImage'),
            image: Images.gallery,
            imageType: ImageType.svg,
            onPress: () => {
              if (blockImageActions) return; // NEW
              handleMediaSelection('gallery');
            },
            titleColor: blockImageActions
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onSurfaceVariant,
            imageColor: blockImageActions
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onSurfaceVariant,
          },
          {
            title: t('OpenCamera'),
            image: Images.camera,
            imageType: ImageType.svg,
            onPress: () => {
              if (blockImageActions) return;
              handleMediaSelection('camera');
            },
            titleColor: blockImageActions
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onSurfaceVariant,
            imageColor: blockImageActions
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onSurfaceVariant,
          },
          ...(props.showFile
            ? [
                {
                  title: t('UploadFile'),
                  image: Images.file,
                  imageType: ImageType.svg,
                  onPress: () => {
                    if (blockFileActions) return;
                    handleMediaSelection('pdf');
                  },
                  titleColor: blockFileActions
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                  imageColor: blockFileActions
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                },
              ]
            : []),
          ...(props.showAllFile
            ? [
                {
                  title: t('UploadAllFile'),
                  image: Images.file,
                  imageType: ImageType.svg,
                  onPress: () => {
                    if (blockFileActions) return;
                    handleMediaSelection('file');
                  },
                  titleColor: blockFileActions
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                  imageColor: blockFileActions
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                },
              ]
            : []),
          ...(props.showResource
            ? [
                {
                  title: t('LinkResource'),
                  image: Images.linkResource,
                  imageType: ImageType.svg,
                  onPress: () => {
                    if (blockResourceActions) return;
                    handleMediaSelection('resource');
                  },

                  titleColor: blockResourceActions
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                  imageColor: blockResourceActions
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                },
              ]
            : []),
        ]}
      />

      <SelectResourcePopup
        shown={showResourceSelector}
        setShown={setShowResourceSelector}
        initialSelectedDocs={resourceListState}
        onSelection={handleResourceSelection}
      />
    </>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    emptyLay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIcon: { height: 50, width: 50 },
    emptyLabel: { marginTop: 10 },
  });

export default CustomImagePicker;
