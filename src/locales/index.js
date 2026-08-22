import en from './en.json';
import ar from './ar.json';
import ph from './ph.json';
import ma from './ma.json';
import es from './es.json';
import ru from './ru.json';
import zh from './zh.json';
import vi from './vi.json';
import id from './id.json';

export const translations = {
  en,
  ar,
  ph,
  ma,
  es,
  ru,
  zh,
  vi,
  id,
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
