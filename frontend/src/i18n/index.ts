import React from "react";

export type LanguageCode = 'en'|'as'|'bn'|'brx'|'doi'|'gu'|'kn'|'ks'|'kok'|'mai'|'ml'|'mni'|'mr'|'ne'|'or'|'pa'|'sa'|'sat'|'sd'|'ta'|'te'|'ur'|'hi';
export type LanguageInfo = {code: LanguageCode; name:string; native:string; speechCode:string};
export const LANGUAGES: LanguageInfo[] = [
{code:'en',name:'English',native:'English',speechCode:'en-IN'},
{code:'as',name:'Assamese',native:'অসমীয়া',speechCode:'as-IN'},
{code:'bn',name:'Bengali',native:'বাংলা',speechCode:'bn-IN'},
{code:'brx',name:'Bodo',native:'बड़ो',speechCode:'brx-IN'},
{code:'doi',name:'Dogri',native:'डोगरी',speechCode:'doi-IN'},
{code:'gu',name:'Gujarati',native:'ગુજરાતી',speechCode:'gu-IN'},
{code:'kn',name:'Kannada',native:'ಕನ್ನಡ',speechCode:'kn-IN'},
{code:'ks',name:'Kashmiri',native:'कॉशुर / کٲشُر',speechCode:'ks-IN'},
{code:'kok',name:'Konkani',native:'कोंकणी',speechCode:'kok-IN'},
{code:'mai',name:'Maithili',native:'मैथिली',speechCode:'mai-IN'},
{code:'ml',name:'Malayalam',native:'മലയാളം',speechCode:'ml-IN'},
{code:'mni',name:'Manipuri',native:'মৈতৈলোন্',speechCode:'mni-IN'},
{code:'mr',name:'Marathi',native:'मराठी',speechCode:'mr-IN'},
{code:'ne',name:'Nepali',native:'नेपाली',speechCode:'ne-NP'},
{code:'or',name:'Odia',native:'ଓଡ଼ିଆ',speechCode:'or-IN'},
{code:'pa',name:'Punjabi',native:'ਪੰਜਾਬੀ',speechCode:'pa-IN'},
{code:'sa',name:'Sanskrit',native:'संस्कृतम्',speechCode:'sa-IN'},
{code:'sat',name:'Santali',native:'ᱥᱟᱱᱛᱟᱲᱤ',speechCode:'sat-IN'},
{code:'sd',name:'Sindhi',native:'سنڌي',speechCode:'sd-IN'},
{code:'ta',name:'Tamil',native:'தமிழ்',speechCode:'ta-IN'},
{code:'te',name:'Telugu',native:'తెలుగు',speechCode:'te-IN'},
{code:'ur',name:'Urdu',native:'اردو',speechCode:'ur-IN'},
{code:'hi',name:'Hindi',native:'हिन्दी',speechCode:'hi-IN'}
];

type Key = 'dashboard'|'askOrca'|'marineMap'|'evidence'|'history'|'alerts'|'whatIf'|'profile'|'language'|'changeStakeholder'|'systemReady'|'enterOrca'|'chooseRole'|'location'|'useCurrentLocation'|'analyze'|'listen';
const EN: Record<Key,string> = {dashboard:'Dashboard',askOrca:'Ask ORCA',marineMap:'Marine Map',evidence:'Evidence',history:'History',alerts:'Alerts',whatIf:'What-If',profile:'Profile',language:'Language',changeStakeholder:'Change stakeholder',systemReady:'SYSTEM READY',enterOrca:'ENTER ORCA',chooseRole:'Choose your role',location:'LOCATION',useCurrentLocation:'USE MY CURRENT LOCATION',analyze:'ANALYZE WITH ORCA',listen:'Listen to ORCA'};

const T: Partial<Record<LanguageCode, Partial<Record<Key,string>>>> = {
hi:{dashboard:'डैशबोर्ड',askOrca:'ORCA से पूछें',marineMap:'समुद्री मानचित्र',evidence:'साक्ष्य',history:'इतिहास',alerts:'अलर्ट',whatIf:'क्या-अगर',profile:'प्रोफ़ाइल',language:'भाषा',changeStakeholder:'हितधारक बदलें',systemReady:'सिस्टम तैयार',enterOrca:'ORCA शुरू करें',chooseRole:'अपनी भूमिका चुनें',location:'स्थान',useCurrentLocation:'वर्तमान स्थान उपयोग करें',analyze:'ORCA से विश्लेषण करें',listen:'ORCA को सुनें'},
or:{dashboard:'ଡ୍ୟାସବୋର୍ଡ',askOrca:'ORCA କୁ ପଚାରନ୍ତୁ',marineMap:'ସାମୁଦ୍ରିକ ମାନଚିତ୍ର',evidence:'ପ୍ରମାଣ',history:'ଇତିହାସ',alerts:'ସତର୍କତା',whatIf:'ଯଦି-ଏମିତି',profile:'ପ୍ରୋଫାଇଲ୍',language:'ଭାଷା',changeStakeholder:'ହିତଧାରକ ବଦଳାନ୍ତୁ',systemReady:'ସିଷ୍ଟମ୍ ପ୍ରସ୍ତୁତ',enterOrca:'ORCA ଆରମ୍ଭ କରନ୍ତୁ',chooseRole:'ଆପଣଙ୍କ ଭୂମିକା ବାଛନ୍ତୁ',location:'ସ୍ଥାନ',useCurrentLocation:'ବର୍ତ୍ତମାନ ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ',analyze:'ORCA ସହ ବିଶ୍ଳେଷଣ କରନ୍ତୁ',listen:'ORCA ଶୁଣନ୍ତୁ'},
bn:{dashboard:'ড্যাশবোর্ড',askOrca:'ORCA-কে জিজ্ঞাসা করুন',marineMap:'সামুদ্রিক মানচিত্র',evidence:'প্রমাণ',history:'ইতিহাস',alerts:'সতর্কতা',whatIf:'যদি এমন হয়',profile:'প্রোফাইল',language:'ভাষা',changeStakeholder:'ভূমিকা পরিবর্তন করুন',systemReady:'সিস্টেম প্রস্তুত',enterOrca:'ORCA শুরু করুন',chooseRole:'আপনার ভূমিকা বেছে নিন',location:'অবস্থান',useCurrentLocation:'বর্তমান অবস্থান ব্যবহার করুন',analyze:'ORCA দিয়ে বিশ্লেষণ করুন',listen:'ORCA শুনুন'},
pa:{dashboard:'ਡੈਸ਼ਬੋਰਡ',askOrca:'ORCA ਨੂੰ ਪੁੱਛੋ',marineMap:'ਸਮੁੰਦਰੀ ਨਕਸ਼ਾ',evidence:'ਸਬੂਤ',history:'ਇਤਿਹਾਸ',alerts:'ਚੇਤਾਵਨੀਆਂ',whatIf:'ਜੇਕਰ',profile:'ਪ੍ਰੋਫ਼ਾਈਲ',language:'ਭਾਸ਼ਾ',changeStakeholder:'ਹਿੱਸੇਦਾਰ ਬਦਲੋ',systemReady:'ਸਿਸਟਮ ਤਿਆਰ',enterOrca:'ORCA ਸ਼ੁਰੂ ਕਰੋ',chooseRole:'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ',location:'ਟਿਕਾਣਾ',useCurrentLocation:'ਮੌਜੂਦਾ ਟਿਕਾਣਾ ਵਰਤੋ',analyze:'ORCA ਨਾਲ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',listen:'ORCA ਸੁਣੋ'},
gu:{dashboard:'ડેશબોર્ડ',askOrca:'ORCA ને પૂછો',marineMap:'દરિયાઈ નકશો',evidence:'પુરાવા',history:'ઇતિહાસ',alerts:'ચેતવણીઓ',whatIf:'જો આવું થાય',profile:'પ્રોફાઇલ',language:'ભાષા',changeStakeholder:'હિતધારક બદલો',systemReady:'સિસ્ટમ તૈયાર',enterOrca:'ORCA શરૂ કરો',chooseRole:'તમારી ભૂમિકા પસંદ કરો',location:'સ્થાન',useCurrentLocation:'વર્તમાન સ્થાન વાપરો',analyze:'ORCA સાથે વિશ્લેષણ કરો',listen:'ORCA સાંભળો'},
mr:{dashboard:'डॅशबोर्ड',askOrca:'ORCA ला विचारा',marineMap:'सागरी नकाशा',evidence:'पुरावे',history:'इतिहास',alerts:'सूचना',whatIf:'जर असे झाले तर',profile:'प्रोफाइल',language:'भाषा',changeStakeholder:'हितधारक बदला',systemReady:'सिस्टम तयार',enterOrca:'ORCA सुरू करा',chooseRole:'तुमची भूमिका निवडा',location:'स्थान',useCurrentLocation:'सध्याचे स्थान वापरा',analyze:'ORCA द्वारे विश्लेषण करा',listen:'ORCA ऐका'},
ta:{dashboard:'டாஷ்போர்டு',askOrca:'ORCA-வை கேளுங்கள்',marineMap:'கடல் வரைபடம்',evidence:'ஆதாரம்',history:'வரலாறு',alerts:'எச்சரிக்கைகள்',whatIf:'என்றால் என்ன',profile:'சுயவிவரம்',language:'மொழி',changeStakeholder:'பங்குதாரரை மாற்று',systemReady:'அமைப்பு தயார்',enterOrca:'ORCA தொடங்கு',chooseRole:'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்',location:'இடம்',useCurrentLocation:'தற்போதைய இடத்தைப் பயன்படுத்து',analyze:'ORCA மூலம் பகுப்பாய்வு செய்',listen:'ORCA-வை கேளுங்கள்'},
te:{dashboard:'డ్యాష్‌బోర్డ్',askOrca:'ORCAని అడగండి',marineMap:'సముద్ర పటం',evidence:'ఆధారాలు',history:'చరిత్ర',alerts:'హెచ్చరికలు',whatIf:'ఇలా అయితే',profile:'ప్రొఫైల్',language:'భాష',changeStakeholder:'స్టేక్‌హోల్డర్ మార్చండి',systemReady:'సిస్టమ్ సిద్ధంగా ఉంది',enterOrca:'ORCA ప్రారంభించండి',chooseRole:'మీ పాత్రను ఎంచుకోండి',location:'స్థానం',useCurrentLocation:'ప్రస్తుత స్థానాన్ని ఉపయోగించండి',analyze:'ORCAతో విశ్లేషించండి',listen:'ORCA వినండి'},
kn:{dashboard:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',askOrca:'ORCAಗೆ ಕೇಳಿ',marineMap:'ಸಮುದ್ರ ನಕ್ಷೆ',evidence:'ಸಾಕ್ಷ್ಯ',history:'ಇತಿಹಾಸ',alerts:'ಎಚ್ಚರಿಕೆಗಳು',whatIf:'ಹೀಗೆ ಆದರೆ',profile:'ಪ್ರೊಫೈಲ್',language:'ಭಾಷೆ',changeStakeholder:'ಪಾಲುದಾರರನ್ನು ಬದಲಿಸಿ',systemReady:'ಸಿಸ್ಟಮ್ ಸಿದ್ಧವಾಗಿದೆ',enterOrca:'ORCA ಪ್ರಾರಂಭಿಸಿ',chooseRole:'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',location:'ಸ್ಥಳ',useCurrentLocation:'ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ',analyze:'ORCA ಮೂಲಕ ವಿಶ್ಲೇಷಿಸಿ',listen:'ORCA ಆಲಿಸಿ'},
ml:{dashboard:'ഡാഷ്ബോർഡ്',askOrca:'ORCAയോട് ചോദിക്കുക',marineMap:'കടൽ ഭൂപടം',evidence:'തെളിവുകൾ',history:'ചരിത്രം',alerts:'അറിയിപ്പുകൾ',whatIf:'ഇങ്ങനെ ആയാൽ',profile:'പ്രൊഫൈൽ',language:'ഭാഷ',changeStakeholder:'പങ്കാളിയെ മാറ്റുക',systemReady:'സിസ്റ്റം തയ്യാറാണ്',enterOrca:'ORCA ആരംഭിക്കുക',chooseRole:'നിങ്ങളുടെ പങ്ക് തിരഞ്ഞെടുക്കുക',location:'സ്ഥലം',useCurrentLocation:'നിലവിലെ സ്ഥലം ഉപയോഗിക്കുക',analyze:'ORCA ഉപയോഗിച്ച് വിശകലനം ചെയ്യുക',listen:'ORCA കേൾക്കുക'},
ne:{dashboard:'ड्यासबोर्ड',askOrca:'ORCA लाई सोध्नुहोस्',marineMap:'समुद्री नक्सा',evidence:'प्रमाण',history:'इतिहास',alerts:'सतर्कता',whatIf:'यदि यस्तो भए',profile:'प्रोफाइल',language:'भाषा',changeStakeholder:'भूमिका परिवर्तन गर्नुहोस्',systemReady:'प्रणाली तयार',enterOrca:'ORCA सुरु गर्नुहोस्',chooseRole:'आफ्नो भूमिका छान्नुहोस्',location:'स्थान',useCurrentLocation:'हालको स्थान प्रयोग गर्नुहोस्',analyze:'ORCA बाट विश्लेषण गर्नुहोस्',listen:'ORCA सुन्नुहोस्'},
as:{dashboard:'ডেশব’ৰ্ড',askOrca:'ORCA-ক সোধক',marineMap:'সামুদ্ৰিক মানচিত্ৰ',evidence:'প্ৰমাণ',history:'ইতিহাস',alerts:'সতৰ্কতা',whatIf:'যদি এনেকুৱা হয়',profile:'প্ৰফাইল',language:'ভাষা',changeStakeholder:'অংশীদাৰ সলনি কৰক',systemReady:'চিস্টেম সাজু',enterOrca:'ORCA আৰম্ভ কৰক',chooseRole:'আপোনাৰ ভূমিকা বাছক',location:'স্থান',useCurrentLocation:'বৰ্তমান স্থান ব্যৱহাৰ কৰক',analyze:'ORCA-ৰ সৈতে বিশ্লেষণ কৰক',listen:'ORCA শুনক'},
ks:{dashboard:'ڈیش بورڈ',askOrca:'ORCA سۭتۍ پٲچھو',marineMap:'سمندری نقشہ',evidence:'ثبوت',history:'تاریخ',alerts:'خبردار',whatIf:'اگر یُس',profile:'پروفائل',language:'زبان',changeStakeholder:'شراکت دار بدلاؤ',systemReady:'نظام تیار',enterOrca:'ORCA شروع',chooseRole:'پنُن کردار ژٲریو',location:'جایہ',useCurrentLocation:'موجودہ جایہ استعمال کریو',analyze:'ORCA سۭتۍ تجزیہ کریو',listen:'ORCA ہٕو آواز'},
kok:{dashboard:'डॅशबोर्ड',askOrca:'ORCA कडेन विचारात',marineMap:'समुद्री नकाशो',evidence:'पुरावे',history:'इतिहास',alerts:'इशारे',whatIf:'जर अशें जालें',profile:'प्रोफायल',language:'भास',changeStakeholder:'हितधारक बदलात',systemReady:'यंत्रणा तयार',enterOrca:'ORCA सुरू करात',chooseRole:'तुमची भूमिका निवडात',location:'थाव',useCurrentLocation:'सध्याचें थाव वापरात',analyze:'ORCA वांगडा विश्लेशण करात',listen:'ORCA आयकात'},
mai:{dashboard:'डैसबोर्ड',askOrca:'ORCA सँ पूछू',marineMap:'समुद्री नक्शा',evidence:'प्रमाण',history:'इतिहास',alerts:'चेतावनी',whatIf:'जँ एहन हो',profile:'प्रोफाइल',language:'भाषा',changeStakeholder:'हितधारक बदलू',systemReady:'सिस्टम तैयार',enterOrca:'ORCA शुरू करू',chooseRole:'अपन भूमिका चुनू',location:'स्थान',useCurrentLocation:'वर्तमान स्थान उपयोग करू',analyze:'ORCA सँ विश्लेषण करू',listen:'ORCA सुनू'},
doi:{dashboard:'डैशबोर्ड',askOrca:'ORCA गी पुछो',marineMap:'समुंदरी नक्शा',evidence:'सबूत',history:'इतिहास',alerts:'चेतावनियां',whatIf:'जेकर एहोए',profile:'प्रोफाइल',language:'भाशा',changeStakeholder:'हितधारक बदलो',systemReady:'सिस्टम तैयार',enterOrca:'ORCA शुरू करो',chooseRole:'अपनी भूमिका चुनो',location:'थाहर',useCurrentLocation:'मौजूदा थाहर बरतो',analyze:'ORCA कन्नै विश्लेषण करो',listen:'ORCA सुनो'},
brx:{dashboard:'ड्यासबोर्ड',askOrca:'ORCA खौ सों',marineMap:'समुद्रि मानचित्र',evidence:'साबुद',history:'इतिहास',alerts:'सावधानी',whatIf:'जदि बेयो',profile:'प्रोफाइल',language:'राव',changeStakeholder:'हितधारक सोलाय',systemReady:'सिस्टम सोरज',enterOrca:'ORCA जागाय',chooseRole:'निजि भूमिका सायख',location:'जायगा',useCurrentLocation:'दोनखो जायगा बाहाय',analyze:'ORCA जों बिबेचन',listen:'ORCA खोनासिन'},
mni:{dashboard:'ꯗ꯭ꯌꯥꯁꯕꯣꯔꯗ',askOrca:'ORCA-ꯗ ꯍꯥꯡꯗꯣꯛꯅꯕ',marineMap:'ꯃꯔꯤꯟ ꯃꯦꯞ',evidence:'ꯄꯥꯎꯗꯝ',history:'ꯄꯣꯡ',alerts:'ꯑꯣꯏꯕ',whatIf:'ꯑꯗꯨꯝ ꯑꯣꯏꯔꯕ',profile:'ꯄ꯭ꯔꯣꯐꯥꯏꯜ',language:'ꯂꯣꯟ',changeStakeholder:'ꯁ꯭ꯇꯦꯛꯍꯣꯜꯗꯔ ꯁꯣꯂꯥꯏ',systemReady:'ꯁꯤꯁꯇꯦꯝ ꯁꯥꯔꯨ',enterOrca:'ORCA ꯑꯃꯁꯤ',chooseRole:'ꯅꯨꯡꯉꯥꯏꯕ ꯃꯑꯣꯡ ꯈꯅꯕ',location:'ꯐꯝ',useCurrentLocation:'ꯍꯧꯖꯤꯛꯇꯥ ꯐꯝ ꯁꯤꯖꯤꯟꯅꯕ',analyze:'ORCA ꯅꯥ ꯑꯃꯥꯡꯕ',listen:'ORCA ꯇꯥꯔꯕ'},
sa:{dashboard:'दर्शकफलकम्',askOrca:'ORCA प्रति पृच्छतु',marineMap:'समुद्रमानचित्रम्',evidence:'प्रमाणम्',history:'इतिहासः',alerts:'सूचनाः',whatIf:'यदि तर्हि',profile:'प्रोफाइल',language:'भाषा',changeStakeholder:'हितधारकं परिवर्तयतु',systemReady:'तन्त्रं सिद्धम्',enterOrca:'ORCA आरभताम्',chooseRole:'स्वभूमिकां चिनुत',location:'स्थानम्',useCurrentLocation:'वर्तमानस्थानं प्रयुङ्क्ताम्',analyze:'ORCA द्वारा विश्लेषणं कुरुत',listen:'ORCA शृणुत'},
sat:{dashboard:'ᱰᱮᱥᱵᱚᱨᱰ',askOrca:'ORCA ᱠᱚ ᱯᱟᱹᱛᱤ',marineMap:'ᱢᱟᱨᱤᱱ ᱢᱮᱯ',evidence:'ᱯᱨᱚᱢᱟᱱ',history:'ᱦᱤᱥᱛᱚᱨᱤ',alerts:'ᱥᱟᱵᱫᱷᱟᱱ',whatIf:'ᱡᱟᱹᱦᱟᱸ',profile:'ᱯᱨᱚᱯᱟᱭᱤᱞ',language:'ᱯᱟᱹᱛ',changeStakeholder:'ᱥᱴᱮᱠᱦᱚᱞᱰᱟᱨ ᱵᱚᱫᱚᱞ',systemReady:'ᱥᱤᱥᱴᱮᱢ ᱛᱟᱭᱟᱨ',enterOrca:'ORCA ᱮᱢ ᱦᱚᱪᱚ',chooseRole:'ᱟᱢᱟᱜ ᱵᱷᱩᱢᱤᱠᱟ ᱵᱟᱪᱷᱱᱟ',location:'ᱡᱟᱭᱜᱟ',useCurrentLocation:'ᱱᱤᱛᱚᱜ ᱡᱟᱭᱜᱟ ᱵᱟᱵᱚᱦᱟᱨ',analyze:'ORCA ᱥᱟᱶᱛᱮ ᱵᱤᱥᱞᱮᱥᱚᱱ',listen:'ORCA ᱟᱹᱧᱚᱜ'},
sd:{dashboard:'ڊيش بورڊ',askOrca:'ORCA کان پڇو',marineMap:'سامونڊي نقشو',evidence:'ثبوت',history:'تاريخ',alerts:'خبردار',whatIf:'جيڪڏهن',profile:'پروفائيل',language:'ٻولي',changeStakeholder:'اسٽيڪ هولڊر تبديل ڪريو',systemReady:'سسٽم تيار',enterOrca:'ORCA شروع ڪريو',chooseRole:'پنهنجو ڪردار چونڊيو',location:'جڳهه',useCurrentLocation:'موجوده جڳهه استعمال ڪريو',analyze:'ORCA سان تجزيو ڪريو',listen:'ORCA ٻڌو'},
ur:{dashboard:'ڈیش بورڈ',askOrca:'ORCA سے پوچھیں',marineMap:'سمندری نقشہ',evidence:'شواہد',history:'تاریخ',alerts:'انتباہات',whatIf:'اگر ایسا ہو',profile:'پروفائل',language:'زبان',changeStakeholder:'اسٹیک ہولڈر تبدیل کریں',systemReady:'سسٹم تیار ہے',enterOrca:'ORCA شروع کریں',chooseRole:'اپنا کردار منتخب کریں',location:'مقام',useCurrentLocation:'موجودہ مقام استعمال کریں',analyze:'ORCA سے تجزیہ کریں',listen:'ORCA سنیں'}
};
// Remove accidental empty duplicate key object from above at runtime by using first non-empty map; English is always fallback.
export function ui(code: LanguageCode, key: Key): string { return T[code]?.[key] || EN[key]; }
const storageKey='orca-language';
export function saveLanguage(code:LanguageCode){localStorage.setItem(storageKey,code); window.dispatchEvent(new Event('orca-language-change'));}
export function useOrcaLanguage(){
 const [language,setLanguage]=React.useState<LanguageCode>(() => (localStorage.getItem(storageKey) as LanguageCode)||'en');
 React.useEffect(()=>{const f=()=>setLanguage((localStorage.getItem(storageKey) as LanguageCode)||'en');window.addEventListener('orca-language-change',f);return()=>window.removeEventListener('orca-language-change',f)},[]);
 const languageInfo=LANGUAGES.find(x=>x.code===language)||LANGUAGES[0]; return {language,languageInfo};
}
