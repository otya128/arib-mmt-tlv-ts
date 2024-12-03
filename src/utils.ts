import { NTP64Timestamp } from "./ntp";

export class BinaryReader {
    buffer: Uint8Array;
    view: DataView;
    offset: number;
    constructor(buffer: Uint8Array, offset?: number) {
        this.buffer = buffer;
        this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        this.offset = offset ?? 0;
    }
    readUint8(): number {
        this.offset += 1;
        return this.view.getUint8(this.offset - 1);
    }
    readInt16(): number {
        this.offset += 2;
        return this.view.getInt16(this.offset - 2);
    }
    readUint16(): number {
        this.offset += 2;
        return this.view.getUint16(this.offset - 2);
    }
    readUint24(): number {
        const h = this.view.getUint16(this.offset);
        const l = this.view.getUint8(this.offset + 2);
        this.offset += 3;
        return (h << 8) | l;
    }
    readUint32(): number {
        this.offset += 4;
        return this.view.getUint32(this.offset - 4);
    }
    readUint40(): number {
        const h = this.view.getUint32(this.offset);
        const l = this.view.getUint8(this.offset + 4);
        this.offset += 5;
        return h * 256 + l;
    }
    readNTP64Timestamp(): NTP64Timestamp {
        const seconds = this.readUint32();
        const fractional = this.readUint32();
        if (seconds & (1 << 31)) {
            return {
                seconds,
                fractional,
            };
        }
        return {
            seconds: seconds + (1 << 32),
            fractional,
        };
    }
    slice(bytes?: number): Uint8Array {
        if (bytes == null) {
            const r = this.buffer.slice(this.offset);
            this.offset = this.buffer.length;
            return r;
        }
        this.offset += bytes;
        return this.buffer.slice(this.offset - bytes, this.offset);
    }
    subarray(bytes?: number): Uint8Array {
        if (bytes == null) {
            const r = this.buffer.slice(this.offset);
            this.offset = this.buffer.length;
            return r;
        }
        this.offset += bytes;
        return this.buffer.subarray(this.offset - bytes, this.offset);
    }
    skip(bytes: number) {
        this.offset += bytes;
    }
    tell(): number {
        return this.offset;
    }
    canRead(bytes: number): boolean {
        return this.view.byteLength >= bytes + this.offset;
    }
}

export function concatBuffers(buffers: Uint8Array[]): Uint8Array {
    if (buffers.length === 1) {
        return buffers[0];
    }
    const total = buffers.reduce((p, c) => p + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const buffer of buffers) {
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}

export function fourCC(c: string): number {
    const c0 = c.charCodeAt(0) & 255;
    const c1 = c.charCodeAt(1) & 255;
    const c2 = c.charCodeAt(2) & 255;
    const c3 = c.charCodeAt(3) & 255;
    return (c0 << 24) | (c1 << 16) | (c2 << 8) | c3;
}

export function threeCC(c: string): number {
    const c0 = c.charCodeAt(0) & 255;
    const c1 = c.charCodeAt(1) & 255;
    const c2 = c.charCodeAt(2) & 255;
    return (c0 << 16) | (c1 << 8) | c2;
}

export function mjdToUnixEpoch(mjd: number): number {
    return (mjd - 40587) * 86400;
}

export function bcdTimeToSeconds(bcd: number): number {
    const h0 = (bcd >> 20) & 0xf;
    const h1 = (bcd >> 16) & 0xf;
    const m0 = (bcd >> 12) & 0xf;
    const m1 = (bcd >> 8) & 0xf;
    const s0 = (bcd >> 4) & 0xf;
    const s1 = bcd & 0xf;
    const h = h0 * 10 + h1;
    const m = m0 * 10 + m1;
    const s = s0 * 10 + s1;
    return h * 3600 + m * 60 + s;
}

export function mjdBCDToUnixEpoch(mjdbcd: number): number {
    const mjd = Math.floor(mjdbcd / (1 << 24));
    return mjdToUnixEpoch(mjd) + bcdTimeToSeconds(mjdbcd) - 3600 * 9; /* JST (UTC+9) offset */
}

export function ipv4ToString(address: ArrayLike<number>): string {
    return `${address[0]}.${address[1]}.${address[2]}.${address[3]}`;
}

export function ipv6ToString(address: ArrayLike<number>): string {
    let result = "";
    let maxZeroCount = 0;
    let maxZeroOffset = -1;
    let zeroOffset = 0;
    let zeroCount = 0;
    for (let i = 0; i < 16; i += 2) {
        let field = (address[i] << 8) | address[i + 1];
        if (field === 0) {
            zeroCount += 2;
        } else {
            zeroCount = 0;
            zeroOffset = i;
        }
        if (maxZeroCount < zeroCount) {
            maxZeroCount = zeroCount;
            maxZeroOffset = zeroOffset;
        }
    }
    for (let i = 0; i < 16; i += 2) {
        let field = (address[i] << 8) | address[i + 1];
        if (maxZeroCount > 2 && i > maxZeroOffset && i <= maxZeroOffset + maxZeroCount) {
            if (i === maxZeroOffset + maxZeroCount) {
                result += ":";
            }
            continue;
        }
        result += field.toString(16);
        if (i + 2 < 16) {
            result += ":";
        }
    }
    return result;
}
