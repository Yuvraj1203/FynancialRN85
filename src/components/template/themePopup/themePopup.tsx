import { CustomDropDownPopup } from '@/components/molecules';
import { ThemeModel } from '@/services/models';
import { appThemeStore } from '@/store';
import { ThemeVariants } from '@/store/themeStore/themeStore';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export let showThemePopup: () => void;

function ThemePopup() {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const [showPopup, setShowPopup] = useState(false); // show global popup

  const themeStore = appThemeStore(); // theme store

  const themeList: ThemeModel[] = [
    {
      id: ThemeVariants.light,
      theme: t('Light'),
    },
    { id: ThemeVariants.dark, theme: t('Dark') },
    { id: ThemeVariants.system, theme: t('System') },
  ];

  const [selectedTheme, setSelectedTheme] = useState(
    themeList.find(item => item.id == themeStore.AppTheme),
  );

  useEffect(() => {
    showThemePopup = () => {
      setShowPopup(true);
    };
  }, []);

  return (
    <>
      <CustomDropDownPopup
        shown={showPopup}
        setShown={setShowPopup}
        title={t('Theme')}
        items={themeList}
        displayKey="theme"
        idKey="id"
        selectedItem={selectedTheme}
        showSearchOption={false}
        onItemSelected={value => {
          setSelectedTheme(value);
          themeStore.changeAppTheme(value.id);
        }}
      />
    </>
  );
}

const makeStyles = (theme: CustomTheme) => StyleSheet.create({});

export default ThemePopup;
