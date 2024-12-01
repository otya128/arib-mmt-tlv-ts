import { BinaryReader, concatBuffers } from "../utils";
import { TSReaderEventTarget } from "./event";
import { TSPacket } from "./packet";
import { readSection } from "./si";

type SectionBuffer = {
    continuityCounter: number;
    sectionLength: number;
    receivedLength: number;
    payloads: Uint8Array[];
};

function getSectionLength(payload: Uint8Array): number | undefined {
    if (payload.length < 3) {
        return undefined;
    }
    if (payload[0] === 0x00 && payload[1] === 0x00 && payload[2] === 0x01) {
        return undefined; // PES
    }
    const pointer = payload[0] + 1;
    if (payload.length <= pointer + 2) {
        return undefined;
    }
    const reserved = (payload[pointer + 1] >> 4) & 3;
    if (reserved != 3) {
        return undefined;
    }
    const sectionLength = ((payload[pointer + 1] << 8) | payload[pointer + 2]) & 0xfff;
    return sectionLength;
}

export const PID_PAT = 0x0000;
export const PID_CAT = 0x0001;
export const PID_NIT = 0x0010;
export const PID_SDT = 0x0011;
export const PID_EIT = 0x0012;
export const PID_M_EIT = 0x0026;
export const PID_L_EIT = 0x0027;
export const PID_TOT = 0x0014;
export const PID_SDTT = 0x0023;
export const PID_SDTT_UPPER = 0x0028;
export const PID_BIT = 0x0024;
export const PID_CDT = 0x0029;

export class SectionReader {
    eventTarget?: TSReaderEventTarget;
    constructor(eventTarget?: TSReaderEventTarget) {
        this.eventTarget = eventTarget;
    }
    buffer: Map<number, SectionBuffer> = new Map();
    reset() {
        this.buffer.clear();
        delete this.eventTarget;
    }
    processSection(pid: number, payload: Uint8Array) {
        const section = readSection(payload);
        if (section == null) {
            return;
        }
        switch (pid) {
            case PID_PAT:
                if (section.tableId === "PAT") {
                    this.eventTarget?.dispatchEvent("pat", { pid, section });
                }
                break;
            case PID_NIT:
                if (section.tableId === "NIT[actual]" || section.tableId === "NIT[other]") {
                    this.eventTarget?.dispatchEvent("nit", { pid, section });
                }
                break;
            case PID_EIT:
            case PID_M_EIT:
            case PID_L_EIT:
                if (
                    section.tableId === "EIT[p/f]" ||
                    section.tableId === "EIT[schedule basic]" ||
                    section.tableId === "EIT[schedule extended]"
                ) {
                    this.eventTarget?.dispatchEvent("eit", { pid, section });
                }
                break;
            case PID_SDT:
                if (section.tableId === "SDT[actual]" || section.tableId === "SDT[other]") {
                    this.eventTarget?.dispatchEvent("sdt", { pid, section });
                }
                break;
            case PID_CDT:
                if (section.tableId === "CDT") {
                    this.eventTarget?.dispatchEvent("cdt", { pid, section });
                }
                break;
            case PID_TOT:
                if (section.tableId === "TOT") {
                    this.eventTarget?.dispatchEvent("tot", { pid, section });
                }
                break;
            case PID_BIT:
                if (section.tableId === "BIT") {
                    this.eventTarget?.dispatchEvent("bit", { pid, section });
                }
                break;
            default:
                if (section.tableId === "PMT") {
                    this.eventTarget?.dispatchEvent("pmt", { pid, section });
                } else if (
                    section.tableId === "DDB" ||
                    section.tableId === "DII" ||
                    section.tableId === "streamDescriptor"
                ) {
                    this.eventTarget?.dispatchEvent("dsmcc", { pid, section });
                }
                break;
        }
    }
    push(packet: TSPacket) {
        let buffer = this.buffer.get(packet.pid);
        if (packet.payloadUnitStartIndicator) {
            const sectionLength = getSectionLength(packet.payload);
            this.buffer.delete(packet.pid);
            const pointer = packet.payload[0] + 1;
            if (buffer != null) {
                const p = packet.payload.subarray(1, pointer);
                buffer.payloads.push(p);
                buffer.receivedLength += p.length;
                if (buffer.receivedLength >= buffer.sectionLength + 3) {
                    this.processSection(packet.pid, concatBuffers(buffer.payloads));
                    this.buffer.delete(packet.pid);
                }
            }
            if (sectionLength == null) {
                return;
            }
            const payload = packet.payload.slice(pointer);
            buffer = {
                continuityCounter: packet.continuityCounter,
                sectionLength,
                receivedLength: payload.length,
                payloads: [payload],
            };
            this.buffer.set(packet.pid, buffer);
        } else {
            if (buffer == null) {
                return;
            }
            if (buffer.continuityCounter === packet.continuityCounter) {
                // duplicate?
                return;
            }
            if (((buffer.continuityCounter + 1) & 15) !== packet.continuityCounter) {
                // discontinuity
                this.buffer.delete(packet.pid);
                return;
            }
            buffer.continuityCounter = packet.continuityCounter;
            buffer.payloads.push(packet.payload);
            buffer.receivedLength += packet.payload.length;
        }
        if (buffer.receivedLength >= buffer.sectionLength + 3) {
            this.processSection(packet.pid, concatBuffers(buffer.payloads));
            this.buffer.delete(packet.pid);
        }
    }
}
