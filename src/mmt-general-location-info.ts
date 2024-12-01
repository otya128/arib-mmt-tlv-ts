import { BinaryReader } from "./utils";

export type MMTGeneralLocationInfo = MMTSameDataflowLocationInfo;

export type MMTSameDataflowLocationInfo = {
    locationType: "sameDataflow";
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
        default:
            return undefined;
    }
}
