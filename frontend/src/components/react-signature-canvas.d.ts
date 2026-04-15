declare module 'react-signature-canvas' {
  import * as React from 'react';

  export interface SignatureCanvasProps {
    penColor?: string;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    backgroundColor?: string;
    clearOnResize?: boolean;
    throttle?: number;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    isEmpty(): boolean;
    clear(): void;
    getCanvas(): HTMLCanvasElement;
    toDataURL(type?: string, encoderOptions?: number): string;
  }
}