declare global {
  interface OrcaSpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface OrcaSpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }

  interface OrcaSpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: (() => void) | null;
    onresult: ((event: OrcaSpeechRecognitionEvent) => void) | null;
    onerror: ((event: OrcaSpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface OrcaSpeechRecognitionConstructor {
    new (): OrcaSpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: OrcaSpeechRecognitionConstructor;
    webkitSpeechRecognition?: OrcaSpeechRecognitionConstructor;
  }
}

export {};
