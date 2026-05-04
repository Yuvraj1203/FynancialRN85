import { viewDocument } from '@react-native-documents/viewer';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import RNFS, { DownloadResult } from 'react-native-fs';
import { ActivityIndicator, Icon, IconButton } from 'react-native-paper';
import { URL } from 'react-native-url-polyfill';

import { CustomText, Tap } from '@/components/atoms';
import CustomImage, {
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { EImageFileTypes } from '../../common/models/enums/image-file-types';
import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';
import { IUploadFileData } from '../../common/models/interfaces/upload-file-data';
import { ISnackbarContext, useSnackbar } from '../../contexts/SnackbarProvider';
import { getMimeType } from '../../utils/getFileMimeType';

interface IFileCardProps {
  selectedFile: IUploadFileData;
  handleRemoveFile?: () => void;
  isRemoveFileVisible?: boolean;
  isRemoveFileDisabled?: boolean;
}

const FileCard: React.FC<IFileCardProps> = ({
  selectedFile,
  handleRemoveFile,
  isRemoveFileVisible = true,
  isRemoveFileDisabled = false,
}: IFileCardProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  const { showSnackbar }: ISnackbarContext = useSnackbar();
  const [isFileDownloading, setFileDownloading] = useState<boolean>(false);

  const handleOpenFilePreview = async () => {
    try {
      let localPath: string = selectedFile.uri;
      console.log('file path --->', localPath);
      if (localPath.startsWith('https://')) {
        setFileDownloading(true);

        const url = new URL(localPath);
        const downloadPath = `${RNFS.TemporaryDirectoryPath}/${selectedFile.name}`;
        const exists: boolean = await RNFS.exists(downloadPath);

        if (!exists) {
          const result: DownloadResult = await RNFS.downloadFile({
            fromUrl: url.toString(),
            toFile: downloadPath,
          }).promise;

          if (result.statusCode !== 200) {
            throw new Error();
          }
        }

        localPath = `file://${RNFS.TemporaryDirectoryPath}/${encodeURIComponent(
          selectedFile.name,
        )}`;
      }

      await viewDocument({
        uri: localPath,
        mimeType: getMimeType(selectedFile.name),
      });
    } catch {
      showSnackbar('Failed to open document', ESnackbarTypes.Error);
    } finally {
      setFileDownloading(false);
    }
  };

  const getFileIcon = () => {
    if (isFileDownloading) {
      return <ActivityIndicator />;
    }

    const isImage: boolean =
      selectedFile &&
      Object.values(EImageFileTypes).some(type =>
        selectedFile.type.includes(type),
      );

    if (isImage) {
      return (
        <CustomImage
          source={{ uri: selectedFile.uri }}
          style={styles.previewImage}
          resizeMode={ResizeModeType.cover}
        />
      );
    }

    return (
      <Icon
        color={theme.colors.onSurfaceVariant}
        source={'file-document-outline'}
        size={20}
      />
    );
  };

  return (
    <View style={(styles.previewContainer, { display: 'none' })}>
      <Tap style={styles.touchableContainer} onPress={handleOpenFilePreview}>
        <View style={styles.containerUploadedFile}>
          {getFileIcon()}
          <CustomText style={styles.previewText} maxLines={1}>
            {selectedFile.name}
          </CustomText>
        </View>
        {/* <TouchableOpacity
        style={styles.touchableContainer}
        onPress={handleOpenFilePreview}>
        {getFileIcon()}
        <Text style={styles.previewText} numberOfLines={1}>
          {selectedFile.name}
        </Text>
      </TouchableOpacity> */}
      </Tap>
      {isRemoveFileVisible && (
        <IconButton
          onPress={handleRemoveFile}
          style={styles.removeButton}
          icon={'close'}
          size={20}
          disabled={isRemoveFileDisabled}
        />
      )}
    </View>
  );
};
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    previewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background,
      padding: 6,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderStyle: 'dashed',
      borderColor: theme.colors.onBackground,
      height: 40,
    },
    containerUploadedFile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    touchableContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: '80%',
      paddingVertical: 0,
    },
    previewText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      flexWrap: 'wrap',
      marginLeft: 8,
    },
    removeButton: {
      marginVertical: 0,
      marginHorizontal: 0,
      color: theme.colors.onSurfaceVariant,
    },
    previewImage: {
      width: 30,
      height: 30,
      marginRight: 6,
      borderRadius: theme.roundness,
    },
  });

export default FileCard;
