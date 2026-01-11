import { CustomEventTarget } from "../event-target";
import { TSReaderEventMap, TSReaderEventTarget } from "./event";
import { SectionReader } from "./section-reader";
import { TSPacket } from "./packet";

const TS_SYNC_BYTE = 0x47;

export class TSReader {
    private buffer: Uint8Array = new Uint8Array(0);
    private minSyncCount = 6;
    private packetSize?: number;
    private eventTarget?: TSReaderEventTarget = new CustomEventTarget();
    private sectionReader = new SectionReader(this.eventTarget);
    private bytes_ = 0;
    get bytes() {
        return this.bytes_;
    }
    constructor() {}
    addEventListener<K extends keyof TSReaderEventMap>(
        type: K,
        callback: (event: TSReaderEventMap[K]) => void
    ) {
        this.eventTarget?.addEventListener(type, callback);
    }

    removeEventListener<K extends keyof TSReaderEventMap>(
        type: K,
        callback: (event: TSReaderEventMap[K]) => void
    ) {
        this.eventTarget?.removeEventListener(type, callback);
    }

    close() {
        delete this.eventTarget;
    }

    reset() {
        this.buffer = new Uint8Array(0);
        this.sectionReader.reset();
        this.bytes_ = 0;
    }

    private processPacket(offset: number, packet: Uint8Array) {
        const transportErrorIndicator = !!(packet[1] & 0x80);
        if (transportErrorIndicator) {
            return;
        }
        const payloadUnitStartIndicator = !!(packet[1] & 0x40);
        const transportPriority = !!(packet[1] & 0x20);
        const pid = ((packet[1] << 8) | packet[2]) & 0x1fff;
        const transportScramblingControl = (packet[3] >> 6) & 3;
        const adaptationFieldControl = (packet[3] >> 4) & 3;
        const continuityCounter = packet[3] & 15;
        let payloadOffset = 4;
        if (adaptationFieldControl === 0b10 || adaptationFieldControl === 0b11) {
            const adaptationFieldLength = packet[4];
            payloadOffset += 1 + adaptationFieldLength;
        }
        if (transportScramblingControl !== 0) {
            return;
        }
        if (adaptationFieldControl !== 0b01 && adaptationFieldControl !== 0b11) {
            return;
        }
        const payload = packet.subarray(payloadOffset);
        const tsPacket: TSPacket = {
            transportErrorIndicator,
            payloadUnitStartIndicator,
            transportPriority,
            pid,
            transportScramblingControl,
            adaptationFieldControl,
            continuityCounter,
            payload,
        };
        this.eventTarget?.dispatchEvent("packet", { offset, packet: tsPacket });
        this.sectionReader.push(tsPacket);
    }
    push(block: Uint8Array) {
        const offset = this.bytes_ - this.buffer.length;
        this.bytes_ += block.length;
        const buffer = new Uint8Array(this.buffer.length + block.length);
        buffer.set(this.buffer);
        buffer.set(block, this.buffer.length);
        this.buffer = buffer;
        let packetSize = this.packetSize;
        let packetOffset = 0;
        if (packetSize == null) {
            const result = resync(this.buffer, this.minSyncCount);
            if (result == null) {
                if (this.buffer.length > this.minSyncCount * 204 * 2) {
                    this.buffer = new Uint8Array(0);
                }
                return;
            }
            packetSize = result.packetSize;
            packetOffset = result.packetOffset;
            this.packetSize = packetSize;
        }
        while (this.buffer.length - packetOffset >= packetSize) {
            const packet = this.buffer.subarray(packetOffset, packetOffset + 188);
            packetOffset += packetSize;
            if (packet[0] != TS_SYNC_BYTE) {
                this.buffer = this.buffer.subarray(packetOffset);
                packetOffset = 0;
                const result = resync(this.buffer, this.minSyncCount);
                if (result == null) {
                    if (this.buffer.length > this.minSyncCount * 204 * 2) {
                        this.buffer = new Uint8Array(0);
                    }
                    return;
                }
                packetSize = result.packetSize;
                packetOffset = result.packetOffset;
                this.packetSize = packetSize;
                continue;
            }
            this.processPacket(offset + packetOffset, packet);
        }
        this.buffer = this.buffer.slice(packetOffset);
    }
}

function resync(
    buffer: Uint8Array,
    minSyncCount: number
): { packetSize: number; packetOffset: number } | undefined {
    for (const packetSize of [188, 192, 204]) {
        for (let offset = 0; offset + packetSize * minSyncCount < buffer.length; offset++) {
            let synced = true;
            for (let count = 0; count < minSyncCount; count++) {
                if (buffer[offset + count * packetSize] != TS_SYNC_BYTE) {
                    synced = false;
                    break;
                }
            }
            if (synced) {
                return {
                    packetSize,
                    packetOffset: offset,
                };
            }
        }
    }
    return undefined;
}
