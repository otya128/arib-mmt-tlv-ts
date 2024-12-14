import { readTLVSI } from "./tlv-si";
import { MMTPReader as MMTPReader, MMTPacketStatistics } from "./mmtp";
import { TLVContext, TLV_HEADER_SIZE, readHCfBIPv6Header, readHCfBUDPHeader } from "./tlv";
import { MMTTLVReaderEventMap, MMTTLVReaderEventTarget } from "./event";
import { CustomEventTarget } from "./event-target";
import { readNTPPacket } from "./ntp";
import { BinaryReader } from "./utils";

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

const IPV6_HEADER_SIZE = 40;
const IP_PROTOCOL_NUMBER_UDP = 0b00010001;
const UDP_HEADER_SIZE = 8;

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

type ContextState = {
    sequenceNumber: number;
    context: TLVContext;
};

export class MMTTLVReader {
    private buffer: Uint8Array;
    private mmtpReader: MMTPReader;
    private eventTarget?: MMTTLVReaderEventTarget;
    private bytes_ = 0;
    private contexts: Map<number, ContextState> = new Map();
    get bytes() {
        return this.bytes_;
    }
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
        this.bytes_ = 0;
        this.contexts.clear();
    }

    mmtStatistics(): Map<number, MMTPacketStatistics> {
        return this.mmtpReader.statistics();
    }

    private processNTP(offset: number, tlvPacket: Uint8Array) {
        if (!this.eventTarget?.getListenerCount("ntp")) {
            return;
        }
        if (tlvPacket.length < TLV_HEADER_SIZE + IPV6_HEADER_SIZE) {
            return;
        }
        const ipv6PayloadLength =
            (tlvPacket[TLV_HEADER_SIZE + 4] << 8) | tlvPacket[TLV_HEADER_SIZE + 5];
        const nextHeader = tlvPacket[TLV_HEADER_SIZE + 6];
        if (ipv6PayloadLength + TLV_HEADER_SIZE + IPV6_HEADER_SIZE > tlvPacket.length) {
            return;
        }
        if (nextHeader !== IP_PROTOCOL_NUMBER_UDP) {
            return;
        }
        const udpPayloadLength =
            (tlvPacket[TLV_HEADER_SIZE + IPV6_HEADER_SIZE + 4] << 8) |
            tlvPacket[TLV_HEADER_SIZE + IPV6_HEADER_SIZE + 5];
        if (
            udpPayloadLength < UDP_HEADER_SIZE ||
            udpPayloadLength + TLV_HEADER_SIZE + IPV6_HEADER_SIZE > tlvPacket.length
        ) {
            return;
        }
        const ntp = readNTPPacket(
            tlvPacket.subarray(
                TLV_HEADER_SIZE + IPV6_HEADER_SIZE + UDP_HEADER_SIZE,
                TLV_HEADER_SIZE + IPV6_HEADER_SIZE + udpPayloadLength
            )
        );
        if (ntp != null) {
            this.eventTarget?.dispatchEvent("ntp", { offset, ntp });
        }
    }

    push(block: Uint8Array) {
        if (block.length === 0) {
            return;
        }
        const buffer = new Uint8Array(this.buffer.length + block.length);
        buffer.set(this.buffer);
        const offset = this.bytes_ - this.buffer.length;
        this.bytes_ += block.length;
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
                    // NTP (clock reference)]
                    this.processNTP(offset + tlvPacket.byteOffset, tlvPacket);
                }
                if (packetType === TLV_PACKET_TYPE_COMPRESSED) {
                    if (tlvPacket.length < TLV_HEADER_SIZE + 4) {
                        continue;
                    }
                    const cid =
                        ((tlvPacket[TLV_HEADER_SIZE] << 8) | tlvPacket[TLV_HEADER_SIZE + 1]) >> 4;
                    const sn = tlvPacket[TLV_HEADER_SIZE + 1] & 0xf;
                    const cidHeaderType = tlvPacket[TLV_HEADER_SIZE + 2];
                    const context = this.contexts.get(cid);
                    if (cidHeaderType === CID_HEADER_TYPE_IPV6_UDP_FULL) {
                        // ignore
                        const reader = new BinaryReader(tlvPacket, TLV_HEADER_SIZE + 3);
                        const ipv6Header = readHCfBIPv6Header(reader);
                        if (ipv6Header == null) {
                            continue;
                        }
                        const udpHeader = readHCfBUDPHeader(reader);
                        if (udpHeader == null) {
                            continue;
                        }
                        if (context != null) {
                            context.context = {
                                cid,
                                headerType: "IPv6",
                                ipv6Header,
                                udpHeader,
                            };
                            const expected = (context.sequenceNumber + 1) & 0xf;
                            context.sequenceNumber = sn;
                            if (expected !== sn) {
                                const pos = reader.tell();
                                const packetId =
                                    tlvPacket.length >= pos + 2
                                        ? (tlvPacket[pos] << 8) | tlvPacket[pos + 1]
                                        : undefined;
                                this.eventTarget?.dispatchEvent("tlvDiscontinuity", {
                                    context: context.context,
                                    expected,
                                    actual: sn,
                                    packetId,
                                });
                            }
                            this.mmtpReader.push(tlvPacket, reader.tell(), context.context);
                        } else {
                            const c: ContextState = { sequenceNumber: sn, context: { cid } };
                            this.contexts.set(cid, c);
                            this.mmtpReader.push(tlvPacket, reader.tell(), c.context);
                        }
                    } else if (cidHeaderType === CID_HEADER_TYPE_COMPRESSED) {
                        if (context != null) {
                            const expected = (context.sequenceNumber + 1) & 0xf;
                            context.sequenceNumber = sn;
                            if (expected !== sn) {
                                const pos = TLV_HEADER_SIZE + 3 + 2;
                                const packetId =
                                    tlvPacket.length >= pos + 2
                                        ? (tlvPacket[pos] << 8) | tlvPacket[pos + 1]
                                        : undefined;
                                this.eventTarget?.dispatchEvent("tlvDiscontinuity", {
                                    context: context.context,
                                    expected,
                                    actual: sn,
                                    packetId,
                                });
                            }
                            this.mmtpReader.push(tlvPacket, TLV_HEADER_SIZE + 3, context.context);
                        } else {
                            const c: ContextState = { sequenceNumber: sn, context: { cid } };
                            this.contexts.set(cid, c);
                            this.mmtpReader.push(tlvPacket, TLV_HEADER_SIZE + 3, c.context);
                        }
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
