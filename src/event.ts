import { CustomEventTarget } from "./event-target";
import { MMTHeader } from "./mmt-header";
import {
    MHEventInformationTable,
    MHServiceDescriptionTable,
    MHCommonDataTable,
    MHTimeOffsetTable,
    MHBroadcasterInformationTable,
    PackageListTable,
    MMTPackageTable,
} from "./mmt-si";
import { MediaProcessingUnit } from "./mpu";
import { TLVNetworkInformationTable } from "./tlv-si";

export interface MMTTLVReaderEventMap {
    nit: TLVSIEvent<TLVNetworkInformationTable>;
    eit: MMTSIEvent<MHEventInformationTable>;
    sdt: MMTSIEvent<MHServiceDescriptionTable>;
    cdt: MMTSIEvent<MHCommonDataTable>;
    tot: MMTSIEvent<MHTimeOffsetTable>;
    bit: MMTSIEvent<MHBroadcasterInformationTable>;
    plt: MMTSIEvent<PackageListTable>;
    mpt: MMTSIEvent<MMTPackageTable>;
    mpu: MediaProcessingUnitEvent;
}

export type MMTTLVReaderEventTarget = CustomEventTarget<MMTTLVReaderEventMap>;

export type MMTSIEvent<T> = { packetId: number; table: T };

export type TLVSIEvent<T> = { table: T };

export type MediaProcessingUnitEvent = { mmtHeader: MMTHeader; mpu: MediaProcessingUnit };
