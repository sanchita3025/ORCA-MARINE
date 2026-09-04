import { useEffect, useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import QueryForm from "./components/QueryForm";
import RiskCard from "./components/RiskCard";
import MarineCards from "./components/MarineCards";
import RiskBreakdown from "./components/RiskBreakdown";
import EvidencePanel from "./components/EvidencePanel";
import MarineMap from "./components/MarineMap";
import WhatIfPanel from "./components/WhatIfPanel";
import LoadingScreen from "./components/LoadingScreen";
import ErrorScreen from "./components/ErrorScreen";
import WelcomeScreen from "./components/WelcomeScreen";

import { demoData } from "./data/demoData";
import { askOrca } from "./services/api";

type AssessmentLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

type Assessment = {
  answer: string;

  risk: {
    score: number;
    level: string;
    message: string;
  };

  weather: {
    temperature: number;
    wind_speed: number;
    precipitation: number;
  };

  ocean: {
    wave_height: number;
    wave_period: number;
    current_speed: number;
    sst: number;
  };

  satellite: {
    pfz_available: boolean;
    pfz: string;
  };

  gis: {
    restricted_zone: boolean;
    location_name: string;
  };

  breakdown: {
    wind?: number;
    waves?: number;
    wave?: number;
    weather?: number;
    ocean?: number;
    pfz?: number;
    gis?: number;
  };

  verification: {
    verified: boolean;
    confidence: number;
  };
};

/* =========================================================
   TRANSLATIONS
========================================================= */

type Translation = {
  marineEcosystem: string;
  systemOnline: string;
  multiAgent: string;
  title1: string;
  title2: string;
  description: string;
  oceanIntelligence: string;
  weatherAnalysis: string;
  satelliteData: string;
  gisIntelligence: string;
  aiReasoning: string;
  askOrca: string;
  questionTitle: string;
  questionDescription: string;
  decisionSupport: string;
  collaborativeNetwork: string;
  analyzing: string;
  systemReady: string;
  ocean: string;
  wavesCurrents: string;
  weather: string;
  windRainfall: string;
  satellite: string;
  marineObservations: string;
  gis: string;
  locationConstraints: string;
  orcaReasoner: string;
  finalAssessment: string;
  assessment: string;
  marineRisk: string;
  liveIntelligence: string;
  recommendation: string;
  recommendationDescription: string;
  marineConditions: string;
  environmentalOverview: string;
  spatialIntelligence: string;
  reasoning: string;
  riskBreakdown: string;
  evidence: string;
  dataVerification: string;
  footerDescription: string;
  footerText: string;
  footerTech: string;
  selectLanguage: string;
  low: string;
  moderate: string;
  high: string;
  severe: string;
};

const translations: Record<string, Translation> = {
  en: {
    marineEcosystem: "Marine Ecosystem Intelligence",
    systemOnline: "System Online",
    multiAgent: "MULTI-AGENT MARINE INTELLIGENCE",
    title1: "Understand the ocean.",
    title2: "Make better decisions.",
    description:
      "ORCA combines marine, weather, ocean, satellite and geographic intelligence to reason about real-world marine conditions.",
    oceanIntelligence: "🌊 Ocean Intelligence",
    weatherAnalysis: "☁ Weather Analysis",
    satelliteData: "🛰 Satellite Data",
    gisIntelligence: "📍 GIS Intelligence",
    aiReasoning: "🤖 AI Reasoning",
    askOrca: "ASK ORCA",
    questionTitle: "Ask a question about the marine environment.",
    questionDescription:
      "Tell ORCA what you want to know, select a location and choose your departure time. Coordinates are handled automatically.",
    decisionSupport: "● AI DECISION SUPPORT",
    collaborativeNetwork: "Collaborative Agent Network",
    analyzing: "ANALYZING",
    systemReady: "SYSTEM READY",
    ocean: "OCEAN",
    wavesCurrents: "Waves & currents",
    weather: "WEATHER",
    windRainfall: "Wind & rainfall",
    satellite: "SATELLITE",
    marineObservations: "Marine observations",
    gis: "GIS",
    locationConstraints: "Location constraints",
    orcaReasoner: "ORCA REASONER",
    finalAssessment: "Final assessment",
    assessment: "ORCA ASSESSMENT",
    marineRisk: "Marine Risk Assessment",
    liveIntelligence: "LIVE INTELLIGENCE",
    recommendation: "ORCA RECOMMENDATION",
    recommendationDescription:
      "ORCA combines multiple environmental intelligence sources to generate this decision-support assessment.",
    marineConditions: "MARINE CONDITIONS",
    environmentalOverview: "Environmental Overview",
    spatialIntelligence: "SPATIAL INTELLIGENCE",
    reasoning: "REASONING",
    riskBreakdown: "Risk Breakdown",
    evidence: "EVIDENCE",
    dataVerification: "Data Verification",
    footerDescription:
      "Marine Ecosystem Reasoning with Collaborative Agents",
    footerText: "AI-powered marine decision support",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "SELECT LANGUAGE · 23 LANGUAGES",
    low: "LOW",
    moderate: "MODERATE",
    high: "HIGH",
    severe: "SEVERE",
  },

  hi: {
    marineEcosystem: "समुद्री पारिस्थितिकी बुद्धिमत्ता",
    systemOnline: "सिस्टम ऑनलाइन",
    multiAgent: "मल्टी-एजेंट समुद्री बुद्धिमत्ता",
    title1: "समुद्र को समझें।",
    title2: "बेहतर निर्णय लें।",
    description:
      "ORCA वास्तविक समुद्री परिस्थितियों को समझने के लिए समुद्र, मौसम, उपग्रह और भौगोलिक जानकारी को जोड़ता है।",
    oceanIntelligence: "🌊 महासागर बुद्धिमत्ता",
    weatherAnalysis: "☁ मौसम विश्लेषण",
    satelliteData: "🛰 उपग्रह डेटा",
    gisIntelligence: "📍 GIS बुद्धिमत्ता",
    aiReasoning: "🤖 AI तर्क",
    askOrca: "ORCA से पूछें",
    questionTitle: "समुद्री पर्यावरण के बारे में प्रश्न पूछें।",
    questionDescription:
      "ORCA को बताएं कि आप क्या जानना चाहते हैं, स्थान चुनें और प्रस्थान का समय चुनें। निर्देशांक अपने आप संभाले जाएंगे।",
    decisionSupport: "● AI निर्णय सहायता",
    collaborativeNetwork: "सहयोगी एजेंट नेटवर्क",
    analyzing: "विश्लेषण हो रहा है",
    systemReady: "सिस्टम तैयार",
    ocean: "महासागर",
    wavesCurrents: "लहरें और धाराएँ",
    weather: "मौसम",
    windRainfall: "हवा और वर्षा",
    satellite: "उपग्रह",
    marineObservations: "समुद्री अवलोकन",
    gis: "GIS",
    locationConstraints: "स्थान संबंधी सीमाएँ",
    orcaReasoner: "ORCA रीजनर",
    finalAssessment: "अंतिम आकलन",
    assessment: "ORCA आकलन",
    marineRisk: "समुद्री जोखिम आकलन",
    liveIntelligence: "लाइव इंटेलिजेंस",
    recommendation: "ORCA अनुशंसा",
    recommendationDescription:
      "ORCA इस निर्णय-सहायता आकलन को तैयार करने के लिए कई पर्यावरणीय इंटेलिजेंस स्रोतों को जोड़ता है।",
    marineConditions: "समुद्री परिस्थितियाँ",
    environmentalOverview: "पर्यावरणीय अवलोकन",
    spatialIntelligence: "स्थानिक इंटेलिजेंस",
    reasoning: "तर्क",
    riskBreakdown: "जोखिम विवरण",
    evidence: "साक्ष्य",
    dataVerification: "डेटा सत्यापन",
    footerDescription:
      "सहयोगी एजेंटों के साथ समुद्री पारिस्थितिकी तर्क",
    footerText: "AI-संचालित समुद्री निर्णय सहायता",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "भाषा चुनें · 23 भाषाएँ",
    low: "कम",
    moderate: "मध्यम",
    high: "उच्च",
    severe: "गंभीर",
  },

  bn: {
    marineEcosystem: "সামুদ্রিক বাস্তুতন্ত্র বুদ্ধিমত্তা",
    systemOnline: "সিস্টেম অনলাইন",
    multiAgent: "মাল্টি-এজেন্ট সামুদ্রিক বুদ্ধিমত্তা",
    title1: "সমুদ্রকে বুঝুন।",
    title2: "আরও ভালো সিদ্ধান্ত নিন।",
    description:
      "ORCA বাস্তব সামুদ্রিক পরিস্থিতি বিশ্লেষণ করতে সামুদ্রিক, আবহাওয়া, মহাসাগর, স্যাটেলাইট এবং ভৌগোলিক তথ্য একত্রিত করে।",
    oceanIntelligence: "🌊 মহাসাগরীয় বুদ্ধিমত্তা",
    weatherAnalysis: "☁ আবহাওয়া বিশ্লেষণ",
    satelliteData: "🛰 স্যাটেলাইট তথ্য",
    gisIntelligence: "📍 GIS বুদ্ধিমত্তা",
    aiReasoning: "🤖 AI যুক্তি",
    askOrca: "ORCA-কে জিজ্ঞাসা করুন",
    questionTitle: "সামুদ্রিক পরিবেশ সম্পর্কে প্রশ্ন করুন।",
    questionDescription:
      "আপনি কী জানতে চান তা ORCA-কে বলুন, একটি অবস্থান নির্বাচন করুন এবং প্রস্থানের সময় বেছে নিন।",
    decisionSupport: "● AI সিদ্ধান্ত সহায়তা",
    collaborativeNetwork: "সহযোগী এজেন্ট নেটওয়ার্ক",
    analyzing: "বিশ্লেষণ চলছে",
    systemReady: "সিস্টেম প্রস্তুত",
    ocean: "মহাসাগর",
    wavesCurrents: "ঢেউ ও স্রোত",
    weather: "আবহাওয়া",
    windRainfall: "বাতাস ও বৃষ্টি",
    satellite: "স্যাটেলাইট",
    marineObservations: "সামুদ্রিক পর্যবেক্ষণ",
    gis: "GIS",
    locationConstraints: "অবস্থান সীমাবদ্ধতা",
    orcaReasoner: "ORCA রিজনার",
    finalAssessment: "চূড়ান্ত মূল্যায়ন",
    assessment: "ORCA মূল্যায়ন",
    marineRisk: "সামুদ্রিক ঝুঁকি মূল্যায়ন",
    liveIntelligence: "লাইভ ইন্টেলিজেন্স",
    recommendation: "ORCA সুপারিশ",
    recommendationDescription:
      "ORCA এই সিদ্ধান্ত সহায়তা মূল্যায়ন তৈরি করতে একাধিক পরিবেশগত তথ্য উৎস একত্রিত করে।",
    marineConditions: "সামুদ্রিক পরিস্থিতি",
    environmentalOverview: "পরিবেশগত সংক্ষিপ্তসার",
    spatialIntelligence: "স্থানিক বুদ্ধিমত্তা",
    reasoning: "যুক্তি",
    riskBreakdown: "ঝুঁকি বিশ্লেষণ",
    evidence: "প্রমাণ",
    dataVerification: "তথ্য যাচাই",
    footerDescription:
      "সহযোগী এজেন্টের মাধ্যমে সামুদ্রিক বাস্তুতন্ত্র বিশ্লেষণ",
    footerText: "AI-চালিত সামুদ্রিক সিদ্ধান্ত সহায়তা",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ভাষা নির্বাচন করুন · ২৩টি ভাষা",
    low: "কম",
    moderate: "মাঝারি",
    high: "উচ্চ",
    severe: "গুরুতর",
  },

  te: {
    marineEcosystem: "సముద్ర పర్యావరణ వ్యవస్థ మేధస్సు",
    systemOnline: "సిస్టమ్ ఆన్‌లైన్",
    multiAgent: "మల్టీ-ఏజెంట్ సముద్ర మేధస్సు",
    title1: "సముద్రాన్ని అర్థం చేసుకోండి.",
    title2: "మెరుగైన నిర్ణయాలు తీసుకోండి.",
    description:
      "ORCA సముద్ర, వాతావరణ, ఉపగ్రహ మరియు భౌగోళిక సమాచారాన్ని కలిపి సముద్ర పరిస్థితులను విశ్లేషిస్తుంది.",
    oceanIntelligence: "🌊 సముద్ర మేధస్సు",
    weatherAnalysis: "☁ వాతావరణ విశ్లేషణ",
    satelliteData: "🛰 ఉపగ్రహ డేటా",
    gisIntelligence: "📍 GIS మేధస్సు",
    aiReasoning: "🤖 AI విశ్లేషణ",
    askOrca: "ORCAని అడగండి",
    questionTitle: "సముద్ర పర్యావరణం గురించి ప్రశ్న అడగండి.",
    questionDescription:
      "మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారో ORCAకి చెప్పండి, ప్రదేశం మరియు బయలుదేరే సమయాన్ని ఎంచుకోండి.",
    decisionSupport: "● AI నిర్ణయ సహాయం",
    collaborativeNetwork: "సహకార ఏజెంట్ నెట్‌వర్క్",
    analyzing: "విశ్లేషిస్తోంది",
    systemReady: "సిస్టమ్ సిద్ధంగా ఉంది",
    ocean: "సముద్రం",
    wavesCurrents: "అలలు మరియు ప్రవాహాలు",
    weather: "వాతావరణం",
    windRainfall: "గాలి మరియు వర్షపాతం",
    satellite: "ఉపగ్రహం",
    marineObservations: "సముద్ర పరిశీలనలు",
    gis: "GIS",
    locationConstraints: "స్థాన పరిమితులు",
    orcaReasoner: "ORCA రీజనర్",
    finalAssessment: "చివరి అంచనా",
    assessment: "ORCA అంచనా",
    marineRisk: "సముద్ర ప్రమాద అంచనా",
    liveIntelligence: "లైవ్ ఇంటెలిజెన్స్",
    recommendation: "ORCA సిఫార్సు",
    recommendationDescription:
      "ORCA ఈ నిర్ణయ సహాయ అంచనాను రూపొందించడానికి అనేక పర్యావరణ సమాచార వనరులను కలుపుతుంది.",
    marineConditions: "సముద్ర పరిస్థితులు",
    environmentalOverview: "పర్యావరణ అవలోకనం",
    spatialIntelligence: "స్థానిక మేధస్సు",
    reasoning: "విశ్లేషణ",
    riskBreakdown: "ప్రమాద విభజన",
    evidence: "ఆధారాలు",
    dataVerification: "డేటా ధృవీకరణ",
    footerDescription:
      "సహకార ఏజెంట్లతో సముద్ర పర్యావరణ విశ్లేషణ",
    footerText: "AI ఆధారిత సముద్ర నిర్ణయ సహాయం",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "భాషను ఎంచుకోండి · 23 భాషలు",
    low: "తక్కువ",
    moderate: "మధ్యస్థం",
    high: "అధిక",
    severe: "తీవ్రం",
  },

  mr: {
    marineEcosystem: "सागरीय परिसंस्था बुद्धिमत्ता",
    systemOnline: "सिस्टम ऑनलाइन",
    multiAgent: "मल्टी-एजंट सागरी बुद्धिमत्ता",
    title1: "समुद्र समजून घ्या.",
    title2: "चांगले निर्णय घ्या.",
    description:
      "ORCA सागरी, हवामान, उपग्रह आणि भौगोलिक माहिती एकत्र करून वास्तविक समुद्री परिस्थितीचे विश्लेषण करते.",
    oceanIntelligence: "🌊 महासागर बुद्धिमत्ता",
    weatherAnalysis: "☁ हवामान विश्लेषण",
    satelliteData: "🛰 उपग्रह डेटा",
    gisIntelligence: "📍 GIS बुद्धिमत्ता",
    aiReasoning: "🤖 AI विश्लेषण",
    askOrca: "ORCA ला विचारा",
    questionTitle: "सागरी पर्यावरणाबद्दल प्रश्न विचारा.",
    questionDescription:
      "तुम्हाला काय जाणून घ्यायचे आहे ते ORCA ला सांगा, स्थान आणि प्रस्थानाची वेळ निवडा.",
    decisionSupport: "● AI निर्णय सहाय्य",
    collaborativeNetwork: "सहयोगी एजंट नेटवर्क",
    analyzing: "विश्लेषण सुरू आहे",
    systemReady: "सिस्टम तयार",
    ocean: "महासागर",
    wavesCurrents: "लाटा आणि प्रवाह",
    weather: "हवामान",
    windRainfall: "वारा आणि पाऊस",
    satellite: "उपग्रह",
    marineObservations: "सागरी निरीक्षणे",
    gis: "GIS",
    locationConstraints: "स्थान मर्यादा",
    orcaReasoner: "ORCA रीझनर",
    finalAssessment: "अंतिम मूल्यांकन",
    assessment: "ORCA मूल्यांकन",
    marineRisk: "सागरी जोखीम मूल्यांकन",
    liveIntelligence: "लाइव्ह इंटेलिजन्स",
    recommendation: "ORCA शिफारस",
    recommendationDescription:
      "ORCA हे निर्णय सहाय्य मूल्यांकन तयार करण्यासाठी अनेक पर्यावरणीय माहिती स्रोत एकत्र करते.",
    marineConditions: "सागरी परिस्थिती",
    environmentalOverview: "पर्यावरणीय आढावा",
    spatialIntelligence: "स्थानिक बुद्धिमत्ता",
    reasoning: "तर्क",
    riskBreakdown: "जोखीम विश्लेषण",
    evidence: "पुरावे",
    dataVerification: "डेटा पडताळणी",
    footerDescription:
      "सहयोगी एजंट्ससह सागरी परिसंस्था विश्लेषण",
    footerText: "AI-आधारित सागरी निर्णय सहाय्य",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "भाषा निवडा · 23 भाषा",
    low: "कमी",
    moderate: "मध्यम",
    high: "उच्च",
    severe: "गंभीर",
  },

  ta: {
    marineEcosystem: "கடல் சுற்றுச்சூழல் நுண்ணறிவு",
    systemOnline: "கணினி ஆன்லைனில் உள்ளது",
    multiAgent: "பல முகவர் கடல் நுண்ணறிவு",
    title1: "கடலைப் புரிந்துகொள்ளுங்கள்.",
    title2: "சிறந்த முடிவுகளை எடுங்கள்.",
    description:
      "ORCA கடல், வானிலை, செயற்கைக்கோள் மற்றும் புவியியல் தகவல்களை இணைத்து உண்மையான கடல் நிலைமைகளை பகுப்பாய்வு செய்கிறது.",
    oceanIntelligence: "🌊 கடல் நுண்ணறிவு",
    weatherAnalysis: "☁ வானிலை பகுப்பாய்வு",
    satelliteData: "🛰 செயற்கைக்கோள் தரவு",
    gisIntelligence: "📍 GIS நுண்ணறிவு",
    aiReasoning: "🤖 AI பகுத்தறிவு",
    askOrca: "ORCA-விடம் கேளுங்கள்",
    questionTitle: "கடல் சூழல் பற்றி கேள்வி கேளுங்கள்.",
    questionDescription:
      "நீங்கள் தெரிந்துகொள்ள விரும்புவதை ORCA-விடம் கூறி, இடம் மற்றும் புறப்படும் நேரத்தைத் தேர்ந்தெடுக்கவும்.",
    decisionSupport: "● AI முடிவு ஆதரவு",
    collaborativeNetwork: "கூட்டு முகவர் வலையமைப்பு",
    analyzing: "பகுப்பாய்வு நடைபெறுகிறது",
    systemReady: "கணினி தயார்",
    ocean: "கடல்",
    wavesCurrents: "அலைகள் மற்றும் நீரோட்டங்கள்",
    weather: "வானிலை",
    windRainfall: "காற்று மற்றும் மழை",
    satellite: "செயற்கைக்கோள்",
    marineObservations: "கடல் கண்காணிப்புகள்",
    gis: "GIS",
    locationConstraints: "இடக் கட்டுப்பாடுகள்",
    orcaReasoner: "ORCA பகுத்தறிவாளர்",
    finalAssessment: "இறுதி மதிப்பீடு",
    assessment: "ORCA மதிப்பீடு",
    marineRisk: "கடல் ஆபத்து மதிப்பீடு",
    liveIntelligence: "நேரடி நுண்ணறிவு",
    recommendation: "ORCA பரிந்துரை",
    recommendationDescription:
      "இந்த முடிவு ஆதரவு மதிப்பீட்டை உருவாக்க ORCA பல சுற்றுச்சூழல் தகவல் ஆதாரங்களை இணைக்கிறது.",
    marineConditions: "கடல் நிலைமைகள்",
    environmentalOverview: "சுற்றுச்சூழல் மேலோட்டம்",
    spatialIntelligence: "இடவியல் நுண்ணறிவு",
    reasoning: "பகுத்தறிவு",
    riskBreakdown: "ஆபத்து பகுப்பாய்வு",
    evidence: "ஆதாரம்",
    dataVerification: "தரவு சரிபார்ப்பு",
    footerDescription:
      "கூட்டு முகவர்களுடன் கடல் சுற்றுச்சூழல் பகுத்தறிவு",
    footerText: "AI இயக்கப்படும் கடல் முடிவு ஆதரவு",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும் · 23 மொழிகள்",
    low: "குறைவு",
    moderate: "மிதமான",
    high: "அதிகம்",
    severe: "கடுமையான",
  },

  gu: {
    marineEcosystem: "દરિયાઈ પર્યાવરણ બુદ્ધિમત્તા",
    systemOnline: "સિસ્ટમ ઓનલાઈન",
    multiAgent: "મલ્ટી-એજન્ટ મરીન ઇન્ટેલિજન્સ",
    title1: "સમુદ્રને સમજો.",
    title2: "વધુ સારા નિર્ણયો લો.",
    description:
      "ORCA વાસ્તવિક દરિયાઈ પરિસ્થિતિઓનું વિશ્લેષણ કરવા માટે દરિયાઈ, હવામાન, સેટેલાઇટ અને ભૌગોલિક માહિતી જોડે છે.",
    oceanIntelligence: "🌊 મહાસાગર બુદ્ધિમત્તા",
    weatherAnalysis: "☁ હવામાન વિશ્લેષણ",
    satelliteData: "🛰 સેટેલાઇટ ડેટા",
    gisIntelligence: "📍 GIS બુદ્ધિમત્તા",
    aiReasoning: "🤖 AI વિશ્લેષણ",
    askOrca: "ORCA ને પૂછો",
    questionTitle: "દરિયાઈ પર્યાવરણ વિશે પ્રશ્ન પૂછો.",
    questionDescription:
      "તમે શું જાણવા માંગો છો તે ORCA ને કહો, સ્થાન અને પ્રસ્થાનનો સમય પસંદ કરો.",
    decisionSupport: "● AI નિર્ણય સહાય",
    collaborativeNetwork: "સહયોગી એજન્ટ નેટવર્ક",
    analyzing: "વિશ્લેષણ થઈ રહ્યું છે",
    systemReady: "સિસ્ટમ તૈયાર",
    ocean: "મહાસાગર",
    wavesCurrents: "મોજાં અને પ્રવાહો",
    weather: "હવામાન",
    windRainfall: "પવન અને વરસાદ",
    satellite: "સેટેલાઇટ",
    marineObservations: "દરિયાઈ અવલોકનો",
    gis: "GIS",
    locationConstraints: "સ્થાન મર્યાદાઓ",
    orcaReasoner: "ORCA રીઝનર",
    finalAssessment: "અંતિમ મૂલ્યાંકન",
    assessment: "ORCA મૂલ્યાંકન",
    marineRisk: "દરિયાઈ જોખમ મૂલ્યાંકન",
    liveIntelligence: "લાઇવ ઇન્ટેલિજન્સ",
    recommendation: "ORCA ભલામણ",
    recommendationDescription:
      "ORCA આ નિર્ણય સહાય મૂલ્યાંકન બનાવવા માટે અનેક પર્યાવરણીય માહિતી સ્ત્રોતોને જોડે છે.",
    marineConditions: "દરિયાઈ પરિસ્થિતિઓ",
    environmentalOverview: "પર્યાવરણીય ઝાંખી",
    spatialIntelligence: "સ્થાનિક બુદ્ધિમત્તા",
    reasoning: "તર્ક",
    riskBreakdown: "જોખમ વિશ્લેષણ",
    evidence: "પુરાવા",
    dataVerification: "ડેટા ચકાસણી",
    footerDescription:
      "સહયોગી એજન્ટ્સ સાથે દરિયાઈ પર્યાવરણનું વિશ્લેષણ",
    footerText: "AI આધારિત દરિયાઈ નિર્ણય સહાય",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ભાષા પસંદ કરો · 23 ભાષાઓ",
    low: "નીચું",
    moderate: "મધ્યમ",
    high: "ઉચ્ચ",
    severe: "ગંભીર",
  },

  kn: {
    marineEcosystem: "ಸಾಗರ ಪರಿಸರ ವ್ಯವಸ್ಥೆಯ ಬುದ್ಧಿಮತ್ತೆ",
    systemOnline: "ಸಿಸ್ಟಮ್ ಆನ್‌ಲೈನ್",
    multiAgent: "ಮಲ್ಟಿ-ಏಜೆಂಟ್ ಸಾಗರ ಬುದ್ಧಿಮತ್ತೆ",
    title1: "ಸಾಗರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.",
    title2: "ಉತ್ತಮ ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.",
    description:
      "ORCA ನೈಜ ಸಾಗರ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಾಗರ, ಹವಾಮಾನ, ಉಪಗ್ರಹ ಮತ್ತು ಭೌಗೋಳಿಕ ಮಾಹಿತಿಯನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ.",
    oceanIntelligence: "🌊 ಸಾಗರ ಬುದ್ಧಿಮತ್ತೆ",
    weatherAnalysis: "☁ ಹವಾಮಾನ ವಿಶ್ಲೇಷಣೆ",
    satelliteData: "🛰 ಉಪಗ್ರಹ ಡೇಟಾ",
    gisIntelligence: "📍 GIS ಬುದ್ಧಿಮತ್ತೆ",
    aiReasoning: "🤖 AI ವಿಶ್ಲೇಷಣೆ",
    askOrca: "ORCA ಅನ್ನು ಕೇಳಿ",
    questionTitle: "ಸಾಗರ ಪರಿಸರದ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ.",
    questionDescription:
      "ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ORCAಗೆ ತಿಳಿಸಿ, ಸ್ಥಳ ಮತ್ತು ಹೊರಡುವ ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    decisionSupport: "● AI ನಿರ್ಧಾರ ಸಹಾಯ",
    collaborativeNetwork: "ಸಹಯೋಗಿ ಏಜೆಂಟ್ ನೆಟ್‌ವರ್ಕ್",
    analyzing: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ",
    systemReady: "ಸಿಸ್ಟಮ್ ಸಿದ್ಧವಾಗಿದೆ",
    ocean: "ಸಾಗರ",
    wavesCurrents: "ಅಲೆಗಳು ಮತ್ತು ಪ್ರವಾಹಗಳು",
    weather: "ಹವಾಮಾನ",
    windRainfall: "ಗಾಳಿ ಮತ್ತು ಮಳೆ",
    satellite: "ಉಪಗ್ರಹ",
    marineObservations: "ಸಾಗರ ವೀಕ್ಷಣೆಗಳು",
    gis: "GIS",
    locationConstraints: "ಸ್ಥಳದ ಮಿತಿಗಳು",
    orcaReasoner: "ORCA ರೀಸನರ್",
    finalAssessment: "ಅಂತಿಮ ಮೌಲ್ಯಮಾಪನ",
    assessment: "ORCA ಮೌಲ್ಯಮಾಪನ",
    marineRisk: "ಸಾಗರ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ",
    liveIntelligence: "ಲೈವ್ ಇಂಟೆಲಿಜೆನ್ಸ್",
    recommendation: "ORCA ಶಿಫಾರಸು",
    recommendationDescription:
      "ಈ ನಿರ್ಧಾರ ಸಹಾಯ ಮೌಲ್ಯಮಾಪನವನ್ನು ರಚಿಸಲು ORCA ಅನೇಕ ಪರಿಸರ ಮಾಹಿತಿ ಮೂಲಗಳನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ.",
    marineConditions: "ಸಾಗರ ಪರಿಸ್ಥಿತಿಗಳು",
    environmentalOverview: "ಪರಿಸರ ಅವಲೋಕನ",
    spatialIntelligence: "ಸ್ಥಳೀಯ ಬುದ್ಧಿಮತ್ತೆ",
    reasoning: "ತಾರ್ಕಿಕತೆ",
    riskBreakdown: "ಅಪಾಯ ವಿಶ್ಲೇಷಣೆ",
    evidence: "ಪುರಾವೆಗಳು",
    dataVerification: "ಡೇಟಾ ಪರಿಶೀಲನೆ",
    footerDescription:
      "ಸಹಯೋಗಿ ಏಜೆಂಟ್‌ಗಳೊಂದಿಗೆ ಸಾಗರ ಪರಿಸರ ವ್ಯವಸ್ಥೆಯ ವಿಶ್ಲೇಷಣೆ",
    footerText: "AI ಆಧಾರಿತ ಸಾಗರ ನಿರ್ಧಾರ ಸಹಾಯ",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ · 23 ಭಾಷೆಗಳು",
    low: "ಕಡಿಮೆ",
    moderate: "ಮಧ್ಯಮ",
    high: "ಹೆಚ್ಚು",
    severe: "ತೀವ್ರ",
  },

  ml: {
    marineEcosystem: "സമുദ്ര പരിസ്ഥിതി ബുദ്ധി",
    systemOnline: "സിസ്റ്റം ഓൺലൈനിലാണ്",
    multiAgent: "മൾട്ടി-ഏജന്റ് സമുദ്ര ബുദ്ധി",
    title1: "സമുദ്രത്തെ മനസ്സിലാക്കുക.",
    title2: "മികച്ച തീരുമാനങ്ങൾ എടുക്കുക.",
    description:
      "ORCA യഥാർത്ഥ സമുദ്ര സാഹചര്യങ്ങൾ വിശകലനം ചെയ്യാൻ സമുദ്ര, കാലാവസ്ഥ, ഉപഗ്രഹ, ഭൂമിശാസ്ത്ര വിവരങ്ങൾ സംയോജിപ്പിക്കുന്നു.",
    oceanIntelligence: "🌊 സമുദ്ര ബുദ്ധി",
    weatherAnalysis: "☁ കാലാവസ്ഥാ വിശകലനം",
    satelliteData: "🛰 ഉപഗ്രഹ ഡാറ്റ",
    gisIntelligence: "📍 GIS ബുദ്ധി",
    aiReasoning: "🤖 AI വിശകലനം",
    askOrca: "ORCAയോട് ചോദിക്കുക",
    questionTitle: "സമുദ്ര പരിസ്ഥിതിയെക്കുറിച്ച് ചോദിക്കുക.",
    questionDescription:
      "നിങ്ങൾ അറിയാൻ ആഗ്രഹിക്കുന്നത് ORCAയോട് പറയുക, സ്ഥലം തിരഞ്ഞെടുത്ത് പുറപ്പെടുന്ന സമയം തിരഞ്ഞെടുക്കുക.",
    decisionSupport: "● AI തീരുമാന സഹായം",
    collaborativeNetwork: "സഹകരണ ഏജന്റ് നെറ്റ്‌വർക്ക്",
    analyzing: "വിശകലനം നടക്കുന്നു",
    systemReady: "സിസ്റ്റം തയ്യാറാണ്",
    ocean: "സമുദ്രം",
    wavesCurrents: "തിരകളും പ്രവാഹങ്ങളും",
    weather: "കാലാവസ്ഥ",
    windRainfall: "കാറ്റും മഴയും",
    satellite: "ഉപഗ്രഹം",
    marineObservations: "സമുദ്ര നിരീക്ഷണങ്ങൾ",
    gis: "GIS",
    locationConstraints: "സ്ഥല നിയന്ത്രണങ്ങൾ",
    orcaReasoner: "ORCA റീസണർ",
    finalAssessment: "അന്തിമ വിലയിരുത്തൽ",
    assessment: "ORCA വിലയിരുത്തൽ",
    marineRisk: "സമുദ്ര അപകട വിലയിരുത്തൽ",
    liveIntelligence: "ലൈവ് ഇന്റലിജൻസ്",
    recommendation: "ORCA ശുപാർശ",
    recommendationDescription:
      "ഈ തീരുമാന സഹായ വിലയിരുത്തൽ സൃഷ്ടിക്കാൻ ORCA നിരവധി പരിസ്ഥിതി വിവര സ്രോതസ്സുകൾ സംയോജിപ്പിക്കുന്നു.",
    marineConditions: "സമുദ്ര സാഹചര്യങ്ങൾ",
    environmentalOverview: "പരിസ്ഥിതി അവലോകനം",
    spatialIntelligence: "സ്ഥലിക ബുദ്ധി",
    reasoning: "യുക്തി",
    riskBreakdown: "അപകട വിശകലനം",
    evidence: "തെളിവുകൾ",
    dataVerification: "ഡാറ്റ പരിശോധന",
    footerDescription:
      "സഹകരണ ഏജന്റുമാരോടൊപ്പം സമുദ്ര പരിസ്ഥിതി വിശകലനം",
    footerText: "AI അടിസ്ഥാനമാക്കിയുള്ള സമുദ്ര തീരുമാന സഹായം",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക · 23 ഭാഷകൾ",
    low: "കുറവ്",
    moderate: "മിതമായ",
    high: "ഉയർന്ന",
    severe: "ഗുരുതരമായ",
  },

  pa: {
    marineEcosystem: "ਸਮੁੰਦਰੀ ਪਰਿਆਵਰਣ ਬੁੱਧੀ",
    systemOnline: "ਸਿਸਟਮ ਔਨਲਾਈਨ",
    multiAgent: "ਮਲਟੀ-ਏਜੰਟ ਸਮੁੰਦਰੀ ਬੁੱਧੀ",
    title1: "ਸਮੁੰਦਰ ਨੂੰ ਸਮਝੋ।",
    title2: "ਬਿਹਤਰ ਫੈਸਲੇ ਲਓ।",
    description:
      "ORCA ਅਸਲ ਸਮੁੰਦਰੀ ਹਾਲਾਤਾਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਨ ਲਈ ਸਮੁੰਦਰੀ, ਮੌਸਮ, ਸੈਟੇਲਾਈਟ ਅਤੇ ਭੂਗੋਲਿਕ ਜਾਣਕਾਰੀ ਨੂੰ ਜੋੜਦਾ ਹੈ।",
    oceanIntelligence: "🌊 ਸਮੁੰਦਰੀ ਬੁੱਧੀ",
    weatherAnalysis: "☁ ਮੌਸਮ ਵਿਸ਼ਲੇਸ਼ਣ",
    satelliteData: "🛰 ਸੈਟੇਲਾਈਟ ਡਾਟਾ",
    gisIntelligence: "📍 GIS ਬੁੱਧੀ",
    aiReasoning: "🤖 AI ਵਿਸ਼ਲੇਸ਼ਣ",
    askOrca: "ORCA ਨੂੰ ਪੁੱਛੋ",
    questionTitle: "ਸਮੁੰਦਰੀ ਵਾਤਾਵਰਣ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ।",
    questionDescription:
      "ORCA ਨੂੰ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ, ਸਥਾਨ ਅਤੇ ਰਵਾਨਗੀ ਦਾ ਸਮਾਂ ਚੁਣੋ।",
    decisionSupport: "● AI ਫੈਸਲਾ ਸਹਾਇਤਾ",
    collaborativeNetwork: "ਸਹਿਯੋਗੀ ਏਜੰਟ ਨੈੱਟਵਰਕ",
    analyzing: "ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ",
    systemReady: "ਸਿਸਟਮ ਤਿਆਰ",
    ocean: "ਸਮੁੰਦਰ",
    wavesCurrents: "ਲਹਿਰਾਂ ਅਤੇ ਧਾਰਾਵਾਂ",
    weather: "ਮੌਸਮ",
    windRainfall: "ਹਵਾ ਅਤੇ ਮੀਂਹ",
    satellite: "ਸੈਟੇਲਾਈਟ",
    marineObservations: "ਸਮੁੰਦਰੀ ਨਿਰੀਖਣ",
    gis: "GIS",
    locationConstraints: "ਸਥਾਨ ਸੀਮਾਵਾਂ",
    orcaReasoner: "ORCA ਰੀਜ਼ਨਰ",
    finalAssessment: "ਅੰਤਿਮ ਮੁਲਾਂਕਣ",
    assessment: "ORCA ਮੁਲਾਂਕਣ",
    marineRisk: "ਸਮੁੰਦਰੀ ਜੋਖਮ ਮੁਲਾਂਕਣ",
    liveIntelligence: "ਲਾਈਵ ਇੰਟੈਲੀਜੈਂਸ",
    recommendation: "ORCA ਸਿਫਾਰਸ਼",
    recommendationDescription:
      "ORCA ਇਸ ਫੈਸਲਾ ਸਹਾਇਤਾ ਮੁਲਾਂਕਣ ਨੂੰ ਬਣਾਉਣ ਲਈ ਕਈ ਵਾਤਾਵਰਣਕ ਜਾਣਕਾਰੀ ਸਰੋਤਾਂ ਨੂੰ ਜੋੜਦਾ ਹੈ।",
    marineConditions: "ਸਮੁੰਦਰੀ ਹਾਲਾਤ",
    environmentalOverview: "ਵਾਤਾਵਰਣਕ ਸੰਖੇਪ",
    spatialIntelligence: "ਸਥਾਨਕ ਬੁੱਧੀ",
    reasoning: "ਤਰਕ",
    riskBreakdown: "ਜੋਖਮ ਵਿਸ਼ਲੇਸ਼ਣ",
    evidence: "ਸਬੂਤ",
    dataVerification: "ਡਾਟਾ ਤਸਦੀਕ",
    footerDescription:
      "ਸਹਿਯੋਗੀ ਏਜੰਟਾਂ ਨਾਲ ਸਮੁੰਦਰੀ ਪਰਿਆਵਰਣ ਵਿਸ਼ਲੇਸ਼ਣ",
    footerText: "AI-ਅਧਾਰਿਤ ਸਮੁੰਦਰੀ ਫੈਸਲਾ ਸਹਾਇਤਾ",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ · 23 ਭਾਸ਼ਾਵਾਂ",
    low: "ਘੱਟ",
    moderate: "ਦਰਮਿਆਨਾ",
    high: "ਉੱਚ",
    severe: "ਗੰਭੀਰ",
  },

  or: {
    marineEcosystem: "ସାମୁଦ୍ରିକ ପରିବେଶ ବୁଦ୍ଧିମତ୍ତା",
    systemOnline: "ସିଷ୍ଟମ୍ ଅନଲାଇନ୍",
    multiAgent: "ମଲ୍ଟି-ଏଜେଣ୍ଟ ସାମୁଦ୍ରିକ ବୁଦ୍ଧିମତ୍ତା",
    title1: "ସମୁଦ୍ରକୁ ବୁଝନ୍ତୁ।",
    title2: "ଭଲ ନିଷ୍ପତ୍ତି ନିଅନ୍ତୁ।",
    description:
      "ORCA ପ୍ରକୃତ ସାମୁଦ୍ରିକ ପରିସ୍ଥିତି ବିଶ୍ଳେଷଣ କରିବା ପାଇଁ ସାମୁଦ୍ରିକ, ପାଣିପାଗ, ଉପଗ୍ରହ ଏବଂ ଭୌଗୋଳିକ ସୂଚନାକୁ ଏକତ୍ର କରେ।",
    oceanIntelligence: "🌊 ମହାସାଗର ବୁଦ୍ଧିମତ୍ତା",
    weatherAnalysis: "☁ ପାଣିପାଗ ବିଶ୍ଳେଷଣ",
    satelliteData: "🛰 ଉପଗ୍ରହ ତଥ୍ୟ",
    gisIntelligence: "📍 GIS ବୁଦ୍ଧିମତ୍ତା",
    aiReasoning: "🤖 AI ବିଶ୍ଳେଷଣ",
    askOrca: "ORCA କୁ ପଚାରନ୍ତୁ",
    questionTitle: "ସାମୁଦ୍ରିକ ପରିବେଶ ବିଷୟରେ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।",
    questionDescription:
      "ଆପଣ କଣ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି ORCA କୁ କୁହନ୍ତୁ, ସ୍ଥାନ ଏବଂ ପ୍ରସ୍ଥାନ ସମୟ ବାଛନ୍ତୁ।",
    decisionSupport: "● AI ନିଷ୍ପତ୍ତି ସହାୟତା",
    collaborativeNetwork: "ସହଯୋଗୀ ଏଜେଣ୍ଟ ନେଟୱର୍କ",
    analyzing: "ବିଶ୍ଳେଷଣ ଚାଲିଛି",
    systemReady: "ସିଷ୍ଟମ୍ ପ୍ରସ୍ତୁତ",
    ocean: "ମହାସାଗର",
    wavesCurrents: "ତରଙ୍ଗ ଏବଂ ସ୍ରୋତ",
    weather: "ପାଣିପାଗ",
    windRainfall: "ପବନ ଏବଂ ବର୍ଷା",
    satellite: "ଉପଗ୍ରହ",
    marineObservations: "ସାମୁଦ୍ରିକ ନିରୀକ୍ଷଣ",
    gis: "GIS",
    locationConstraints: "ସ୍ଥାନ ସୀମା",
    orcaReasoner: "ORCA ରିଜନର",
    finalAssessment: "ଅନ୍ତିମ ମୂଲ୍ୟାୟନ",
    assessment: "ORCA ମୂଲ୍ୟାୟନ",
    marineRisk: "ସାମୁଦ୍ରିକ ବିପଦ ମୂଲ୍ୟାୟନ",
    liveIntelligence: "ଲାଇଭ୍ ବୁଦ୍ଧିମତ୍ତା",
    recommendation: "ORCA ସୁପାରିଶ",
    recommendationDescription:
      "ORCA ଏହି ନିଷ୍ପତ୍ତି ସହାୟତା ମୂଲ୍ୟାୟନ ପାଇଁ ବିଭିନ୍ନ ପରିବେଶୀୟ ସୂଚନା ଉତ୍ସକୁ ଏକତ୍ର କରେ।",
    marineConditions: "ସାମୁଦ୍ରିକ ପରିସ୍ଥିତି",
    environmentalOverview: "ପରିବେଶୀୟ ସମୀକ୍ଷା",
    spatialIntelligence: "ସ୍ଥାନିକ ବୁଦ୍ଧିମତ୍ତା",
    reasoning: "ତର୍କ",
    riskBreakdown: "ବିପଦ ବିଶ୍ଳେଷଣ",
    evidence: "ପ୍ରମାଣ",
    dataVerification: "ତଥ୍ୟ ଯାଞ୍ଚ",
    footerDescription:
      "ସହଯୋଗୀ ଏଜେଣ୍ଟ ସହ ସାମୁଦ୍ରିକ ପରିବେଶ ବିଶ୍ଳେଷଣ",
    footerText: "AI ଆଧାରିତ ସାମୁଦ୍ରିକ ନିଷ୍ପତ୍ତି ସହାୟତା",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ଭାଷା ବାଛନ୍ତୁ · 23 ଭାଷା",
    low: "କମ୍",
    moderate: "ମଧ୍ୟମ",
    high: "ଅଧିକ",
    severe: "ଗୁରୁତର",
  },

  as: {
    marineEcosystem: "সামুদ্ৰিক পৰিৱেশ বুদ্ধিমত্তা",
    systemOnline: "চিস্টেম অনলাইন",
    multiAgent: "মাল্টি-এজেন্ট সামুদ্ৰিক বুদ্ধিমত্তা",
    title1: "সাগৰক বুজক।",
    title2: "ভাল সিদ্ধান্ত লওক।",
    description:
      "ORCA-ই বাস্তৱ সামুদ্ৰিক পৰিস্থিতি বিশ্লেষণ কৰিবলৈ সাগৰ, বতৰ, উপগ্ৰহ আৰু ভৌগোলিক তথ্য একত্ৰিত কৰে।",
    oceanIntelligence: "🌊 মহাসাগৰীয় বুদ্ধিমত্তা",
    weatherAnalysis: "☁ বতৰ বিশ্লেষণ",
    satelliteData: "🛰 উপগ্ৰহ তথ্য",
    gisIntelligence: "📍 GIS বুদ্ধিমত্তা",
    aiReasoning: "🤖 AI বিশ্লেষণ",
    askOrca: "ORCA-ক সোধক",
    questionTitle: "সামুদ্ৰিক পৰিৱেশৰ বিষয়ে প্ৰশ্ন সোধক।",
    questionDescription:
      "আপুনি কি জানিব বিচাৰে ORCA-ক কওক, স্থান আৰু যাত্ৰাৰ সময় বাছনি কৰক।",
    decisionSupport: "● AI সিদ্ধান্ত সহায়",
    collaborativeNetwork: "সহযোগী এজেন্ট নেটৱৰ্ক",
    analyzing: "বিশ্লেষণ চলি আছে",
    systemReady: "চিস্টেম সাজু",
    ocean: "মহাসাগৰ",
    wavesCurrents: "ঢৌ আৰু সোঁত",
    weather: "বতৰ",
    windRainfall: "বতাহ আৰু বৰষুণ",
    satellite: "উপগ্ৰহ",
    marineObservations: "সামুদ্ৰিক পৰ্যবেক্ষণ",
    gis: "GIS",
    locationConstraints: "স্থান সীমাবদ্ধতা",
    orcaReasoner: "ORCA ৰিজনাৰ",
    finalAssessment: "চূড়ান্ত মূল্যায়ন",
    assessment: "ORCA মূল্যায়ন",
    marineRisk: "সামুদ্ৰিক বিপদ মূল্যায়ন",
    liveIntelligence: "লাইভ বুদ্ধিমত্তা",
    recommendation: "ORCA পৰামৰ্শ",
    recommendationDescription:
      "ORCA-ই এই সিদ্ধান্ত সহায় মূল্যায়ন তৈয়াৰ কৰিবলৈ একাধিক পৰিৱেশীয় তথ্য উৎস একত্ৰিত কৰে।",
    marineConditions: "সামুদ্ৰিক পৰিস্থিতি",
    environmentalOverview: "পৰিৱেশীয় পৰ্যালোচনা",
    spatialIntelligence: "স্থানিক বুদ্ধিমত্তা",
    reasoning: "যুক্তি",
    riskBreakdown: "বিপদ বিশ্লেষণ",
    evidence: "প্ৰমাণ",
    dataVerification: "তথ্য যাচাই",
    footerDescription:
      "সহযোগী এজেন্টৰ সৈতে সামুদ্ৰিক পৰিৱেশ বিশ্লেষণ",
    footerText: "AI-চালিত সামুদ্ৰিক সিদ্ধান্ত সহায়",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "ভাষা বাছক · ২৩টা ভাষা",
    low: "কম",
    moderate: "মধ্যম",
    high: "উচ্চ",
    severe: "গুৰুতৰ",
  },

  ur: {
    marineEcosystem: "سمندری ماحولیاتی ذہانت",
    systemOnline: "سسٹم آن لائن",
    multiAgent: "ملٹی ایجنٹ میرین انٹیلی جنس",
    title1: "سمندر کو سمجھیں۔",
    title2: "بہتر فیصلے کریں۔",
    description:
      "ORCA حقیقی سمندری حالات کا تجزیہ کرنے کے لیے سمندری، موسمی، سیٹلائٹ اور جغرافیائی معلومات کو یکجا کرتا ہے۔",
    oceanIntelligence: "🌊 سمندری ذہانت",
    weatherAnalysis: "☁ موسمی تجزیہ",
    satelliteData: "🛰 سیٹلائٹ ڈیٹا",
    gisIntelligence: "📍 GIS ذہانت",
    aiReasoning: "🤖 AI تجزیہ",
    askOrca: "ORCA سے پوچھیں",
    questionTitle: "سمندری ماحول کے بارے میں سوال پوچھیں۔",
    questionDescription:
      "ORCA کو بتائیں کہ آپ کیا جاننا چاہتے ہیں، مقام اور روانگی کا وقت منتخب کریں۔",
    decisionSupport: "● AI فیصلہ معاونت",
    collaborativeNetwork: "تعاونی ایجنٹ نیٹ ورک",
    analyzing: "تجزیہ جاری ہے",
    systemReady: "سسٹم تیار ہے",
    ocean: "سمندر",
    wavesCurrents: "لہریں اور دھارے",
    weather: "موسم",
    windRainfall: "ہوا اور بارش",
    satellite: "سیٹلائٹ",
    marineObservations: "سمندری مشاہدات",
    gis: "GIS",
    locationConstraints: "مقام کی پابندیاں",
    orcaReasoner: "ORCA ریزنر",
    finalAssessment: "حتمی جائزہ",
    assessment: "ORCA جائزہ",
    marineRisk: "سمندری خطرے کا جائزہ",
    liveIntelligence: "لائیو انٹیلی جنس",
    recommendation: "ORCA سفارش",
    recommendationDescription:
      "ORCA اس فیصلہ معاون جائزے کو تیار کرنے کے لیے متعدد ماحولیاتی معلومات کے ذرائع کو یکجا کرتا ہے۔",
    marineConditions: "سمندری حالات",
    environmentalOverview: "ماحولیاتی جائزہ",
    spatialIntelligence: "مقامی ذہانت",
    reasoning: "استدلال",
    riskBreakdown: "خطرے کی تفصیل",
    evidence: "ثبوت",
    dataVerification: "ڈیٹا کی تصدیق",
    footerDescription:
      "تعاونی ایجنٹس کے ساتھ سمندری ماحولیاتی استدلال",
    footerText: "AI سے چلنے والی سمندری فیصلہ معاونت",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "زبان منتخب کریں · 23 زبانیں",
    low: "کم",
    moderate: "درمیانہ",
    high: "زیادہ",
    severe: "شدید",
  },

  ne: {
    marineEcosystem: "समुद्री पारिस्थितिक प्रणाली बुद्धिमत्ता",
    systemOnline: "प्रणाली अनलाइन",
    multiAgent: "बहु-एजेन्ट समुद्री बुद्धिमत्ता",
    title1: "समुद्रलाई बुझ्नुहोस्।",
    title2: "राम्रो निर्णय लिनुहोस्।",
    description:
      "ORCA ले वास्तविक समुद्री अवस्थाहरू विश्लेषण गर्न समुद्र, मौसम, उपग्रह र भौगोलिक जानकारी संयोजन गर्छ।",
    oceanIntelligence: "🌊 महासागर बुद्धिमत्ता",
    weatherAnalysis: "☁ मौसम विश्लेषण",
    satelliteData: "🛰 उपग्रह डेटा",
    gisIntelligence: "📍 GIS बुद्धिमत्ता",
    aiReasoning: "🤖 AI विश्लेषण",
    askOrca: "ORCA लाई सोध्नुहोस्",
    questionTitle: "समुद्री वातावरणबारे प्रश्न सोध्नुहोस्।",
    questionDescription:
      "तपाईं के जान्न चाहनुहुन्छ ORCA लाई भन्नुहोस्, स्थान र प्रस्थान समय छान्नुहोस्।",
    decisionSupport: "● AI निर्णय सहायता",
    collaborativeNetwork: "सहयोगी एजेन्ट नेटवर्क",
    analyzing: "विश्लेषण हुँदैछ",
    systemReady: "प्रणाली तयार",
    ocean: "महासागर",
    wavesCurrents: "छाल र धाराहरू",
    weather: "मौसम",
    windRainfall: "हावा र वर्षा",
    satellite: "उपग्रह",
    marineObservations: "समुद्री अवलोकन",
    gis: "GIS",
    locationConstraints: "स्थान सीमाहरू",
    orcaReasoner: "ORCA रिजनर",
    finalAssessment: "अन्तिम मूल्याङ्कन",
    assessment: "ORCA मूल्याङ्कन",
    marineRisk: "समुद्री जोखिम मूल्याङ्कन",
    liveIntelligence: "लाइभ इन्टेलिजेन्स",
    recommendation: "ORCA सिफारिस",
    recommendationDescription:
      "ORCA ले यो निर्णय सहायता मूल्याङ्कन तयार गर्न धेरै वातावरणीय जानकारी स्रोतहरू संयोजन गर्छ।",
    marineConditions: "समुद्री अवस्थाहरू",
    environmentalOverview: "वातावरणीय अवलोकन",
    spatialIntelligence: "स्थानिक बुद्धिमत्ता",
    reasoning: "तर्क",
    riskBreakdown: "जोखिम विश्लेषण",
    evidence: "प्रमाण",
    dataVerification: "डेटा प्रमाणीकरण",
    footerDescription:
      "सहयोगी एजेन्टहरूसँग समुद्री पारिस्थितिक प्रणाली विश्लेषण",
    footerText: "AI-संचालित समुद्री निर्णय सहायता",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "भाषा चयन गर्नुहोस् · २३ भाषाहरू",
    low: "कम",
    moderate: "मध्यम",
    high: "उच्च",
    severe: "गम्भीर",
  },

  es: {
    marineEcosystem: "Inteligencia del ecosistema marino",
    systemOnline: "Sistema en línea",
    multiAgent: "INTELIGENCIA MARINA MULTIAGENTE",
    title1: "Comprende el océano.",
    title2: "Toma mejores decisiones.",
    description:
      "ORCA combina inteligencia marina, meteorológica, oceánica, satelital y geográfica para analizar las condiciones marinas reales.",
    oceanIntelligence: "🌊 Inteligencia oceánica",
    weatherAnalysis: "☁ Análisis meteorológico",
    satelliteData: "🛰 Datos satelitales",
    gisIntelligence: "📍 Inteligencia GIS",
    aiReasoning: "🤖 Razonamiento de IA",
    askOrca: "PREGUNTA A ORCA",
    questionTitle: "Haz una pregunta sobre el entorno marino.",
    questionDescription:
      "Dile a ORCA qué quieres saber, selecciona una ubicación y elige tu hora de salida.",
    decisionSupport: "● SOPORTE DE DECISIONES IA",
    collaborativeNetwork: "Red de Agentes Colaborativos",
    analyzing: "ANALIZANDO",
    systemReady: "SISTEMA LISTO",
    ocean: "OCÉANO",
    wavesCurrents: "Olas y corrientes",
    weather: "CLIMA",
    windRainfall: "Viento y lluvia",
    satellite: "SATÉLITE",
    marineObservations: "Observaciones marinas",
    gis: "GIS",
    locationConstraints: "Restricciones de ubicación",
    orcaReasoner: "RAZONADOR ORCA",
    finalAssessment: "Evaluación final",
    assessment: "EVALUACIÓN ORCA",
    marineRisk: "Evaluación del riesgo marino",
    liveIntelligence: "INTELIGENCIA EN VIVO",
    recommendation: "RECOMENDACIÓN ORCA",
    recommendationDescription:
      "ORCA combina múltiples fuentes de inteligencia ambiental para generar esta evaluación de apoyo a decisiones.",
    marineConditions: "CONDICIONES MARINAS",
    environmentalOverview: "Resumen ambiental",
    spatialIntelligence: "INTELIGENCIA ESPACIAL",
    reasoning: "RAZONAMIENTO",
    riskBreakdown: "Desglose del riesgo",
    evidence: "EVIDENCIA",
    dataVerification: "Verificación de datos",
    footerDescription:
      "Razonamiento del ecosistema marino con agentes colaborativos",
    footerText: "Soporte de decisiones marinas impulsado por IA",
    footerTech: "SIH 2026 • INTELIGENCIA MARINA",
    selectLanguage: "SELECCIONAR IDIOMA · 23 IDIOMAS",
    low: "BAJO",
    moderate: "MODERADO",
    high: "ALTO",
    severe: "SEVERO",
  },

  fr: {
    marineEcosystem: "Intelligence de l'écosystème marin",
    systemOnline: "Système en ligne",
    multiAgent: "INTELLIGENCE MARINE MULTI-AGENTS",
    title1: "Comprenez l'océan.",
    title2: "Prenez de meilleures décisions.",
    description:
      "ORCA combine les données marines, météorologiques, océaniques, satellitaires et géographiques pour analyser les conditions marines réelles.",
    oceanIntelligence: "🌊 Intelligence océanique",
    weatherAnalysis: "☁ Analyse météorologique",
    satelliteData: "🛰 Données satellitaires",
    gisIntelligence: "📍 Intelligence GIS",
    aiReasoning: "🤖 Raisonnement IA",
    askOrca: "DEMANDEZ À ORCA",
    questionTitle: "Posez une question sur l'environnement marin.",
    questionDescription:
      "Dites à ORCA ce que vous voulez savoir, sélectionnez un emplacement et choisissez votre heure de départ.",
    decisionSupport: "● AIDE À LA DÉCISION IA",
    collaborativeNetwork: "Réseau d'agents collaboratifs",
    analyzing: "ANALYSE",
    systemReady: "SYSTÈME PRÊT",
    ocean: "OCÉAN",
    wavesCurrents: "Vagues et courants",
    weather: "MÉTÉO",
    windRainfall: "Vent et précipitations",
    satellite: "SATELLITE",
    marineObservations: "Observations marines",
    gis: "GIS",
    locationConstraints: "Contraintes de localisation",
    orcaReasoner: "RAISONNEUR ORCA",
    finalAssessment: "Évaluation finale",
    assessment: "ÉVALUATION ORCA",
    marineRisk: "Évaluation du risque marin",
    liveIntelligence: "INTELLIGENCE EN DIRECT",
    recommendation: "RECOMMANDATION ORCA",
    recommendationDescription:
      "ORCA combine plusieurs sources d'intelligence environnementale pour générer cette évaluation d'aide à la décision.",
    marineConditions: "CONDITIONS MARINES",
    environmentalOverview: "Vue d'ensemble environnementale",
    spatialIntelligence: "INTELLIGENCE SPATIALE",
    reasoning: "RAISONNEMENT",
    riskBreakdown: "Répartition des risques",
    evidence: "PREUVES",
    dataVerification: "Vérification des données",
    footerDescription:
      "Raisonnement de l'écosystème marin avec des agents collaboratifs",
    footerText: "Aide à la décision marine alimentée par l'IA",
    footerTech: "SIH 2026 • INTELLIGENCE MARINE",
    selectLanguage: "CHOISIR LA LANGUE · 23 LANGUES",
    low: "FAIBLE",
    moderate: "MODÉRÉ",
    high: "ÉLEVÉ",
    severe: "SÉVÈRE",
  },

  de: {
    marineEcosystem: "Intelligenz des Meeresökosystems",
    systemOnline: "System online",
    multiAgent: "MULTI-AGENTEN-MEERESINTELLIGENZ",
    title1: "Verstehen Sie den Ozean.",
    title2: "Treffen Sie bessere Entscheidungen.",
    description:
      "ORCA kombiniert Meeres-, Wetter-, Ozean-, Satelliten- und geografische Daten zur Analyse realer Meeresbedingungen.",
    oceanIntelligence: "🌊 Meeresintelligenz",
    weatherAnalysis: "☁ Wetteranalyse",
    satelliteData: "🛰 Satellitendaten",
    gisIntelligence: "📍 GIS-Intelligenz",
    aiReasoning: "🤖 KI-Analyse",
    askOrca: "ORCA FRAGEN",
    questionTitle: "Stellen Sie eine Frage zur Meeresumwelt.",
    questionDescription:
      "Teilen Sie ORCA mit, was Sie wissen möchten, wählen Sie einen Standort und Ihre Abfahrtszeit.",
    decisionSupport: "● KI-ENTSCHEIDUNGSUNTERSTÜTZUNG",
    collaborativeNetwork: "Kollaboratives Agentennetzwerk",
    analyzing: "ANALYSE LÄUFT",
    systemReady: "SYSTEM BEREIT",
    ocean: "OZEAN",
    wavesCurrents: "Wellen & Strömungen",
    weather: "WETTER",
    windRainfall: "Wind & Regen",
    satellite: "SATELLIT",
    marineObservations: "Meeresbeobachtungen",
    gis: "GIS",
    locationConstraints: "Standortbeschränkungen",
    orcaReasoner: "ORCA REASONER",
    finalAssessment: "Abschließende Bewertung",
    assessment: "ORCA-BEWERTUNG",
    marineRisk: "Meeresrisikobewertung",
    liveIntelligence: "LIVE-INTELLIGENZ",
    recommendation: "ORCA-EMPFEHLUNG",
    recommendationDescription:
      "ORCA kombiniert mehrere Umweltinformationsquellen, um diese Entscheidungsunterstützung zu erstellen.",
    marineConditions: "MEERESBEDINGUNGEN",
    environmentalOverview: "Umweltübersicht",
    spatialIntelligence: "RÄUMLICHE INTELLIGENZ",
    reasoning: "BEGRÜNDUNG",
    riskBreakdown: "Risikobewertung",
    evidence: "NACHWEISE",
    dataVerification: "Datenüberprüfung",
    footerDescription:
      "Analyse des Meeresökosystems mit kollaborativen Agenten",
    footerText: "KI-gestützte maritime Entscheidungsunterstützung",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "SPRACHE AUSWÄHLEN · 23 SPRACHEN",
    low: "NIEDRIG",
    moderate: "MODERAT",
    high: "HOCH",
    severe: "SCHWER",
  },

  pt: {
    marineEcosystem: "Inteligência do Ecossistema Marinho",
    systemOnline: "Sistema Online",
    multiAgent: "INTELIGÊNCIA MARINHA MULTIAGENTE",
    title1: "Entenda o oceano.",
    title2: "Tome decisões melhores.",
    description:
      "A ORCA combina inteligência marinha, meteorológica, oceânica, satelital e geográfica para analisar condições marinhas reais.",
    oceanIntelligence: "🌊 Inteligência oceânica",
    weatherAnalysis: "☁ Análise meteorológica",
    satelliteData: "🛰 Dados de satélite",
    gisIntelligence: "📍 Inteligência GIS",
    aiReasoning: "🤖 Raciocínio de IA",
    askOrca: "PERGUNTE À ORCA",
    questionTitle: "Faça uma pergunta sobre o ambiente marinho.",
    questionDescription:
      "Diga à ORCA o que você deseja saber, selecione um local e escolha seu horário de partida.",
    decisionSupport: "● SUPORTE À DECISÃO POR IA",
    collaborativeNetwork: "Rede de Agentes Colaborativos",
    analyzing: "ANALISANDO",
    systemReady: "SISTEMA PRONTO",
    ocean: "OCEANO",
    wavesCurrents: "Ondas e correntes",
    weather: "CLIMA",
    windRainfall: "Vento e chuva",
    satellite: "SATÉLITE",
    marineObservations: "Observações marinhas",
    gis: "GIS",
    locationConstraints: "Restrições de localização",
    orcaReasoner: "RAZONADOR ORCA",
    finalAssessment: "Avaliação final",
    assessment: "AVALIAÇÃO ORCA",
    marineRisk: "Avaliação de risco marinho",
    liveIntelligence: "INTELIGÊNCIA AO VIVO",
    recommendation: "RECOMENDAÇÃO ORCA",
    recommendationDescription:
      "A ORCA combina várias fontes de inteligência ambiental para gerar esta avaliação de apoio à decisão.",
    marineConditions: "CONDIÇÕES MARINHAS",
    environmentalOverview: "Visão geral ambiental",
    spatialIntelligence: "INTELIGÊNCIA ESPACIAL",
    reasoning: "RACIOCÍNIO",
    riskBreakdown: "Detalhamento do risco",
    evidence: "EVIDÊNCIAS",
    dataVerification: "Verificação de dados",
    footerDescription:
      "Raciocínio do ecossistema marinho com agentes colaborativos",
    footerText: "Suporte à decisão marinha com IA",
    footerTech: "SIH 2026 • INTELIGÊNCIA MARINHA",
    selectLanguage: "SELECIONE O IDIOMA · 23 IDIOMAS",
    low: "BAIXO",
    moderate: "MODERADO",
    high: "ALTO",
    severe: "SEVERO",
  },

  it: {
    marineEcosystem: "Intelligenza dell'ecosistema marino",
    systemOnline: "Sistema online",
    multiAgent: "INTELLIGENZA MARINA MULTI-AGENTE",
    title1: "Comprendi l'oceano.",
    title2: "Prendi decisioni migliori.",
    description:
      "ORCA combina dati marini, meteorologici, oceanici, satellitari e geografici per analizzare le condizioni marine reali.",
    oceanIntelligence: "🌊 Intelligenza oceanica",
    weatherAnalysis: "☁ Analisi meteorologica",
    satelliteData: "🛰 Dati satellitari",
    gisIntelligence: "📍 Intelligenza GIS",
    aiReasoning: "🤖 Ragionamento IA",
    askOrca: "CHIEDI A ORCA",
    questionTitle: "Fai una domanda sull'ambiente marino.",
    questionDescription:
      "Dì a ORCA cosa vuoi sapere, seleziona una posizione e scegli l'orario di partenza.",
    decisionSupport: "● SUPPORTO DECISIONALE IA",
    collaborativeNetwork: "Rete di agenti collaborativi",
    analyzing: "ANALISI IN CORSO",
    systemReady: "SISTEMA PRONTO",
    ocean: "OCEANO",
    wavesCurrents: "Onde e correnti",
    weather: "METEO",
    windRainfall: "Vento e pioggia",
    satellite: "SATELLITE",
    marineObservations: "Osservazioni marine",
    gis: "GIS",
    locationConstraints: "Vincoli di posizione",
    orcaReasoner: "REASONER ORCA",
    finalAssessment: "Valutazione finale",
    assessment: "VALUTAZIONE ORCA",
    marineRisk: "Valutazione del rischio marino",
    liveIntelligence: "INTELLIGENZA LIVE",
    recommendation: "RACCOMANDAZIONE ORCA",
    recommendationDescription:
      "ORCA combina diverse fonti di informazioni ambientali per generare questa valutazione di supporto decisionale.",
    marineConditions: "CONDIZIONI MARINE",
    environmentalOverview: "Panoramica ambientale",
    spatialIntelligence: "INTELLIGENZA SPAZIALE",
    reasoning: "RAGIONAMENTO",
    riskBreakdown: "Analisi del rischio",
    evidence: "EVIDENZE",
    dataVerification: "Verifica dei dati",
    footerDescription:
      "Ragionamento sull'ecosistema marino con agenti collaborativi",
    footerText: "Supporto decisionale marino basato sull'IA",
    footerTech: "SIH 2026 • INTELLIGENZA MARINA",
    selectLanguage: "SELEZIONA LINGUA · 23 LINGUE",
    low: "BASSO",
    moderate: "MODERATO",
    high: "ALTO",
    severe: "SEVERO",
  },

  ru: {
    marineEcosystem: "Интеллект морской экосистемы",
    systemOnline: "Система онлайн",
    multiAgent: "МУЛЬТИАГЕНТНЫЙ МОРСКОЙ ИНТЕЛЛЕКТ",
    title1: "Понимайте океан.",
    title2: "Принимайте лучшие решения.",
    description:
      "ORCA объединяет морские, погодные, океанические, спутниковые и географические данные для анализа реальных морских условий.",
    oceanIntelligence: "🌊 Океанический интеллект",
    weatherAnalysis: "☁ Анализ погоды",
    satelliteData: "🛰 Спутниковые данные",
    gisIntelligence: "📍 GIS-интеллект",
    aiReasoning: "🤖 ИИ-анализ",
    askOrca: "СПРОСИТЕ ORCA",
    questionTitle: "Задайте вопрос о морской среде.",
    questionDescription:
      "Сообщите ORCA, что хотите узнать, выберите место и время отправления.",
    decisionSupport: "● ПОДДЕРЖКА РЕШЕНИЙ ИИ",
    collaborativeNetwork: "Сеть совместных агентов",
    analyzing: "АНАЛИЗИРУЕТСЯ",
    systemReady: "СИСТЕМА ГОТОВА",
    ocean: "ОКЕАН",
    wavesCurrents: "Волны и течения",
    weather: "ПОГОДА",
    windRainfall: "Ветер и осадки",
    satellite: "СПУТНИК",
    marineObservations: "Морские наблюдения",
    gis: "GIS",
    locationConstraints: "Ограничения местоположения",
    orcaReasoner: "РАССУЖДАТЕЛЬ ORCA",
    finalAssessment: "Итоговая оценка",
    assessment: "ОЦЕНКА ORCA",
    marineRisk: "Оценка морского риска",
    liveIntelligence: "АКТУАЛЬНЫЙ ИНТЕЛЛЕКТ",
    recommendation: "РЕКОМЕНДАЦИЯ ORCA",
    recommendationDescription:
      "ORCA объединяет несколько источников экологической информации для создания этой оценки поддержки решений.",
    marineConditions: "МОРСКИЕ УСЛОВИЯ",
    environmentalOverview: "Обзор окружающей среды",
    spatialIntelligence: "ПРОСТРАНСТВЕННЫЙ ИНТЕЛЛЕКТ",
    reasoning: "РАССУЖДЕНИЕ",
    riskBreakdown: "Разбор риска",
    evidence: "ДОКАЗАТЕЛЬСТВА",
    dataVerification: "Проверка данных",
    footerDescription:
      "Анализ морской экосистемы с помощью совместных агентов",
    footerText: "Морская поддержка решений на основе ИИ",
    footerTech: "SIH 2026 • МОРСКОЙ ИНТЕЛЛЕКТ",
    selectLanguage: "ВЫБЕРИТЕ ЯЗЫК · 23 ЯЗЫКА",
    low: "НИЗКИЙ",
    moderate: "УМЕРЕННЫЙ",
    high: "ВЫСОКИЙ",
    severe: "ТЯЖЕЛЫЙ",
  },

  ja: {
    marineEcosystem: "海洋生態系インテリジェンス",
    systemOnline: "システムオンライン",
    multiAgent: "マルチエージェント海洋インテリジェンス",
    title1: "海を理解する。",
    title2: "より良い意思決定を。",
    description:
      "ORCAは海洋、気象、海況、衛星、地理情報を組み合わせ、実際の海洋状況を分析します。",
    oceanIntelligence: "🌊 海洋インテリジェンス",
    weatherAnalysis: "☁ 気象分析",
    satelliteData: "🛰 衛星データ",
    gisIntelligence: "📍 GISインテリジェンス",
    aiReasoning: "🤖 AI推論",
    askOrca: "ORCAに質問",
    questionTitle: "海洋環境について質問してください。",
    questionDescription:
      "知りたいことをORCAに伝え、場所と出発時刻を選択してください。",
    decisionSupport: "● AI意思決定支援",
    collaborativeNetwork: "協調エージェントネットワーク",
    analyzing: "分析中",
    systemReady: "システム準備完了",
    ocean: "海洋",
    wavesCurrents: "波と海流",
    weather: "天候",
    windRainfall: "風と降水",
    satellite: "衛星",
    marineObservations: "海洋観測",
    gis: "GIS",
    locationConstraints: "位置制約",
    orcaReasoner: "ORCA推論エンジン",
    finalAssessment: "最終評価",
    assessment: "ORCA評価",
    marineRisk: "海洋リスク評価",
    liveIntelligence: "ライブインテリジェンス",
    recommendation: "ORCA推奨",
    recommendationDescription:
      "ORCAは複数の環境情報源を組み合わせ、この意思決定支援評価を生成します。",
    marineConditions: "海洋状況",
    environmentalOverview: "環境概要",
    spatialIntelligence: "空間インテリジェンス",
    reasoning: "推論",
    riskBreakdown: "リスク内訳",
    evidence: "証拠",
    dataVerification: "データ検証",
    footerDescription:
      "協調エージェントによる海洋生態系推論",
    footerText: "AI搭載の海洋意思決定支援",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "言語を選択 · 23言語",
    low: "低",
    moderate: "中",
    high: "高",
    severe: "重大",
  },

  ko: {
    marineEcosystem: "해양 생태계 인텔리전스",
    systemOnline: "시스템 온라인",
    multiAgent: "멀티 에이전트 해양 인텔리전스",
    title1: "바다를 이해하세요.",
    title2: "더 나은 결정을 내리세요.",
    description:
      "ORCA는 해양, 날씨, 위성 및 지리 정보를 결합하여 실제 해양 상황을 분석합니다.",
    oceanIntelligence: "🌊 해양 인텔리전스",
    weatherAnalysis: "☁ 날씨 분석",
    satelliteData: "🛰 위성 데이터",
    gisIntelligence: "📍 GIS 인텔리전스",
    aiReasoning: "🤖 AI 추론",
    askOrca: "ORCA에게 질문",
    questionTitle: "해양 환경에 대해 질문하세요.",
    questionDescription:
      "알고 싶은 내용을 ORCA에 알려주고 위치와 출발 시간을 선택하세요.",
    decisionSupport: "● AI 의사결정 지원",
    collaborativeNetwork: "협업 에이전트 네트워크",
    analyzing: "분석 중",
    systemReady: "시스템 준비 완료",
    ocean: "해양",
    wavesCurrents: "파도와 해류",
    weather: "날씨",
    windRainfall: "바람과 강수량",
    satellite: "위성",
    marineObservations: "해양 관측",
    gis: "GIS",
    locationConstraints: "위치 제약",
    orcaReasoner: "ORCA 추론 엔진",
    finalAssessment: "최종 평가",
    assessment: "ORCA 평가",
    marineRisk: "해양 위험 평가",
    liveIntelligence: "실시간 인텔리전스",
    recommendation: "ORCA 권고",
    recommendationDescription:
      "ORCA는 여러 환경 정보 소스를 결합하여 의사결정 지원 평가를 생성합니다.",
    marineConditions: "해양 상태",
    environmentalOverview: "환경 개요",
    spatialIntelligence: "공간 인텔리전스",
    reasoning: "추론",
    riskBreakdown: "위험 분석",
    evidence: "증거",
    dataVerification: "데이터 검증",
    footerDescription:
      "협업 에이전트를 활용한 해양 생태계 추론",
    footerText: "AI 기반 해양 의사결정 지원",
    footerTech: "SIH 2026 • MARINE INTELLIGENCE",
    selectLanguage: "언어 선택 · 23개 언어",
    low: "낮음",
    moderate: "보통",
    high: "높음",
    severe: "심각",
  },

  ar: {
    marineEcosystem: "ذكاء النظام البيئي البحري",
    systemOnline: "النظام متصل",
    multiAgent: "الذكاء البحري متعدد الوكلاء",
    title1: "افهم المحيط.",
    title2: "اتخذ قرارات أفضل.",
    description:
      "تجمع ORCA بين المعلومات البحرية والطقس والمحيطات والأقمار الصناعية والمعلومات الجغرافية لتحليل الظروف البحرية الحقيقية.",
    oceanIntelligence: "🌊 الذكاء البحري",
    weatherAnalysis: "☁ تحليل الطقس",
    satelliteData: "🛰 بيانات الأقمار الصناعية",
    gisIntelligence: "📍 ذكاء GIS",
    aiReasoning: "🤖 استدلال الذكاء الاصطناعي",
    askOrca: "اسأل ORCA",
    questionTitle: "اطرح سؤالاً حول البيئة البحرية.",
    questionDescription:
      "أخبر ORCA بما تريد معرفته، واختر الموقع ووقت المغادرة.",
    decisionSupport: "● دعم القرار بالذكاء الاصطناعي",
    collaborativeNetwork: "شبكة الوكلاء التعاونية",
    analyzing: "جارٍ التحليل",
    systemReady: "النظام جاهز",
    ocean: "المحيط",
    wavesCurrents: "الأمواج والتيارات",
    weather: "الطقس",
    windRainfall: "الرياح والأمطار",
    satellite: "القمر الصناعي",
    marineObservations: "الملاحظات البحرية",
    gis: "GIS",
    locationConstraints: "قيود الموقع",
    orcaReasoner: "محرك ORCA للاستدلال",
    finalAssessment: "التقييم النهائي",
    assessment: "تقييم ORCA",
    marineRisk: "تقييم المخاطر البحرية",
    liveIntelligence: "الذكاء المباشر",
    recommendation: "توصية ORCA",
    recommendationDescription:
      "تجمع ORCA عدة مصادر للمعلومات البيئية لإنشاء تقييم دعم القرار هذا.",
    marineConditions: "الظروف البحرية",
    environmentalOverview: "نظرة عامة بيئية",
    spatialIntelligence: "الذكاء المكاني",
    reasoning: "الاستدلال",
    riskBreakdown: "تحليل المخاطر",
    evidence: "الأدلة",
    dataVerification: "التحقق من البيانات",
    footerDescription:
      "استدلال النظام البيئي البحري باستخدام وكلاء متعاونين",
    footerText: "دعم القرار البحري المدعوم بالذكاء الاصطناعي",
    footerTech: "SIH 2026 • الذكاء البحري",
    selectLanguage: "اختر اللغة · 23 لغة",
    low: "منخفض",
    moderate: "متوسط",
    high: "مرتفع",
    severe: "شديد",
  },
};

/* =========================================================
   APP
========================================================= */

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [query, setQuery] = useState("");

  const [selectedTime, setSelectedTime] = useState("06:00");
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [assessmentLocation, setAssessmentLocation] =
    useState<AssessmentLocation>({
      name: "Paradip Coast",
      latitude: 20.31,
      longitude: 86.61,
    });

  const [assessment, setAssessment] = useState<Assessment>({
    answer: demoData.answer,

    risk: {
      score: demoData.risk.score,
      level: demoData.risk.level,
      message:
        "Conditions are moderately suitable based on the available marine data.",
    },

    weather: demoData.weather,
    ocean: demoData.ocean,
    satellite: demoData.satellite,
    gis: demoData.gis,
    breakdown: demoData.breakdown,
    verification: demoData.verification,
  });

  /* =========================================================
     LANGUAGE
  ========================================================= */

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("orca-language") || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{
        language?: string;
      }>;

      const newLanguage =
        customEvent.detail?.language || "en";

      setLanguage(
        translations[newLanguage]
          ? newLanguage
          : "en"
      );
    }

    window.addEventListener(
      "orca-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "orca-language-change",
        handleLanguageChange
      );
    };
  }, []);

  const t = (
    key: keyof Translation
  ): string => {
    return (
      translations[language]?.[key] ??
      translations.en[key]
    );
  };

  /* =========================================================
     WELCOME
  ========================================================= */

  function handleWelcomeComplete() {
    setShowWelcome(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function mapBackendResponse(
    result: Awaited<ReturnType<typeof askOrca>>
  ): Assessment {

    const marine =
      result.marine_conditions ?? {};

    const weather =
      marine.weather ?? {};

    const ocean =
      marine.ocean ?? {};

    const risk =
      marine.risk_assessment ?? {};

    const recommendation =
      result.orca_recommendation ?? {};

    const fishingZone =
      result.fishing_zone ?? {};

    const nearestPFZ =
      fishingZone.nearest_pfz ?? null;

    const restrictedZone =
      result.restricted_zone ?? {};


    // Backend ka score roughly 0-11 range mein hai.
    // Frontend RiskCard 0-100 expect karta hai.
    const rawRiskScore =
      Number(
        recommendation.marine_risk_score ??
        risk.risk_score ??
        0
      );


    const frontendRiskScore =
      Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (rawRiskScore / 11) * 100
          )
        )
      );


    const backendRiskLevel =
      String(
        recommendation.marine_risk ??
        risk.risk_level ??
        "Unknown"
      );


    const normalizedBackendRiskLevel =
      backendRiskLevel
        .toUpperCase()
        .replace("MEDIUM", "MODERATE");

    const frontendRiskLevel =
      ["LOW", "MODERATE", "HIGH", "SEVERE"].includes(
        normalizedBackendRiskLevel
      )
        ? normalizedBackendRiskLevel
        : getRiskLevel(frontendRiskScore);


    const temperature =
      Number(
        weather.temperature ?? 0
      );

    const windSpeed =
      Number(
        weather.wind_speed ?? 0
      );

    const precipitation =
      Number(
        weather.precipitation ?? 0
      );

    const waveHeight =
      Number(
        ocean.wave_height ?? 0
      );

    const wavePeriod =
      Number(
        ocean.wave_period ?? 0
      );

    const currentSpeed =
      Number(
        ocean.current_speed ?? 0
      );

    const sst =
      Number(
        ocean.sst ?? 0
      );


    // -------------------------
    // Risk breakdown
    // -------------------------

    let windRisk = 0;

    if (
      windSpeed >= 10 &&
      windSpeed <= 20
    ) {
      windRisk = 1;
    } else if (
      windSpeed > 20 &&
      windSpeed <= 30
    ) {
      windRisk = 2;
    } else if (
      windSpeed > 30
    ) {
      windRisk = 3;
    }


    let waveRisk = 0;

    if (
      waveHeight >= 1 &&
      waveHeight <= 2
    ) {
      waveRisk = 1;
    } else if (
      waveHeight > 2 &&
      waveHeight <= 3
    ) {
      waveRisk = 2;
    } else if (
      waveHeight > 3
    ) {
      waveRisk = 3;
    }


    const weatherRisk =
      precipitation > 5 ? 1 : 0;


    let oceanRisk = 0;

    if (
      currentSpeed >= 1 &&
      currentSpeed <= 2
    ) {
      oceanRisk += 1;
    } else if (
      currentSpeed > 2
    ) {
      oceanRisk += 2;
    }


    if (wavePeriod < 6) {
      oceanRisk += 1;
    }


    // Good PFZ ko thoda positive contribution.
    let pfzRisk = 0;

    if (
      nearestPFZ &&
      (
        nearestPFZ.suitability_level ===
          "High" ||
        nearestPFZ.suitability_level ===
          "Moderate"
      )
    ) {
      pfzRisk = -1;
    }


    const isRestricted =
      Boolean(
        restrictedZone.restricted
      );


    const gisRisk =
      isRestricted ? 3 : 0;


    return {

      answer:
        recommendation.recommendation ??
        risk.recommendation ??
        "Assessment completed.",


      risk: {

        score:
          frontendRiskScore,

        level:
          frontendRiskLevel,

        message:
          recommendation.recommendation ??
          risk.message ??
          "Marine risk assessment completed.",
      },


      weather: {

        temperature,

        wind_speed:
          windSpeed,

        precipitation,
      },


      ocean: {

        wave_height:
          waveHeight,

        wave_period:
          wavePeriod,

        current_speed:
          currentSpeed,

        sst,
      },


      satellite: {

        pfz_available:
          Boolean(nearestPFZ),

        pfz:
          nearestPFZ
            ? (
                nearestPFZ.suitability_level ??
                "Available"
              )
            : "Unavailable",
      },


      gis: {

        restricted_zone:
          isRestricted,

        location_name:
          restrictedZone.zone_name ??
          restrictedZone.reason ??
          (
            isRestricted
              ? "Restricted marine zone"
              : "Selected marine location"
          ),
      },


      breakdown: {

        wind:
          windRisk,

        waves:
          waveRisk,

        weather:
          weatherRisk,

        ocean:
          oceanRisk,

        pfz:
          pfzRisk,

        gis:
          gisRisk,
      },


      verification: {

        verified:
          result.status ===
          "success",  

        // Temporary UI compatibility value.
        // Isko actual confidence/data-quality
        // calculation se later replace karenge.
        confidence:
          result.status ===
          "success"
            ? 0.8
            : 0,
      },
    };
  }
  function getRiskLevel(score: number): string {
    if (score <= 30) return "LOW";
    if (score <= 50) return "MODERATE";
    if (score <= 70) return "HIGH";
    return "SEVERE";
  }

  /* =========================================================
     BACKEND API
  ========================================================= */

  async function analyzeWithBackend(
    data: {
      question: string;
      latitude: number;
      longitude: number;
      datetime: string;
      locationName: string;
    }
  ): Promise<Assessment> {
    const result = await askOrca(data);

    if (result.status !== "success") {
      throw new Error(
        "ORCA backend returned an unsuccessful response."
      );
    }

    return mapBackendResponse(result);
  }

  /* =========================================================
     ASK ORCA
  ========================================================= */

  async function handleAsk(
    data: {
      question: string;
      latitude: number;
      longitude: number;
      datetime: string;
      locationName: string;
    }
  ) {
    setQuery(data.question);

    setAssessmentLocation({
      name: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    const submittedDate =
      data.datetime.split("T")[0] || selectedDate;
    setSelectedDate(submittedDate);

    const submittedTime =
      data.datetime
        .split("T")[1]
        ?.slice(0, 5) ||
      "06:00";

    setSelectedTime(
      submittedTime
    );

    setError(false);
    setLoading(true);
    setShowResults(false);

    try {
      const result =
        await analyzeWithBackend(data);

      setAssessment(result);

    } catch (backendError) {
      console.error("ORCA analysis failed:", backendError);
      setError(true);
      setLoading(false);
      setShowResults(false);
      return;
    }

    setLoading(false);
    setShowResults(true);

    setTimeout(() => {
      document
        .getElementById(
          "assessment-results"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);
  }

  /* =========================================================
     WHAT IF
  ========================================================= */

  async function handleTimeChange(
    time: string
  ) {
    if (time === selectedTime) {
      return;
    }

    setSelectedTime(time);
    setLoading(true);
    setError(false);

    const datetime = `${selectedDate}T${time}`;

    try {
      const result =
        await analyzeWithBackend({
          question: query,

          latitude:
            assessmentLocation.latitude,

          longitude:
            assessmentLocation.longitude,

          datetime,

          locationName:
            assessmentLocation.name,
        });

      setAssessment(result);

    } catch (backendError) {
      console.error("What-if analysis failed:", backendError);
      setError(true);
      setShowResults(false);
    }

    setLoading(false);
  }

  /* =========================================================
     WELCOME
  ========================================================= */

  if (showWelcome) {
    return (
      <WelcomeScreen
        onComplete={
          handleWelcomeComplete
        }
      />
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return <ErrorScreen />;
  }

  /* =========================================================
     MAIN APP
  ========================================================= */

  return (
    <div className="app">

      <Navbar />

      <main>

        {/* HERO */}

        <section className="hero-section">

          <div className="hero-grid" />

          <div className="hero-orb hero-orb-one" />

          <div className="hero-orb hero-orb-two" />

          <div className="hero-content">

            <div className="hero-eyebrow">

              <span className="status-dot" />

              {t("multiAgent")}

            </div>

            <h1>

              {t("title1")}

              <span>
                {t("title2")}
              </span>

            </h1>

            <p className="hero-description">

              {t("description")}

            </p>

            <div className="hero-agent-row">

              <span>
                {t("oceanIntelligence")}
              </span>

              <span>
                {t("weatherAnalysis")}
              </span>

              <span>
                {t("satelliteData")}
              </span>

              <span>
                {t("gisIntelligence")}
              </span>

              <span>
                {t("aiReasoning")}
              </span>

            </div>

          </div>

        </section>

        {/* QUERY */}

        <section className="query-section">

          <div className="section-intro">

            <div>

              <p className="section-label">
                {t("askOrca")}
              </p>

              <h2>

                {t("questionTitle")}

              </h2>

              <p>
                {t("questionDescription")}
              </p>

            </div>

            <div className="query-badge">
              {t("decisionSupport")}
            </div>

          </div>

          <QueryForm
            onAsk={handleAsk}
            loading={loading}
          />

        </section>

        {/* AGENT NETWORK */}

        <section className="agent-network-section">

          <div className="agent-network">

            <div className="agent-network-header">

              <h2>
                {t("collaborativeNetwork")}
              </h2>

              <div className="network-status">

                <span className="status-dot" />

                {loading
                  ? t("analyzing")
                  : t("systemReady")}

              </div>

            </div>

            <div className="agent-flow">

              <div className="agent-node">

                <div className="agent-icon">
                  🌊
                </div>

                <strong>
                  {t("ocean")}
                </strong>

                <span>
                  {t("wavesCurrents")}
                </span>

              </div>

              <div className="flow-arrow">
                →
              </div>

              <div className="agent-node">

                <div className="agent-icon">
                  ☁
                </div>

                <strong>
                  {t("weather")}
                </strong>

                <span>
                  {t("windRainfall")}
                </span>

              </div>

              <div className="flow-arrow">
                →
              </div>

              <div className="agent-node">

                <div className="agent-icon">
                  🛰
                </div>

                <strong>
                  {t("satellite")}
                </strong>

                <span>
                  {t("marineObservations")}
                </span>

              </div>

              <div className="flow-arrow">
                →
              </div>

              <div className="agent-node">

                <div className="agent-icon">
                  📍
                </div>

                <strong>
                  {t("gis")}
                </strong>

                <span>
                  {t("locationConstraints")}
                </span>

              </div>

              <div className="flow-arrow">
                →
              </div>

              <div className="agent-node final-agent">

                <div className="agent-icon">
                  🤖
                </div>

                <strong>
                  {t("orcaReasoner")}
                </strong>

                <span>
                  {t("finalAssessment")}
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* LOADING */}

        {loading && (
          <LoadingScreen />
        )}

        {/* RESULTS */}

        {showResults &&
          !loading && (

            <section
              id="assessment-results"
              className="content-section results-container"
            >

              {/* RESULT HEADER */}

              <div className="result-header">

                <div>

                  <p className="section-label">
                    {t("assessment")}
                  </p>

                  <h2>
                    {t("marineRisk")}
                  </h2>

                  <p className="query-preview">
                    “{query}”
                  </p>

                  <p className="query-location">

                    📍{" "}
                    {assessmentLocation.name}

                    {" · "}

                    🕐{" "}
                    {selectedTime}

                  </p>

                </div>

                <div className="live-badge">

                  <span />

                  {t("liveIntelligence")}

                </div>

              </div>

              {/* RECOMMENDATION */}

              <div className="recommendation-card">

                <div className="recommendation-icon">
                  ✓
                </div>

                <div className="recommendation-content">

                  <span className="section-label">
                    {t("recommendation")}
                  </span>

                  <h3>
                    {assessment.answer}
                  </h3>

                  <p>
                    {t(
                      "recommendationDescription"
                    )}
                  </p>

                </div>

              </div>

              {/* RISK */}

              <div className="result-section">

                <RiskCard
                  score={
                    assessment.risk.score
                  }

                  level={
                    assessment.risk.level
                  }

                  message={
                    assessment.risk.message
                  }
                />

              </div>

              {/* MARINE CONDITIONS */}

              <div className="result-section">

                <div className="section-heading">

                  <p className="section-label">
                    {t("marineConditions")}
                  </p>

                  <h2>
                    {t(
                      "environmentalOverview"
                    )}
                  </h2>

                </div>

                <MarineCards
                  weather={
                    assessment.weather
                  }

                  ocean={
                    assessment.ocean
                  }

                  satellite={
                    assessment.satellite
                  }

                  gis={
                    assessment.gis
                  }
                />

              </div>

              {/* MAP */}

              <div className="result-section">

                <div className="section-heading">

                  <p className="section-label">
                    {t(
                      "spatialIntelligence"
                    )}
                  </p>

                  <h2>
                    {assessmentLocation.name}
                  </h2>

                </div>

                <MarineMap
                  latitude={
                    assessmentLocation.latitude
                  }

                  longitude={
                    assessmentLocation.longitude
                  }

                  locationName={
                    assessmentLocation.name
                  }
                />

              </div>

              {/* RISK BREAKDOWN */}

              <div className="result-section">

                <div className="section-heading">

                  <p className="section-label">
                    {t("reasoning")}
                  </p>

                  <h2>
                    {t("riskBreakdown")}
                  </h2>

                </div>

                <RiskBreakdown
                  breakdown={
                    assessment.breakdown
                  }
                />

              </div>

              {/* EVIDENCE */}

              <div className="result-section">

                <div className="section-heading">

                  <p className="section-label">
                    {t("evidence")}
                  </p>

                  <h2>
                    {t(
                      "dataVerification"
                    )}
                  </h2>

                </div>

                <EvidencePanel
                  verification={
                    assessment.verification
                  }
                />

              </div>

              {/* WHAT IF */}

              <div className="result-section">

                <WhatIfPanel
                  selectedTime={
                    selectedTime
                  }

                  onTimeChange={
                    handleTimeChange
                  }

                  loading={
                    loading
                  }
                />

              </div>

            </section>
          )}

      </main>

      {/* FOOTER */}

      <footer>

        <div className="footer-brand">

          <div className="footer-logo">
            🐋
          </div>

          <div>

            <strong>
              ORCA
            </strong>

            <span>
              {t("footerDescription")}
            </span>

          </div>

        </div>

        <p>
          {t("footerText")}
        </p>

        <div className="footer-tech">
          {t("footerTech")}
        </div>

      </footer>

    </div>
  );
}

export default App;