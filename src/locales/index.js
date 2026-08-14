import en from './en.json';
import ar from './ar.json';
import ph from './ph.json';

export const translations = {
  en,
  ar,
  ph,
};

export const getTranslation = (lang, key, fallback = '') => {
  const currentDict = translations[lang] || translations.en;
  if (!key) return fallback;
  
  const keys = key.split('.');
  let result = currentDict;
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      // fallback to English if key is missing in chosen language
      let enResult = translations.en;
      for (const ek of keys) {
        if (enResult && typeof enResult === 'object' && ek in enResult) {
          enResult = enResult[ek];
        } else {
          return fallback || key;
        }
      }
      return enResult || fallback || key;
    }
  }
  
  return result || fallback || key;
};
