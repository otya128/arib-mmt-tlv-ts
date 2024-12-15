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
    MHApplicationInformationTable,
    DataDirectoryManagementTable,
    DataAssetManagementTable,
    EventMessageTable,
} from "./mmt-si";
import { MediaProcessingUnit } from "./mpu";
import { NTPPacket } from "./ntp";
import { TLVContext } from "./tlv";
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
    ait: MMTSIEvent<MHApplicationInformationTable>;
    ddmt: MMTSIEvent<DataDirectoryManagementTable>;
    damt: MMTSIEvent<DataAssetManagementTable>;
    emt: MMTSIEvent<EventMessageTable>;
    mpu: MediaProcessingUnitEvent;
    ntp: NTPEvent;
    tlvDiscontinuity: TLVDiscontinuityEvent;
    mmtDiscontinuity: MMTDiscontinuityEvent;
    scrambled: ScrambledEvent;
}

export type MMTTLVReaderEventTarget = CustomEventTarget<MMTTLVReaderEventMap>;

export type MMTSIEvent<T> = { packetId: number; table: T };

export type TLVSIEvent<T> = { table: T };

export type MediaProcessingUnitEvent = { mmtHeader: MMTHeader; mpu: MediaProcessingUnit };

export type NTPEvent = { offset: number; ntp: NTPPacket };

export type TLVDiscontinuityEvent = {
    context: TLVContext;
    expected: number;
    actual: number;
    packetId?: number;
};

export type ScrambledEvent = {
    packetId: number;
    context: TLVContext;
};

export type MMTDiscontinuityEvent = {
    packetId: number;
    expected: number;
    actual: number;
    context: TLVContext;
};
