import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import * as en from './en.json';
import * as hi from './hi.json';

import deepmerge from 'deepmerge';
import * as enTenant from './tenantTranslations/en.json';
import * as hiTenant from './tenantTranslations/hi.json';

const resources = {
  en: { translation: deepmerge(en, enTenant) },
  hi: { translation: deepmerge(hi, hiTenant) },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
  compatibilityJSON: 'v4',
});

export default i18n;
