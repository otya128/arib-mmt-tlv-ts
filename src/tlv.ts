import { BinaryReader } from "./utils";

export const TLV_HEADER_SIZE = 4;

// Header compression for broadcasting (HCfB)
export type IPv6Header = {
    version: number;
    trafficClass: number;
    flowLabel: number;
    nextHeader: number;
    hopLimit: number;
    sourceAddress: Uint8Array;
    destinationAddress: Uint8Array;
};

export function readHCfBIPv6Header(reader: BinaryReader): IPv6Header | undefined {
    if (!reader.canRead(4 + 1 + 1 + 16 + 16)) {
        return undefined;
    }
    const h = reader.readUint32();
    const version = (h >>> 28) & 0xf;
    const trafficClass = (h >>> 20) & 0xff;
    const flowLabel = h & 0xfffff;
    const nextHeader = reader.readUint8();
    const hopLimit = reader.readUint8();
    const sourceAddress = reader.slice(16);
    const destinationAddress = reader.slice(16);
    return {
        version,
        trafficClass,
        flowLabel,
        nextHeader,
        hopLimit,
        sourceAddress,
        destinationAddress,
    };
}

export function readHCfBUDPHeader(reader: BinaryReader): UDPHeader | undefined {
    if (!reader.canRead(2 + 2)) {
        return undefined;
    }
    const sourcePort = reader.readUint16();
    const destinationPort = reader.readUint16();
    return {
        sourcePort,
        destinationPort,
    };
}

export function readIPv6Header(
    reader: BinaryReader
): (IPv6Header & { payloadLength: number }) | undefined {
    if (!reader.canRead(4 + 2 + 1 + 1 + 16 + 16)) {
        return undefined;
    }
    const h = reader.readUint32();
    const version = (h >>> 28) & 0xf;
    const trafficClass = (h >>> 20) & 0xff;
    const flowLabel = h & 0xfffff;
    const payloadLength = reader.readUint16();
    const nextHeader = reader.readUint8();
    const hopLimit = reader.readUint8();
    const sourceAddress = reader.slice(16);
    const destinationAddress = reader.slice(16);
    return {
        version,
        trafficClass,
        flowLabel,
        nextHeader,
        hopLimit,
        sourceAddress,
        destinationAddress,
        payloadLength,
    };
}

export function readUDPHeader(
    reader: BinaryReader
): (UDPHeader & { length: number; checksum: number }) | undefined {
    if (!reader.canRead(2 + 2 + 2 + 2)) {
        return undefined;
    }
    const sourcePort = reader.readUint16();
    const destinationPort = reader.readUint16();
    const length = reader.readUint16();
    const checksum = reader.readUint16();
    return {
        sourcePort,
        destinationPort,
        length,
        checksum,
    };
}

export type UDPHeader = {
    sourcePort: number;
    destinationPort: number;
};

export type TLVContext =
    | { cid: number }
    | {
          cid: number;
          headerType: "IPv6";
          ipv6Header: IPv6Header;
          udpHeader: UDPHeader;
      };
