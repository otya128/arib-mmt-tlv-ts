import { readTLVSI } from "./tlv-si";
import { MMTPReader as MMTPReader } from "./mmtp";
import { TLV_HEADER_SIZE } from "./tlv";
import { MMTTLVReaderEventMap, MMTTLVReaderEventTarget } from "./event";
import { CustomEventTarget } from "./event-target";

export const TLV_SYNC_BYTE = 0x7f;
// unused
// const TLV_PACKET_TYPE_IPV4 = 0x01;
export const TLV_PACKET_TYPE_IPV6 = 0x02;
export const TLV_PACKET_TYPE_COMPRESSED = 0x03;
export const TLV_PACKET_TYPE_SI = 0xfe;
export const TLV_PACKET_TYPE_NULL = 0xff;
// unused
// const CID_HEADER_TYPE_IPV4_UDP_FULL = 0x20;
// const CID_HEADER_TYPE_IDENTIFICATION = 0x21;
export const CID_HEADER_TYPE_IPV6_UDP_FULL = 0x60;
export const CID_HEADER_TYPE_COMPRESSED = 0x61;

export function createMMTTLVReader(): MMTTLVReader {
    return new MMTTLVReader();
}

export type TLVPacket = {
    packetType: number;
    payload: Uint8Array;
};

export type CompressedIPv6UDPTLVPacket = {
    contextId: number;
    sequenceNumber: number;
    ipHeader: Uint8Array;
    udpHeader: Uint8Array;
};

export class MMTTLVReader {
    private buffer: Uint8Array;
    private mmtpReader: MMTPReader;
    private eventTarget?: MMTTLVReaderEventTarget;
    constructor() {
        this.buffer = new Uint8Array(0);
        this.eventTarget = new CustomEventTarget<MMTTLVReaderEventMap>();
        this.mmtpReader = new MMTPReader(this.eventTarget);
    }
    private onSI(tlvPacket: Uint8Array) {
        const si = readTLVSI(tlvPacket);
        if (si != null) {
            if (si.tableId === "TLV-NIT[actual]" || si.tableId === "TLV-NIT[other]") {
                this.eventTarget?.dispatchEvent("nit", { table: si });
            }
        }
    }
    addEventListener<K extends keyof MMTTLVReaderEventMap>(
        type: K,
        callback: (event: MMTTLVReaderEventMap[K]) => void
    ) {
        this.eventTarget?.addEventListener(type, callback);
    }

    removeEventListener<K extends keyof MMTTLVReaderEventMap>(
        type: K,
        callback: (event: MMTTLVReaderEventMap[K]) => void
    ) {
        this.eventTarget?.removeEventListener(type, callback);
    }

    close() {
        delete this.eventTarget;
    }

    reset() {
        this.buffer = new Uint8Array(0);
        this.mmtpReader.reset();
    }

    push(block: Uint8Array) {
        if (block.length === 0) {
            return;
        }
        const buffer = new Uint8Array(this.buffer.length + block.length);
        buffer.set(this.buffer);
        buffer.set(block, this.buffer.length);
        this.buffer = buffer;
        while (this.buffer.length !== 0) {
            const [consumed, tlvPacket] = process(this.buffer);
            if (consumed === 0) {
                break;
            }
            this.buffer = this.buffer.subarray(consumed);
            if (tlvPacket != null) {
                const packetType = tlvPacket[1];
                if (packetType === TLV_PACKET_TYPE_SI) {
                    this.onSI(tlvPacket);
                }
                if (packetType === TLV_PACKET_TYPE_IPV6) {
                    // NTP (clock reference)
                }
                if (packetType === TLV_PACKET_TYPE_COMPRESSED) {
                    if (tlvPacket.length < TLV_HEADER_SIZE + 4) {
                        continue;
                    }
                    const cid =
                        ((tlvPacket[TLV_HEADER_SIZE] << 8) | tlvPacket[TLV_HEADER_SIZE + 1]) >> 4;
                    const sn = tlvPacket[TLV_HEADER_SIZE + 1] & 0xf;
                    const cidHeaderType = tlvPacket[TLV_HEADER_SIZE + 2];
                    if (cidHeaderType === CID_HEADER_TYPE_IPV6_UDP_FULL) {
                        // ignore
                        // const ipv6Header = tlvPacket.subarray(TLV_HEADER_SIZE + 4, TLV_HEADER_SIZE + 4 + 38);
                        // const udpHeader = tlvPacket.subarray(TLV_HEADER_SIZE + 4 + 38, TLV_HEADER_SIZE + 4 + 38 + 4);
                        if (tlvPacket.length < TLV_HEADER_SIZE + 3 + 38 + 4) {
                            continue;
                        }
                        this.mmtpReader.push(tlvPacket, TLV_HEADER_SIZE + 3 + 38 + 4);
                    } else if (cidHeaderType === CID_HEADER_TYPE_COMPRESSED) {
                        this.mmtpReader.push(tlvPacket, TLV_HEADER_SIZE + 3);
                    }
                }
            }
        }
    }
}

function process(buffer: Uint8Array): [number, Uint8Array | undefined] {
    const syncIndex = buffer.indexOf(TLV_SYNC_BYTE);
    if (syncIndex === -1) {
        return [buffer.length, undefined];
    }
    if (buffer.length < syncIndex + TLV_HEADER_SIZE) {
        return [syncIndex, undefined];
    }
    const packetType = buffer[syncIndex + 1];
    if (
        packetType !== TLV_PACKET_TYPE_IPV6 &&
        packetType !== TLV_PACKET_TYPE_COMPRESSED &&
        packetType !== TLV_PACKET_TYPE_SI &&
        packetType !== TLV_PACKET_TYPE_NULL
    ) {
        if (packetType === TLV_SYNC_BYTE) {
            return [syncIndex + 1, undefined];
        } else {
            return [syncIndex + 2, undefined];
        }
    }
    const length = (buffer[syncIndex + 2] << 8) | buffer[syncIndex + 3];
    if (buffer.length < syncIndex + TLV_HEADER_SIZE + length) {
        return [syncIndex, undefined];
    }
    return [
        syncIndex + TLV_HEADER_SIZE + length,
        buffer.subarray(syncIndex, syncIndex + TLV_HEADER_SIZE + length),
    ];
}
