export interface Options {
    minColLength?: number;
    minRowLength?: number;
    showContextmenu?: boolean;
    showAttachmentPreviewButton?: boolean;
    showAttachmentDownloadButton?: boolean;
}
declare const VueOfficeExcel: {
    install?: (vue: any) => void;
    src: string|ArrayBuffer|Blob;
    requestOptions?: any;
    options?: Options;
};
export default  VueOfficeExcel;