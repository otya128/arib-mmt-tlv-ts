import { BinaryReader } from "./utils";

export type NTP64Timestamp = {
    seconds: number;
    fractional: number;
};

export type NTPPacket = {
    leapIndicator: number;
    /** 0x4 */
    version: number;
    /** 0x5 */
    mode: number;
    /** 0x00 */
    stratum: number;
    poll: number;
    /** 0x00000000 */
    precision: number;
    /** 0x00000000 */
    rootDelay: number;
    /** 0x00000000 */
    rootDispersion: number;
    /** 0x00000000 */
    referenceIdentification: number;
    /** 0x0000000000000000 */
    referenceTimestamp: NTP64Timestamp;
    /** 0x0000000000000000 */
    originTimestamp: NTP64Timestamp;
    /** 0x0000000000000000 */
    receiveTimestamp: NTP64Timestamp;
    transmitTimestamp: NTP64Timestamp;
    // exntension field 1, exntension field 2, key identifier, digest (unused)
};

export function readNTPPacket(payload: Uint8Array): NTPPacket | undefined {
    const reader = new BinaryReader(payload);
    if (!reader.canRead(4 + 4 * 3 + 8 * 4)) {
        return undefined;
    }
    const h = reader.readUint8();
    const leapIndicator = h >> 6;
    const version = (h >> 3) & 7;
    const mode = h & 7;
    const stratum = reader.readUint8();
    const poll = reader.readUint8();
    const precision = reader.readUint8();
    const rootDelay = reader.readUint32();
    const rootDispersion = reader.readUint32();
    const referenceIdentification = reader.readUint32();
    const referenceTimestamp = reader.readNTP64Timestamp();
    const originTimestamp = reader.readNTP64Timestamp();
    const receiveTimestamp = reader.readNTP64Timestamp();
    const transmitTimestamp = reader.readNTP64Timestamp();
    return {
        leapIndicator,
        version,
        mode,
        stratum,
        poll,
        precision,
        rootDelay,
        rootDispersion,
        referenceIdentification,
        referenceTimestamp,
        originTimestamp,
        receiveTimestamp,
        transmitTimestamp,
    };
}

export function ntp64TimestampToDate({ seconds, fractional }: NTP64Timestamp) {
    return new Date((seconds + fractional * Math.pow(2, -32)) * 1000);
}

export function ntp64TimestampToSeconds({ seconds, fractional }: NTP64Timestamp): number {
    return seconds + fractional * Math.pow(2, -32);
}
