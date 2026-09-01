import React, { createContext, useContext, useState } from 'react';

type Lang = 'en' | 'bn';

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    'nav.scholarships': 'Scholarship Finder',
    'nav.universities': 'Universities',
    'nav.applications': 'Applications',
    'nav.budget': 'Budget Planner',
    'nav.visa': 'Visa Guide',
    'nav.profile': 'Profile',
    'common.loading': 'Loading...',
    'common.search': 'Search',
  },
  bn: {
    'nav.scholarships': 'বৃত্তি অনুসন্ধান',
    'nav.universities': 'বিশ্ববিদ্যালয়',
    'nav.applications': 'আবেদন',
    'nav.budget': 'বাজেট পরিকল্পনা',
    'nav.visa': 'ভিসা গাইড',
    'nav.profile': 'প্রোফাইল',
    'common.loading': 'লোড হচ্ছে...',
    'common.search': 'অনুসন্ধান',
  }
};

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string } | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('scholarpath_lang') as Lang) || 'en');
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('scholarpath_lang', l); };
  const t = (k: string) => STRINGS[lang][k] || STRINGS.en[k] || k;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
