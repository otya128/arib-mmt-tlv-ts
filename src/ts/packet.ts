export type TSPacket = {
    transportErrorIndicator: boolean;
    payloadUnitStartIndicator: boolean;
    transportPriority: boolean;
    pid: number;
    transportScramblingControl: number;
    adaptationFieldControl: number;
    continuityCounter: number;
    payload: Uint8Array;
};
