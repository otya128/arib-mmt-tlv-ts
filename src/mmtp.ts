import { MMTTLVReaderEventTarget } from "./event";
import { MMTHeader } from "./mmt-header";
import { readMessages as readMessage } from "./mmt-si";
import { readMPU } from "./mpu";
import { BinaryReader, concatBuffers } from "./utils";

const MMTP_PAYLOAD_TYPE_MPU = 0x00;
const MMTP_PAYLOAD_TYPE_SI = 0x02;

export const MMTP_FRAGMENTATION_INDICATOR_COMPLETE = 0b00;
export const MMTP_FRAGMENTATION_INDICATOR_HEAD = 0b01;
export const MMTP_FRAGMENTATION_INDICATOR_MIDDLE = 0b10;
export const MMTP_FRAGMENTATION_INDICATOR_TAIL = 0b11;

export const MMT_PID_PLT = 0x0000;
export const MMT_PID_CAT = 0x0001;
export const MMT_PID_EIT = 0x8000;
export const MMT_PID_BIT = 0x8002;
export const MMT_PID_SDTT = 0x8003;
export const MMT_PID_SDT = 0x8004;
export const MMT_PID_TOT = 0x8005;
export const MMT_PID_CDT = 0x8006;

const MMT_MULTI_TYPE_HEADER_EXTENSION_SCRAMBLE = 0x0001;
const MMT_SCRAMBLE_CONTROL_NONE = 0b00;

export class MMTPReader {
    siPacketQueue: Map<number, Uint8Array[]>;
    eventTarget: MMTTLVReaderEventTarget;
    constructor(eventTarget: MMTTLVReaderEventTarget) {
        this.eventTarget = eventTarget;
        this.siPacketQueue = new Map();
    }

    reset() {
        this.siPacketQueue.clear();
    }

    onSI(packetId: number, payloads: Uint8Array[]) {
        const message = readMessage(concatBuffers(payloads));
        if (message == null) {
            return;
        }
        switch (message.messageId) {
            case "PA":
                if (packetId === MMT_PID_PLT && message.tables[0]?.tableId === "PLT") {
                    const plt = message.tables[0];
                    this.eventTarget.dispatchEvent("plt", { packetId, table: plt });
                } else if (message.tables[0]?.tableId === "MPT") {
                    this.eventTarget.dispatchEvent("mpt", { packetId, table: message.tables[0] });
                }
                break;
            case "M2section":
                switch (packetId) {
                    case MMT_PID_SDT:
                        if (
                            message.table.tableId === "SDT[actual]" ||
                            message.table.tableId === "SDT[other]"
                        ) {
                            this.eventTarget.dispatchEvent("sdt", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    case MMT_PID_CDT:
                        if (message.table.tableId === "CDT") {
                            this.eventTarget.dispatchEvent("cdt", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    case MMT_PID_BIT:
                        if (message.table.tableId === "BIT") {
                            this.eventTarget.dispatchEvent("bit", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    case MMT_PID_EIT:
                        if (
                            message.table.tableId === "EIT[p/f]" ||
                            message.table.tableId === "EIT[schedule basic]" ||
                            message.table.tableId === "EIT[schedule extended]"
                        ) {
                            this.eventTarget.dispatchEvent("eit", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                }
                break;
            case "M2shortSection":
                if (packetId === MMT_PID_TOT) {
                    this.eventTarget.dispatchEvent("tot", { packetId, table: message.table });
                }
                break;
        }
    }

    push(packet: Uint8Array, offset: number) {
        const reader = new BinaryReader(packet, offset);
        if (!reader.canRead(1 + 1 + 2 + 4 + 4)) {
            return;
        }
        const flags = reader.readUint8();
        // always 0
        const version = flags >> 6;
        // always 0
        const packetCounterFlag = !!((flags >> 5) & 1);
        // always 0
        const fecType = (flags >> 4) & 3;
        const extensionFlag = !!((flags >> 1) & 1);
        const rapFlag = !!(flags & 1);
        const payloadType = reader.readUint8() & ((1 << 6) - 1);
        const packetId = reader.readUint16();
        const timestamp = reader.readUint32();
        const packetSequenceNumber = reader.readUint32();
        if (packetCounterFlag && !reader.canRead(4)) {
            return;
        }
        const packetCounter = packetCounterFlag ? reader.readUint32() : undefined;
        if (extensionFlag) {
            if (!reader.canRead(4)) {
                return;
            }
            // always 0
            const extensionType = reader.readUint16();
            const extensionLength = reader.readUint16();
            if (!reader.canRead(extensionLength)) {
                return;
            }
            const ext = reader.subarray(extensionLength);
            for (let i = 0; extensionType == 0x0000 && i + 4 <= ext.length; ) {
                const hdr = (ext[i] << 8) | ext[i + 1];
                const hdrExtEndFlag = !!(hdr >> 15);
                if (hdrExtEndFlag) {
                    break;
                }
                const hdrExtType = hdr & 0x7fff;
                const hdrExtLength = (ext[i + 2] << 8) | ext[i + 3];
                i += 4;
                if (i + hdrExtLength > ext.length) {
                    break;
                }
                switch (hdrExtType) {
                    case MMT_MULTI_TYPE_HEADER_EXTENSION_SCRAMBLE:
                        if (hdrExtLength < 1) {
                            break;
                        }
                        const control = (ext[i] >> 3) & 3;
                        if (control !== MMT_SCRAMBLE_CONTROL_NONE) {
                            return;
                        }
                        break;
                }
                i += hdrExtLength;
            }
        }
        if (payloadType === MMTP_PAYLOAD_TYPE_MPU) {
            if (this.eventTarget.getListenerCount("mpu") === 0) {
                return;
            }
            if (!reader.canRead(2)) {
                return;
            }
            const payloadLength = reader.readUint16();
            if (!reader.canRead(payloadLength)) {
                return;
            }
            const mpu = readMPU(reader.subarray(payloadLength));
            if (mpu != null) {
                const mmtHeader: MMTHeader = {
                    version,
                    fecType,
                    extensionFlag,
                    rapFlag,
                    payloadType,
                    packetId,
                    timestamp,
                    packetSequenceNumber,
                    packetCounter,
                };
                this.eventTarget.dispatchEvent("mpu", {
                    mmtHeader,
                    mpu,
                });
            }
        } else if (payloadType === MMTP_PAYLOAD_TYPE_SI) {
            if (!reader.canRead(2)) {
                return;
            }
            if (packetId === MMT_PID_SDT && this.eventTarget.getListenerCount("sdt") === 0) {
                return;
            }
            if (packetId === MMT_PID_CDT && this.eventTarget.getListenerCount("cdt") === 0) {
                return;
            }
            if (packetId === MMT_PID_BIT && this.eventTarget.getListenerCount("bit") === 0) {
                return;
            }
            if (packetId === MMT_PID_EIT && this.eventTarget.getListenerCount("eit") === 0) {
                return;
            }
            if (packetId === MMT_PID_TOT && this.eventTarget.getListenerCount("tot") === 0) {
                return;
            }
            const h = reader.readUint8();
            const fragmentationIndicator = h >> 6;
            // always 0
            const lengthExtensionFlag = !!((h >> 1) & 1);
            // always 0
            const aggregationFlag = !!(h & 1);
            // always 0
            const fragmentCounter = reader.readUint8();
            if (!aggregationFlag) {
                const payload = packet.slice(reader.tell());
                if (fragmentationIndicator === MMTP_FRAGMENTATION_INDICATOR_COMPLETE) {
                    this.onSI(packetId, [payload]);
                    this.siPacketQueue.delete(packetId);
                } else if (fragmentationIndicator === MMTP_FRAGMENTATION_INDICATOR_HEAD) {
                    this.siPacketQueue.set(packetId, [payload]);
                } else {
                    const entry = this.siPacketQueue.get(packetId);
                    if (entry != null) {
                        entry.push(payload);
                        if (fragmentationIndicator === MMTP_FRAGMENTATION_INDICATOR_TAIL) {
                            this.onSI(packetId, entry);
                        }
                    }
                }
            }
        }
    }
}
