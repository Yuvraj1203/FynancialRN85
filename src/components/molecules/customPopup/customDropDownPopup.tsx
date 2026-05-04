import {
  CustomButton,
  CustomCheckBox,
  CustomFlatList,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { keyboardShouldPersistTapsType } from '@/components/atoms/customFlatList/customFlatList';
import { ImageType } from '@/components/atoms/customImage/customImage';
import CustomText, {
  TextVariants,
} from '@/components/atoms/customText/customText';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Divider, RadioButton } from 'react-native-paper';
import CustomTextInput from '../customTextInput/customTextInput';
import { InputReturnKeyType } from '../customTextInput/formTextInput';
import CustomBottomPopup from './customBottomPopup';

export enum DropdownModes {
  single = 'single',
  multiple = 'multiple',
}

type Props<T> = {
  mode?: DropdownModes;
  title?: string;
  shown?: boolean;
  setShown?: (value: boolean) => void;
  dismissOnBackPress?: boolean;
  showSearchOption?: boolean;
  items: T[];
  saveButtonText?: string;
  displayKey: keyof T;
  idKey: keyof T;
  selectedItem?: T;
  onItemSelected?: (value: T) => void;
  selectedMultipleItems?: T[];
  onMultipleItemSelected?: (value: T[]) => void;
  loading?: boolean;
  buttonLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  withPopup?: boolean;
  onSave?: (value?: T | T[]) => void;
  validationMessage?: string;
  IsValidationRequired?: boolean;
  withFixedHeight?: boolean;
};

function CustomDropDownPopup<T>({
  dismissOnBackPress = true,
  mode = DropdownModes.single,
  withPopup = true,
  showSearchOption = true,
  withFixedHeight = true,
  ...props
}: Props<T>) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [itemList, setItemList] = useState<T[]>([]);
  const [selectedItemsList, setSelectedItemsList] = useState<T[]>([]);
  const flatListRef = useRef<FlashListRef<T>>(null);

  useEffect(() => {
    setItemList([...props.items]);
  }, [props.items]);

  useEffect(() => {
    setSelectedItemsList(props.selectedMultipleItems || []);
  }, [props.selectedMultipleItems]);

  useEffect(() => {
    if (props.shown && props.selectedItem) {
      setTimeout(() => {
        flatListRef.current?.scrollToItem({
          animated: false,
          item: props.selectedItem!,
        });
      }, 500);
    }
  }, [props.shown]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setItemList(
      query.length === 0
        ? props.items
        : props.items.filter(item =>
            String(item[props.displayKey])
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
    );
  };

  const handleSingleSelection = (item: T) => {
    handleSearch('');
    props.onItemSelected?.(item);
    if (!props.onSave) {
      props.setShown?.(false);
    }
  };

  const renderDropDownItem = (item: T) => {
    return (
      <Tap
        style={styles.checkboxContainer}
        onPress={() => handleSingleSelection(item)}
      >
        <>
          <CustomText style={styles.flexOne} variant={TextVariants.bodyLarge}>
            {String(item[props.displayKey])}
          </CustomText>

          <RadioButton.Android
            style={styles.flexOne}
            value={String(item[props.idKey])}
            status={
              props.selectedItem?.[props.idKey] === item[props.idKey]
                ? 'checked'
                : 'unchecked'
            }
          />
        </>
      </Tap>
    );
  };

  const renderDropDownMultipleItems = (item: T) => {
    const isSelected = selectedItemsList.find(listItem => {
      return listItem[props.idKey] == item[props.idKey];
    });

    const handleOnPress = () => {
      var newList: T[] = [];
      if (isSelected) {
        newList = [
          ...selectedItemsList.filter(
            sItem => sItem[props.idKey] != item[props.idKey],
          ),
        ];
        setSelectedItemsList(newList);
      } else {
        newList = [...selectedItemsList, item];
        setSelectedItemsList(newList);
      }
      props.onMultipleItemSelected?.(newList);
    };
    return (
      <CustomCheckBox
        label={String(item[props.displayKey])}
        labelVariant={TextVariants.bodyLarge}
        value={isSelected ? true : false}
        color={theme.colors.primary}
        onClick={handleOnPress}
      />
    );
  };

  const renderContent = () => (
    <View style={styles.main}>
      {showSearchOption && (
        <CustomTextInput
          style={styles.searchInput}
          placeholder={t('Search')}
          showLabel={false}
          text={search}
          onChangeText={handleSearch}
          returnKeyType={InputReturnKeyType.search}
          prefixIcon={{ source: Images.search, type: ImageType.svg }}
          suffixIcon={{
            source: Images.closeCircle,
            type: ImageType.svg,
            tap: () => handleSearch(''),
          }}
        />
      )}

      {props.loading ? (
        <SkeletonList count={10} style={[styles.flatList, props.style]}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonHeading} />
            <View style={styles.skeletonOptionsItem4} />
          </View>
        </SkeletonList>
      ) : (
        <View style={props.style}>
          <View
            style={[
              withFixedHeight ? styles.flatList : styles.flatListWithoutHeight,
            ]}
          >
            <CustomFlatList
              extraData={[selectedItemsList, props.selectedItem]}
              ref={flatListRef}
              data={itemList}
              keyboardShouldPersistTaps={keyboardShouldPersistTapsType.always}
              // keyExtractor={(item, index) =>
              //   `${String(item[props.idKey])} ${index}`
              // }
              //keyExtractor={item => String(item[props.idKey])}
              ItemSeparatorComponent={Divider}
              renderItem={({ item }) =>
                mode === DropdownModes.single
                  ? renderDropDownItem(item)
                  : renderDropDownMultipleItems(item)
              }
              scrollEnabled={withFixedHeight ? true : false}
            />
          </View>

          {props.validationMessage && props.IsValidationRequired && (
            <CustomText
              variant={TextVariants.labelMedium}
              color={theme.colors.error}
              style={styles.error}
            >
              {props.validationMessage}
            </CustomText>
          )}

          {props.onSave && (
            <CustomButton
              loading={props.buttonLoading}
              style={styles.saveBtn}
              onPress={() => {
                //props.onMultipleItemSelected?.(selectedItemsList);
                if (mode === DropdownModes.multiple) {
                  props.onSave?.(selectedItemsList);
                } else {
                  props.onSave?.(props.selectedItem);
                }

                props.setShown?.(false);
              }}
            >
              {props.saveButtonText ?? t('Select')}
            </CustomButton>
          )}
        </View>
      )}
    </View>
  );

  return withPopup ? (
    <CustomBottomPopup
      shown={props.shown ?? false}
      setShown={props.setShown ? props.setShown : (value: boolean) => {}}
      dismissOnBackPress={dismissOnBackPress}
      title={props.title}
      keyboardHandle
    >
      {renderContent()}
    </CustomBottomPopup>
  ) : (
    renderContent()
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    searchInput: { marginHorizontal: 10 },
    flatList: { flex: 1, height: 300 },
    flatListWithoutHeight: { flex: 1 },
    skeletonHeader: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      marginTop: 10,
    },
    skeletonHeading: {
      backgroundColor: theme.colors.surface,
      width: '80%',
      height: 25,
      borderRadius: theme.roundness,
      marginTop: 5,
    },
    skeletonOptionsItem4: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.extraRoundness,
      width: '5%',
      height: 25,
      marginTop: 5,
      marginRight: 10,
    },
    saveBtn: {
      margin: 10,
    },
    error: {
      marginHorizontal: 12,
      marginTop: 12,
    },
    checkboxContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    flexOne: {
      flex: 1,
    },
  });

export default CustomDropDownPopup;
