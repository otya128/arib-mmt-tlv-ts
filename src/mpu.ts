import { BinaryReader } from "./utils";

export type MediaProcessingUnit = TimedMFUMediaProcessingUnit | NonTimedMFUMediaProcessingUnit;

export type TimedMFUMediaProcessingUnit = {
    fragmentType: "mfu";
    timedFlag: true;
    fragmentationIndicator: number;
    aggregationFlag: boolean;
    fragmentCounter: number;
    mpuSequenceNumber: number;
    mfuList: TimedMediaFragmentUnit[];
};

export type NonTimedMFUMediaProcessingUnit = {
    fragmentType: "mfu";
    timedFlag: false;
    fragmentationIndicator: number;
    aggregationFlag: boolean;
    fragmentCounter: number;
    mpuSequenceNumber: number;
    mfuList: NonTimedMediaFragmentUnit[];
};

export type TimedMediaFragmentUnit = {
    movieFragmentSequenceNumber: number;
    sampleNumber: number;
    offset: number;
    priority: number;
    dependencyCounter: number;
    mfuData: Uint8Array;
};

export type NonTimedMediaFragmentUnit = {
    itemId: number;
    mfuData: Uint8Array;
};

// unused
// const MMTP_FRAGMENT_TYPE_MPU_METADATA = 0;
// const MMTP_FRAGMENT_TYPE_MF_METADATA = 1;
const MMTP_FRAGMENT_TYPE_MFU = 2;

export function readMPU(buffer: Uint8Array): MediaProcessingUnit | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 4)) {
        return undefined;
    }
    const h = reader.readUint8();
    // always 2
    const fragmentType = h >> 4;
    const timedFlag = !!((h >> 3) & 1);
    const fragmentationIndicator = (h >> 1) & 3;
    const aggregationFlag = !!(h & 1);
    // always 0 (unused)
    const fragmentCounter = reader.readUint8();
    const mpuSequenceNumber = reader.readUint32();
    if (fragmentType !== MMTP_FRAGMENT_TYPE_MFU) {
        return undefined;
    }
    if (timedFlag) {
        const mfuList: TimedMediaFragmentUnit[] = [];
        if (!aggregationFlag) {
            if (!reader.canRead(4 + 4 + 4 + 1 + 1)) {
                return;
            }
            // always 0 (unused)
            const movieFragmentSequenceNumber = reader.readUint32();
            // always 0 (unused)
            const sampleNumber = reader.readUint32();
            // always 0 (unused)
            const offset = reader.readUint32();
            // always 0 (unused)
            const priority = reader.readUint8();
            // always 0 (unused)
            const dependencyCounter = reader.readUint8();
            const mfuData = buffer.subarray(reader.tell());
            mfuList.push({
                movieFragmentSequenceNumber,
                sampleNumber,
                offset,
                priority,
                dependencyCounter,
                mfuData,
            });
        } else {
            while (reader.canRead(2)) {
                const dataUnitLength = reader.readUint16();
                if (!reader.canRead(dataUnitLength)) {
                    break;
                }
                if (dataUnitLength < 4 + 4 + 4 + 1 + 1) {
                    break;
                }
                // always 0 (unused)
                const movieFragmentSequenceNumber = reader.readUint32();
                // always 0 (unused)
                const sampleNumber = reader.readUint32();
                // always 0 (unused)
                const offset = reader.readUint32();
                // always 0 (unused)
                const priority = reader.readUint8();
                // always 0 (unused)
                const dependencyCounter = reader.readUint8();
                const mfuData = reader.subarray(dataUnitLength - 4 - 4 - 4 - 1 - 1);
                mfuList.push({
                    movieFragmentSequenceNumber,
                    sampleNumber,
                    offset,
                    priority,
                    dependencyCounter,
                    mfuData,
                });
            }
        }
        return {
            fragmentType: "mfu",
            timedFlag,
            fragmentationIndicator,
            aggregationFlag,
            fragmentCounter,
            mpuSequenceNumber,
            mfuList,
        };
    } else {
        const mfuList: NonTimedMediaFragmentUnit[] = [];
        if (!aggregationFlag) {
            if (!reader.canRead(4)) {
                return;
            }
            const itemId = reader.readUint32();
            const mfuData = buffer.subarray(reader.tell());
            mfuList.push({
                itemId,
                mfuData,
            });
        } else {
            while (reader.canRead(2)) {
                const dataUnitLength = reader.readUint16();
                if (!reader.canRead(dataUnitLength)) {
                    break;
                }
                if (dataUnitLength < 4) {
                    break;
                }
                const itemId = reader.readUint32();
                const mfuData = reader.subarray(dataUnitLength - 4);
                mfuList.push({
                    itemId,
                    mfuData,
                });
            }
        }
        return {
            fragmentType: "mfu",
            timedFlag,
            fragmentationIndicator,
            aggregationFlag,
            fragmentCounter,
            mpuSequenceNumber,
            mfuList,
        };
    }
}
