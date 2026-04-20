import {
  DocumentPickerResponse,
  pick,
  types,
} from '@react-native-documents/picker';
import React, {Dispatch} from 'react';
import {StyleSheet} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchImageLibrary,
} from 'react-native-image-picker';
import {Menu} from 'react-native-paper';

import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {ESnackbarTypes} from '../../common/models/enums/snackbar-types';
import {ICoordinates} from '../../common/models/interfaces/coordinates';
import {IUploadFileData} from '../../common/models/interfaces/upload-file-data';
import {ISnackbarContext, useSnackbar} from '../../contexts/SnackbarProvider';

const MAX_FILE_SIZE_MB = 35;

const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface IFileUploadMenuProps {
  isMenuVisible: boolean;
  handleAttachFileMenuClose: () => void;
  menuAnchor: ICoordinates;
  setSelectedFile: Dispatch<React.SetStateAction<IUploadFileData | null>>;
}

const FileUploadMenu: React.FC<IFileUploadMenuProps> = ({
  isMenuVisible,
  handleAttachFileMenuClose,
  menuAnchor,
  setSelectedFile,
}: IFileUploadMenuProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  const {showSnackbar}: ISnackbarContext = useSnackbar();

  const handleTakeFromPhotoLibrary = async () => {
    handleAttachFileMenuClose();

    try {
      await launchImageLibrary(
        {
          mediaType: 'photo',
          selectionLimit: 1,
          includeBase64: false,
          quality: 1,
        },
        handleImagePickerResult,
      );
    } catch (e) {
      console.log('Error picking document:', e);
    }
  };

  const handleImagePickerResult = async (response: ImagePickerResponse) => {
    if (response.didCancel) return;

    if (response.errorCode) {
      showSnackbar(
        `Image picker error: ${response.errorMessage}`,
        ESnackbarTypes.Error,
      );
      return;
    }

    const assets: Asset[] = response.assets || [];
    if (assets.length > 0) {
      const image: Asset = assets[0];

      if (!image.uri || !image.type) {
        showSnackbar('Invalid file', ESnackbarTypes.Error);
        return;
      }

      if (image.fileSize && image.fileSize > MAX_FILE_SIZE_BYTES) {
        showSnackbar(
          `Max file size is ${MAX_FILE_SIZE_MB}MB`,
          ESnackbarTypes.Error,
        );
        return;
      }

      setSelectedFile({
        name: image.fileName || 'image',
        uri: image.uri,
        type: image.type,
      });
    }
  };

  const handleTakeFromDocuments = async () => {
    handleAttachFileMenuClose();

    try {
      const result: DocumentPickerResponse[] = await pick({
        allowMultiSelection: false,
        type: [types.allFiles],
        mode: 'import',
      });

      const file: DocumentPickerResponse = result[0];

      if (!file.uri || !file.type) {
        showSnackbar('Invalid file', ESnackbarTypes.Error);
        return;
      }

      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        showSnackbar(
          `Max file size is ${MAX_FILE_SIZE_MB}MB`,
          ESnackbarTypes.Error,
        );
        return;
      }

      setSelectedFile({
        name: file.name || 'file',
        uri: file.uri,
        type: file.type,
      });
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 'OPERATION_CANCELED') return;
        showSnackbar(
          `Failed to pick file: ${error.message}`,
          ESnackbarTypes.Error,
        );
      }
    }
  };

  return (
    <Menu
      visible={isMenuVisible}
      style={styles.menu}
      onDismiss={handleAttachFileMenuClose}
      anchor={menuAnchor}
      contentStyle={styles.menuContent}>
      <Menu.Item
        onPress={handleTakeFromPhotoLibrary}
        title={'Photos'}
        titleStyle={styles.menuItemText}
        style={styles.menuItem}
        leadingIcon={'image-outline'}
        dense
      />
      <Menu.Item
        onPress={handleTakeFromDocuments}
        title={'Files'}
        titleStyle={styles.menuItemText}
        style={styles.menuItem}
        leadingIcon={'file-outline'}
        dense
      />
    </Menu>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    menuContent: {
      paddingVertical: 0,
      minWidth: 120,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.onSurfaceVariant,
      borderWidth: 0.5,
      borderRadius: 10,
      elevation: 4,
      shadowColor: theme.colors.onBackground,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    menuItem: {
      height: 40,
      paddingVertical: 0,
    },
    menuItemText: {
      fontSize: 14,
      color: theme.colors.onBackground,
    },
    menu: {
      position: 'absolute',
      left: '3%',
      right: '65%',
      marginTop: -20,
    },
  });

export default React.memo(
  FileUploadMenu,
  (prevProps, nextProps) =>
    prevProps.isMenuVisible === nextProps.isMenuVisible &&
    prevProps.menuAnchor.x === nextProps.menuAnchor.x &&
    prevProps.menuAnchor.y === nextProps.menuAnchor.y,
);
