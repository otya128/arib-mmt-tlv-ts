export type MMTHeader = {
    version: number;
    fecType: number;
    extensionFlag: boolean;
    rapFlag: boolean;
    payloadType: number;
    packetId: number;
    timestamp: number;
    packetSequenceNumber: number;
    packetCounter?: number;
    headerExtensions: MMTHeaderExtension[];
};

export type MMTHeaderExtension = MMTHeaderExtensionDownloadId | MMTHeaderExtensionItemFragmentation;

export type MMTHeaderExtensionDownloadId = {
    headerType: "downloadId";
    downloadId: number;
};
export type MMTHeaderExtensionItemFragmentation = {
    headerType: "itemFragmentation";
    itemFragmentNumber: number;
    lastItemFragmentNumber: number;
};
