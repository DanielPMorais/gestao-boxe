import SignatureCanvasModule from 'react-signature-canvas';

export type SignatureCanvasInstance = {
  isEmpty(): boolean;
  clear(): void;
  getCanvas(): HTMLCanvasElement;
  toDataURL(type?: string, encoderOptions?: number): string;
};

export type SignatureCanvasProps = {
  penColor?: string;
  canvasProps?: import('react').CanvasHTMLAttributes<HTMLCanvasElement>;
  backgroundColor?: string;
  clearOnResize?: boolean;
  throttle?: number;
};

const signatureCanvas = (
  (SignatureCanvasModule as unknown as { default?: typeof SignatureCanvasModule })?.default ??
  SignatureCanvasModule
) as typeof SignatureCanvasModule;

export default signatureCanvas;