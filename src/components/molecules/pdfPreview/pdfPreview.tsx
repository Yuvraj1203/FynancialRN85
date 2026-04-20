// PdfPreview.tsx
import {CustomText} from '@/components/atoms';
import {Direction} from '@/components/atoms/customButton/customButton';
import {TextVariants} from '@/components/atoms/customText/customText';
import {showImagePopup} from '@/components/template/imagePopup/imagePopup';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Pdf from 'react-native-pdf';

interface PdfPreviewProps {
  pdfUrl: string | undefined;
  style?: StyleProp<ViewStyle>;
  enablePaging?: boolean;
  defaultIndex?: number;
  singlePage?: boolean;
  pageNoDirection?: Direction;
  openLinks?: (url: string) => void;
  showPageNumber?: boolean;
}

const PdfPreview = ({
  defaultIndex = 1,
  pageNoDirection = Direction.right,
  showPageNumber = true,
  ...props
}: PdfPreviewProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const {t} = useTranslation(); //translation

  const [error, setError] = useState<object>();

  const [pageNo, setPageNo] = useState<number>(1);

  const [totalPageNo, setTotalPageNo] = useState<number>(1);

  // Define PDF source – adjust trustAllCerts/cache as needed.
  const source = {trustAllCerts: false, uri: props.pdfUrl, cache: true};

  return (
    <View style={[styles.main, props.style]}>
      {error ? (
        <View style={styles.errorLay}>
          <CustomText variant={TextVariants.bodyLarge} color={theme.colors.red}>
            {t('ErrorPdf')}
          </CustomText>
        </View>
      ) : (
        <View style={styles.pdf}>
          <Pdf
            trustAllCerts={false}
            horizontal
            source={source}
            page={defaultIndex}
            singlePage={props.singlePage}
            enablePaging={props.enablePaging}
            showsHorizontalScrollIndicator
            onPageChanged={(page, numberOfPages) => {
              setPageNo(page);
              setTotalPageNo(numberOfPages);
            }}
            onPressLink={url => {
              props.openLinks?.(url);
            }}
            onPageSingleTap={() => {
              showImagePopup({pdfUrl: source.uri, defaultIndex: pageNo});
            }}
            style={styles.pdf}
          />
          {showPageNumber && (
            <View
              style={[
                styles.pageLay,
                pageNoDirection == Direction.left ? {left: 10} : {right: 10},
              ]}>
              <CustomText>{`${t(
                'Page',
              )} ${pageNo} / ${totalPageNo}`}</CustomText>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      width: '100%',
      height: 300,
    },
    pdf: {
      flex: 1,
      //backgroundColor: theme.colors.surface,
    },
    errorLay: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
    },
    pageLay: {
      position: 'absolute',
      bottom: 10,
      backgroundColor: theme.colors.border,
      borderRadius: theme.roundness,
      paddingHorizontal: 10,
      paddingVertical: 5,
      justifyContent: 'center',
      alignContent: 'center',
    },
  });

export default PdfPreview;
