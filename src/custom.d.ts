declare module 'css-font-parser' {
  export interface ParsedFont {
    'font-family'?: string[];
    'font-style'?: string;
    'font-size'?: string;
    'font-weight'?: string;
    'font-variant'?: string;
    'font-stretch'?: string;
    'line-height'?: string;
  };

  function parseFont(font: string): ParsedFont | null;
  function parseFontFamily(font: string): ParsedFont | null;
};
