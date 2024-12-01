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
};
