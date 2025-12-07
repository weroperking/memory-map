declare module 'exif-js' {
  interface EXIFStatic {
    getData(img: HTMLImageElement | File, callback: () => void): void;
    getTag(img: HTMLImageElement | File, tag: string): any;
    getAllTags(img: HTMLImageElement | File): Record<string, any>;
    pretty(img: HTMLImageElement | File): string;
  }
  const EXIF: EXIFStatic;
  export default EXIF;
}
