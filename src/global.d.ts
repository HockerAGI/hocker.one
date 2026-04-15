export {};

declare global {
  interface ISpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface ISpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: {
      readonly length: number;
      item(index: number): {
        readonly isFinal: boolean;
        readonly length: number;
        item(index: number): { transcript: string; confidence: number };
        [index: number]: { transcript: string; confidence: number };
      };
      [index: number]: {
        readonly isFinal: boolean;
        readonly length: number;
        item(index: number): { transcript: string; confidence: number };
        [index: number]: { transcript: string; confidence: number };
      };
    };
  }

  interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
  }

  interface SpeechRecognitionConstructor {
    new (): ISpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}