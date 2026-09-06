import React from "react";

export type LanguageCode = 'en'|'as'|'bn'|'brx'|'doi'|'gu'|'kn'|'ks'|'kok'|'mai'|'ml'|'mni'|'mr'|'ne'|'or'|'pa'|'sa'|'sat'|'sd'|'ta'|'te'|'ur'|'hi';
export type LanguageInfo = {code: LanguageCode; name: string; native: string; speechCode: string};

export const LANGUAGES: LanguageInfo[] = [
  {code:'en',name:'English',native:'English',speechCode:'en-IN'},
  {code:'as',name:'Assamese',native:'অসমীয়া',speechCode:'as-IN'},
  {code:'bn',name:'Bengali',native:'বাংলা',speechCode:'bn-IN'},
  {code:'brx',name:'Bodo',native:'बड़ो',speechCode:'hi-IN'},
  {code:'doi',name:'Dogri',native:'डोगरी',speechCode:'hi-IN'},
  {code:'gu',name:'Gujarati',native:'ગુજરાતી',speechCode:'gu-IN'},
  {code:'kn',name:'Kannada',native:'ಕನ್ನಡ',speechCode:'kn-IN'},
  {code:'ks',name:'Kashmiri',native:'कॉशुर / کٲشُر',speechCode:'hi-IN'},
  {code:'kok',name:'Konkani',native:'कोंकणी',speechCode:'hi-IN'},
  {code:'mai',name:'Maithili',native:'मैथिली',speechCode:'hi-IN'},
  {code:'ml',name:'Malayalam',native:'മലയാളം',speechCode:'ml-IN'},
  {code:'mni',name:'Manipuri',native:'মৈতৈলোন্',speechCode:'hi-IN'},
  {code:'mr',name:'Marathi',native:'मराठी',speechCode:'mr-IN'},
  {code:'ne',name:'Nepali',native:'नेपाली',speechCode:'ne-NP'},
  {code:'or',name:'Odia',native:'ଓଡ଼ିଆ',speechCode:'or-IN'},
  {code:'pa',name:'Punjabi',native:'ਪੰਜਾਬੀ',speechCode:'pa-IN'},
  {code:'sa',name:'Sanskrit',native:'संस्कृतम्',speechCode:'hi-IN'},
  {code:'sat',name:'Santali',native:'ᱥᱟᱱᱛᱟᱲᱤ',speechCode:'hi-IN'},
  {code:'sd',name:'Sindhi',native:'سنڌي',speechCode:'hi-IN'},
  {code:'ta',name:'Tamil',native:'தமிழ்',speechCode:'ta-IN'},
  {code:'te',name:'Telugu',native:'తెలుగు',speechCode:'te-IN'},
  {code:'ur',name:'Urdu',native:'اردو',speechCode:'ur-IN'},
  {code:'hi',name:'Hindi',native:'हिन्दी',speechCode:'hi-IN'},
];

type Key =
  'dashboard'|'askOrca'|'marineMap'|'evidence'|'history'|'alerts'|'whatIf'|
  'profile'|'language'|'changeStakeholder'|'systemReady'|'enterOrca'|'chooseRole'|
  'location'|'useCurrentLocation'|'analyze'|'listen';

const EN: Record<Key,string> = {
  dashboard:'Dashboard',
  askOrca:'Ask ORCA',
  marineMap:'Marine Map',
  evidence:'Evidence',
  history:'History',
  alerts:'Alerts',
  whatIf:'What-If',
  profile:'Profile',
  language:'Language',
  changeStakeholder:'Change stakeholder',
  systemReady:'SYSTEM READY',
  enterOrca:'ENTER ORCA',
  chooseRole:'Choose your role',
  location:'LOCATION',
  useCurrentLocation:'USE MY CURRENT LOCATION',
  analyze:'ANALYZE WITH ORCA',
  listen:'Listen to ORCA',
};

const T: Partial<Record<LanguageCode, Partial<Record<Key,string>>>> = {
  hi:{dashboard:'डैशबोर्ड',askOrca:'ORCA से पूछें',marineMap:'समुद्री मानचित्र',evidence:'साक्ष्य',history:'इतिहास',alerts:'अलर्ट',whatIf:'क्या-अगर',profile:'प्रोफ़ाइल',language:'भाषा',changeStakeholder:'हितधारक बदलें',systemReady:'सिस्टम तैयार',enterOrca:'ORCA शुरू करें',chooseRole:'अपनी भूमिका चुनें',location:'स्थान',useCurrentLocation:'वर्तमान स्थान उपयोग करें',analyze:'ORCA से विश्लेषण करें',listen:'ORCA को सुनें'},
  or:{dashboard:'ଡ୍ୟାସବୋର୍ଡ',askOrca:'ORCA କୁ ପଚାରନ୍ତୁ',marineMap:'ସାମୁଦ୍ରିକ ମାନଚିତ୍ର',evidence:'ପ୍ରମାଣ',history:'ଇତିହାସ',alerts:'ସତର୍କତା',whatIf:'ଯଦି-ଏମିତି',profile:'ପ୍ରୋଫାଇଲ୍',language:'ଭାଷା',changeStakeholder:'ହିତଧାରକ ବଦଳାନ୍ତୁ',systemReady:'ସିଷ୍ଟମ୍ ପ୍ରସ୍ତୁତ',enterOrca:'ORCA ଆରମ୍ଭ କରନ୍ତୁ',chooseRole:'ଆପଣଙ୍କ ଭୂମିକା ବାଛନ୍ତୁ',location:'ସ୍ଥାନ',useCurrentLocation:'ବର୍ତ୍ତମାନ ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ',analyze:'ORCA ସହ ବିଶ୍ଳେଷଣ କରନ୍ତୁ',listen:'ORCA ଶୁଣନ୍ତୁ'},
  bn:{dashboard:'ড্যাশবোর্ড',askOrca:'ORCA-কে জিজ্ঞাসা করুন',marineMap:'সামুদ্রিক মানচিত্র',evidence:'প্রমাণ',history:'ইতিহাস',alerts:'সতর্কতা',whatIf:'যদি এমন হয়',profile:'প্রোফাইল',language:'ভাষা',changeStakeholder:'ভূমিকা পরিবর্তন করুন',systemReady:'সিস্টেম প্রস্তুত',enterOrca:'ORCA শুরু করুন',chooseRole:'আপনার ভূমিকা বেছে নিন',location:'অবস্থান',useCurrentLocation:'বর্তমান অবস্থান ব্যবহার করুন',analyze:'ORCA দিয়ে বিশ্লেষণ করুন',listen:'ORCA শুনুন'},
  pa:{dashboard:'ਡੈਸ਼ਬੋਰਡ',askOrca:'ORCA ਨੂੰ ਪੁੱਛੋ',marineMap:'ਸਮੁੰਦਰੀ ਨਕਸ਼ਾ',evidence:'ਸਬੂਤ',history:'ਇਤਿਹਾਸ',alerts:'ਚੇਤਾਵਨੀਆਂ',whatIf:'ਜੇਕਰ',profile:'ਪ੍ਰੋਫ਼ਾਈਲ',language:'ਭਾਸ਼ਾ',changeStakeholder:'ਹਿੱਸੇਦਾਰ ਬਦਲੋ',systemReady:'ਸਿਸਟਮ ਤਿਆਰ',enterOrca:'ORCA ਸ਼ੁਰੂ ਕਰੋ',chooseRole:'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ',location:'ਟਿਕਾਣਾ',useCurrentLocation:'ਮੌਜੂਦਾ ਟਿਕਾਣਾ ਵਰਤੋ',analyze:'ORCA ਨਾਲ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',listen:'ORCA ਸੁਣੋ'},
  gu:{dashboard:'ડેશબોર્ડ',askOrca:'ORCA ને પૂછો',marineMap:'દરિયાઈ નકશો',evidence:'પુરાવા',history:'ઇતિહાસ',alerts:'ચેતવણીઓ',whatIf:'જો આવું થાય',profile:'પ્રોફાઇલ',language:'ભાષા',changeStakeholder:'હિતધારક બદલો',systemReady:'સિસ્ટમ તૈયાર',enterOrca:'ORCA શરૂ કરો',chooseRole:'તમારી ભૂમિકા પસંદ કરો',location:'સ્થાન',useCurrentLocation:'વર્તમાન સ્થાન વાપરો',analyze:'ORCA સાથે વિશ્લેષણ કરો',listen:'ORCA સાંભળો'},
  mr:{dashboard:'डॅशबोर्ड',askOrca:'ORCA ला विचारा',marineMap:'सागरी नकाशा',evidence:'पुरावे',history:'इतिहास',alerts:'सूचना',whatIf:'जर असे झाले तर',profile:'प्रोफाइल',language:'भाषा',changeStakeholder:'हितधारक बदला',systemReady:'सिस्टम तयार',enterOrca:'ORCA सुरू करा',chooseRole:'तुमची भूमिका निवडा',location:'स्थान',useCurrentLocation:'सध्याचे स्थान वापरा',analyze:'ORCA द्वारे विश्लेषण करा',listen:'ORCA ऐका'},
  ta:{dashboard:'டாஷ்போர்டு',askOrca:'ORCA-வை கேளுங்கள்',marineMap:'கடல் வரைபடம்',evidence:'ஆதாரம்',history:'வரலாறு',alerts:'எச்சரிக்கை',whatIf:'என்றால் என்ன',profile:'சுயவிவரம்',language:'மொழி',changeStakeholder:'பங்குதாரரை மாற்று',systemReady:'அமைப்பு தயார்',enterOrca:'ORCA தொடங்கு',chooseRole:'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்',location:'இடம்',useCurrentLocation:'தற்போதைய இடத்தைப் பயன்படுத்து',analyze:'ORCA மூலம் பகுப்பாய்வு செய்',listen:'ORCA-வை கேளுங்கள்'},
  te:{dashboard:'డ్యాష్‌బోర్డ్',askOrca:'ORCAని అడగండి',marineMap:'సముద్ర పటం',evidence:'ఆధారాలు',history:'చరిత్ర',alerts:'హెచ్చరికలు',whatIf:'ఇలా అయితే',profile:'ప్రొఫైల్',language:'భాష',changeStakeholder:'స్టేక్‌హోల్డర్ మార్చండి',systemReady:'సిస్టమ్ సిద్ధంగా ఉంది',enterOrca:'ORCA ప్రారంభించండి',chooseRole:'మీ పాత్రను ఎంచుకోండి',location:'స్థానం',useCurrentLocation:'ప్రస్తుత స్థానాన్ని ఉపయోగించండి',analyze:'ORCAతో విశ్లేషించండి',listen:'ORCA వినండి'},
};

export function ui(code: LanguageCode, key: Key): string {
  return T[code]?.[key] || EN[key];
}

const storageKey = 'orca-language';

export function saveLanguage(code: LanguageCode) {
  localStorage.setItem(storageKey, code);
  window.dispatchEvent(new Event('orca-language-change'));
}

export function getSpeechLanguage(code: LanguageCode): string {
  return LANGUAGES.find((item) => item.code === code)?.speechCode || 'en-IN';
}

const KEY_ALIASES: Record<string, Key> = {
  'nav.home': 'dashboard',
  'nav.dashboard': 'dashboard',
  'nav.askOrca': 'askOrca',
  'nav.marineMap': 'marineMap',
  'nav.evidence': 'evidence',
  'nav.history': 'history',
  'nav.alerts': 'alerts',
  'nav.whatIf': 'whatIf',
  'nav.profile': 'profile',
  'nav.systemReady': 'systemReady',
  'language.select': 'language',
  'query.locationLabel': 'location',
  'query.locationButton': 'useCurrentLocation',
  'query.analyze': 'analyze',
  'query.listen': 'listen',
};

export function useOrcaLanguage() {
  const [language, setLanguage] = React.useState<LanguageCode>(() =>
    (localStorage.getItem(storageKey) as LanguageCode) || 'en'
  );

  React.useEffect(() => {
    const onLanguageChange = () => {
      setLanguage((localStorage.getItem(storageKey) as LanguageCode) || 'en');
    };

    window.addEventListener('orca-language-change', onLanguageChange);
    return () => window.removeEventListener('orca-language-change', onLanguageChange);
  }, []);

  const languageInfo = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];
  const speechLanguage = languageInfo.speechCode;

  const t = (key: string, fallback?: string): string => {
    const mapped = KEY_ALIASES[key];
    if (mapped) return ui(language, mapped);
    return fallback || key;
  };

  return { language, languageInfo, speechLanguage, t };
}
