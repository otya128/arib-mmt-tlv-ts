import { BinaryReader } from "./utils";

export type MMTGeneralLocationInfo = MMTSameDataflowLocationInfo | MMTIPv6Dataflow;

export type MMTSameDataflowLocationInfo = {
    locationType: "sameDataflow";
    packetId: number;
};

export type MMTIPv6Dataflow = {
    locationType: "ipv6Dataflow";
    ipv6SourceAddress: Uint8Array;
    ipv6DestAddress: Uint8Array;
    destPort: number;
    packetId: number;
};

export function readMMTGeneralLocationInfo(
    reader: BinaryReader
): MMTGeneralLocationInfo | undefined {
    if (!reader.canRead(1)) {
        return undefined;
    }
    const locationType = reader.readUint8();
    switch (locationType) {
        case 0x00:
            if (!reader.canRead(2)) {
                return undefined;
            }
            return {
                locationType: "sameDataflow",
                packetId: reader.readUint16(),
            };
        case 0x02:
            if (!reader.canRead(16 + 16 + 2 + 2)) {
                return undefined;
            }
            return {
                locationType: "ipv6Dataflow",
                ipv6SourceAddress: reader.slice(16),
                ipv6DestAddress: reader.slice(16),
                destPort: reader.readUint16(),
                packetId: reader.readUint16(),
            };
        default:
            return undefined;
    }
}
