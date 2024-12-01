import { BinaryReader } from "../utils";
import { Descriptor, readDescriptors } from "./si-descriptor";

export const TABLE_ID_PAT = 0x00;
export const TABLE_ID_CAT = 0x01;
export const TABLE_ID_PMT = 0x02;
export const TABLE_ID_DSMCC_DII = 0x3b;
export const TABLE_ID_DSMCC_DDB = 0x3c;
export const TABLE_ID_DSMCC_STREAM_DESCRIPTOR = 0x3d;
export const TABLE_ID_NIT_ACTUAL = 0x40;
export const TABLE_ID_NIT_OTHER = 0x41;
export const TABLE_ID_SDT_ACTUAL = 0x42;
export const TABLE_ID_SDT_OTHER = 0x46;
export const TABLE_ID_EIT_ACTUAL_PF = 0x4e;
export const TABLE_ID_EIT_OTHER_PF = 0x4f;
export const TABLE_ID_EIT_ACTUAL_SCHEDULE_BASIC_BEGIN = 0x50;
export const TABLE_ID_EIT_ACTUAL_SCHEDULE_BASIC_END = 0x57;
export const TABLE_ID_EIT_ACTUAL_SCHEDULE_EXTENDED_BEGIN = 0x58;
export const TABLE_ID_EIT_ACTUAL_SCHEDULE_EXTENDED_END = 0x5f;
export const TABLE_ID_EIT_OTHER_SCHEDULE_BASIC_BEGIN = 0x60;
export const TABLE_ID_EIT_OTHER_SCHEDULE_BASIC_END = 0x67;
export const TABLE_ID_EIT_OTHER_SCHEDULE_EXTENDED_BEGIN = 0x68;
export const TABLE_ID_EIT_OTHER_SCHEDULE_EXTENDED_END = 0x6f;
export const TABLE_ID_ST = 0x72;
export const TABLE_ID_TOT = 0x73;
export const TABLE_ID_SDTT = 0xc3;
export const TABLE_ID_BIT = 0xc4;
export const TABLE_ID_NBIT_MSG = 0xc5;
export const TABLE_ID_NBIT_REF = 0xc6;
export const TABLE_ID_LDT = 0xc7;
export const TABLE_ID_CDT = 0xc8;
export const TABLE_ID_ECM = 0x82;
export const TABLE_ID_EMM = 0x84;

export type Section =
    | ProgramAssociationSection
    | ConditionalAccessSection
    | ProgramMapSection
    | NetworkInformationSection
    | BroadcasterInformationSection
    | ServiceDescriptionSection
    | EventInformationSection
    | DownloadInfoIndicationSection
    | DownloadDataBlockSection
    | StreamDescriptorSection
    | TimeOffsetSection
    | CommonDataSection;

export function readSection(buffer: Uint8Array): Section | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const tableId = reader.readUint8();
    const h = reader.readUint16();
    const sectionLength = h & 0xfff;
    if (!reader.canRead(sectionLength)) {
        return undefined;
    }
    const payload = reader.subarray(sectionLength - 4 /* CRC_32 or checksum */);
    const crc32 = reader.readUint32();
    let section: Section | undefined;
    if (tableId >= TABLE_ID_EIT_ACTUAL_PF && tableId <= TABLE_ID_EIT_OTHER_SCHEDULE_EXTENDED_END) {
        section = readEIT(tableId, payload);
    } else {
        switch (tableId) {
            case TABLE_ID_PAT:
                section = readPAT(payload);
                break;
            case TABLE_ID_CAT:
                section = readCAT(payload);
                break;
            case TABLE_ID_PMT:
                section = readPMT(payload);
                break;
            case TABLE_ID_DSMCC_DII:
                section = readDII(payload);
                break;
            case TABLE_ID_DSMCC_DDB:
                section = readDDB(payload);
                break;
            case TABLE_ID_DSMCC_STREAM_DESCRIPTOR:
                section = readStreamDescriptorSection(payload);
                break;
            case TABLE_ID_NIT_ACTUAL:
            case TABLE_ID_NIT_OTHER:
                section = readNIT(tableId, payload);
                break;
            case TABLE_ID_BIT:
                section = readBIT(payload);
                break;
            case TABLE_ID_SDT_ACTUAL:
            case TABLE_ID_SDT_OTHER:
                section = readSDT(tableId, payload);
                break;
            case TABLE_ID_ST:
                return undefined;
            case TABLE_ID_ECM:
            case TABLE_ID_EMM:
                return undefined;
            case TABLE_ID_SDTT:
                return undefined;
            case TABLE_ID_CDT:
                section = readCDT(payload);
                break;
            case TABLE_ID_TOT:
                section = readTOT(payload);
                break;
            default:
                return undefined;
        }
    }
    if (section != null) {
        return section;
    }
    return undefined;
}

export type ProgramAssociationSection = {
    tableId: "PAT";
    transportStreamId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    programs: Program[];
};

export type Program =
    | {
          programNumber: 0x0000;
          networkPID: number;
      }
    | {
          programNumber: number;
          programMapPID: number;
      };

export function readPAT(buffer: Uint8Array): ProgramAssociationSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1)) {
        return undefined;
    }
    const transportStreamId = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const programs: Program[] = [];
    while (reader.canRead(4)) {
        const programNumber = reader.readUint16();
        if (programNumber === 0) {
            programs.push({
                programNumber,
                networkPID: reader.readUint16() & 0x1fff,
            });
        } else {
            programs.push({
                programNumber,
                programMapPID: reader.readUint16() & 0x1fff,
            });
        }
    }
    return {
        tableId: "PAT",
        transportStreamId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        programs,
    };
}

export type ConditionalAccessSection = {
    tableId: "CAT";
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    descriptors: Descriptor[];
};

export function readCAT(buffer: Uint8Array): ConditionalAccessSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1)) {
        return undefined;
    }
    reader.readUint16(); // reserved
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const descriptors = readDescriptors(reader.subarray());
    return {
        tableId: "CAT",
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        descriptors,
    };
}

export type ProgramMapSection = {
    tableId: "PMT";
    programNumber: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    pcrPID: number;
    programInfo: Descriptor[];
    streams: PMTStream[];
};

export type PMTStream = {
    streamType: number;
    elementaryPID: number;
    esInfo: Descriptor[];
};

export function readPMT(buffer: Uint8Array): ProgramMapSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2 + 2)) {
        return undefined;
    }
    const programNumber = reader.readUint16() & 0xfff;
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const pcrPID = reader.readUint16() & 0x1fff;
    const programInfoLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(programInfoLength)) {
        return undefined;
    }
    const programInfo = readDescriptors(reader.subarray(programInfoLength));
    const streams: PMTStream[] = [];
    while (reader.canRead(1 + 2 + 2)) {
        const streamType = reader.readUint8();
        const elementaryPID = reader.readUint16() & 0x1fff;
        const esInfoLength = reader.readUint16() & 0xfff;
        if (!reader.canRead(esInfoLength)) {
            break;
        }
        const esInfo = readDescriptors(reader.subarray(esInfoLength));
        streams.push({
            streamType,
            elementaryPID,
            esInfo,
        });
    }
    return {
        tableId: "PMT",
        programNumber,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        pcrPID,
        programInfo,
        streams,
    };
}

export type NetworkInformationSection = {
    tableId: "NIT[actual]" | "NIT[other]";
    networkId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    networkDescriptors: Descriptor[];
    transportStreams: TransportStream[];
};

export type TransportStream = {
    transportStreamId: number;
    originalNetworkId: number;
    transportDescriptors: Descriptor[];
};

export function readNIT(
    tableId: number,
    buffer: Uint8Array
): NetworkInformationSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2)) {
        return undefined;
    }
    const networkId = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const networkDescriptorLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(networkDescriptorLength)) {
        return undefined;
    }
    const networkDescriptors = readDescriptors(reader.subarray(networkDescriptorLength));
    const transportStreams: TransportStream[] = [];
    const transportStreamLoopLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(transportStreamLoopLength)) {
        return undefined;
    }
    const treader = new BinaryReader(reader.subarray(transportStreamLoopLength));
    while (treader.canRead(2 + 2 + 2)) {
        const transportStreamId = treader.readUint16();
        const originalNetworkId = treader.readUint16();
        const transportDescriptorsLength = treader.readUint16() & 0xfff;
        if (!treader.canRead(transportDescriptorsLength)) {
            break;
        }
        const transportDescriptors = readDescriptors(treader.subarray(transportDescriptorsLength));
        transportStreams.push({
            transportStreamId,
            originalNetworkId,
            transportDescriptors,
        });
    }
    return {
        tableId: tableId === TABLE_ID_NIT_ACTUAL ? "NIT[actual]" : "NIT[other]",
        networkId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        networkDescriptors,
        transportStreams,
    };
}

export type BroadcasterInformationSection = {
    tableId: "BIT";
    originalNetworkId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    firstDescriptors: Descriptor[];
    broadcasters: Broadcaster[];
};

export type Broadcaster = {
    broadcasterId: number;
    broadcasterDescriptors: Descriptor[];
};

export function readBIT(buffer: Uint8Array): BroadcasterInformationSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2)) {
        return undefined;
    }
    const originalNetworkId = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const firstDescriptorsLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(firstDescriptorsLength)) {
        return undefined;
    }
    const firstDescriptors = readDescriptors(reader.subarray(firstDescriptorsLength));
    const broadcasters: Broadcaster[] = [];
    while (reader.canRead(1 + 2)) {
        const broadcasterId = reader.readUint16();
        const broadcasterDescriptorsLength = reader.readUint16() & 0xfff;
        if (!reader.canRead(broadcasterDescriptorsLength)) {
            break;
        }
        const broadcasterDescriptors = readDescriptors(
            reader.subarray(broadcasterDescriptorsLength)
        );
        broadcasters.push({
            broadcasterId,
            broadcasterDescriptors,
        });
    }
    return {
        tableId: "BIT",
        originalNetworkId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        firstDescriptors,
        broadcasters,
    };
}

export type ServiceDescriptionSection = {
    tableId: "SDT[actual]" | "SDT[other]";
    transportStreamId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    originalNetworkId: number;
    services: Service[];
};

export type Service = {
    serviceId: number;
    hEITFlag: boolean;
    mEITFlag: boolean;
    lEITFlag: boolean;
    eitScheduleFlag: boolean;
    eitPresentFollowingFlag: boolean;
    runningStatus: number;
    freeCAMode: boolean;
    descriptors: Descriptor[];
};

export function readSDT(
    tableId: number,
    buffer: Uint8Array
): ServiceDescriptionSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2 + 1)) {
        return undefined;
    }
    const transportStreamId = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const originalNetworkId = reader.readUint16();
    reader.skip(1);
    const services: Service[] = [];
    while (reader.canRead(2 + 1 + 2)) {
        const serviceId = reader.readUint16();
        const f1 = reader.readUint8();
        const hEITFlag = !!((f1 >> 4) & 1);
        const mEITFlag = !!((f1 >> 3) & 1);
        const lEITFlag = !!((f1 >> 2) & 1);
        const eitScheduleFlag = !!((f1 >> 1) & 1);
        const eitPresentFollowingFlag = !!((f1 >> 0) & 1);
        const f2 = reader.readUint16();
        const runningStatus = f2 >> 13;
        const freeCAMode = !!((f2 >> 12) & 1);
        const descriptorsLoopLength = f2 & 0xfff;
        if (!reader.canRead(descriptorsLoopLength)) {
            break;
        }
        const descriptors = readDescriptors(reader.subarray(descriptorsLoopLength));
        services.push({
            serviceId,
            hEITFlag,
            mEITFlag,
            lEITFlag,
            eitScheduleFlag,
            eitPresentFollowingFlag,
            runningStatus,
            freeCAMode,
            descriptors,
        });
    }
    return {
        tableId: tableId === TABLE_ID_SDT_ACTUAL ? "SDT[actual]" : "SDT[other]",
        transportStreamId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        originalNetworkId,
        services,
    };
}

export type EventInformationSection = {
    tableId: "EIT[p/f]" | "EIT[schedule basic]" | "EIT[schedule extended]";
    tableIdNumber: number;
    tableIndex: number;
    other: boolean;
    serviceId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    transportStreamId: number;
    originalNetworkId: number;
    segmentLastSectionNumber: number;
    lastTableId: number;
    lastTableIndex: number;
    events: EventInformation[];
};

export type EventInformation = {
    eventId: number;
    /** MJD+BCD */
    startTime?: number;
    duration?: number;
    /** always 000 (undefined) */
    runningStatus: number;
    freeCAMode: boolean;
    descriptors: Descriptor[];
};

function readEIT(tableId: number, buffer: Uint8Array): EventInformationSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2 + 2 + 1 + 1)) {
        return undefined;
    }
    const serviceId = reader.readUint16();
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const transportStreamId = reader.readUint16();
    const originalNetworkId = reader.readUint16();
    const segmentLastSectionNumber = reader.readUint8();
    const lastTableId = reader.readUint8();
    const events: EventInformation[] = [];
    while (reader.canRead(2 + 5 + 3 + 2)) {
        const eventId = reader.readUint16();
        const startTime = reader.readUint40();
        const duration = reader.readUint24();
        const f = reader.readUint16();
        const runningStatus = f >> 13;
        const freeCAMode = !!((f >> 12) & 1);
        const descriptorsLoopLength = f & ((1 << 12) - 1);
        if (!reader.canRead(descriptorsLoopLength)) {
            break;
        }
        const descriptors = readDescriptors(reader.subarray(descriptorsLoopLength));
        events.push({
            eventId,
            startTime: startTime === 0xffffffffff ? undefined : startTime,
            duration: duration === 0xffffff ? undefined : duration,
            runningStatus,
            freeCAMode,
            descriptors,
        });
    }
    let tableIndex: number;
    let other = false;
    if (tableId === TABLE_ID_EIT_ACTUAL_PF) {
        tableIndex = 0;
    } else if (tableId === TABLE_ID_EIT_OTHER_PF) {
        tableIndex = 0;
        other = true;
    } else if (tableId <= TABLE_ID_EIT_ACTUAL_SCHEDULE_BASIC_BEGIN) {
        tableIndex = tableId - TABLE_ID_EIT_ACTUAL_SCHEDULE_BASIC_BEGIN;
    } else if (tableId <= TABLE_ID_EIT_ACTUAL_SCHEDULE_EXTENDED_BEGIN) {
        tableIndex = tableId - TABLE_ID_EIT_ACTUAL_SCHEDULE_EXTENDED_BEGIN;
    } else if (tableId <= TABLE_ID_EIT_OTHER_SCHEDULE_BASIC_BEGIN) {
        other = true;
        tableIndex = tableId - TABLE_ID_EIT_OTHER_SCHEDULE_BASIC_BEGIN;
    } else {
        other = true;
        tableIndex = tableId - TABLE_ID_EIT_OTHER_SCHEDULE_EXTENDED_BEGIN;
    }
    let lastTableIndex: number;
    if (tableId === TABLE_ID_EIT_ACTUAL_PF) {
        lastTableIndex = 0;
    } else if (tableId === TABLE_ID_EIT_OTHER_PF) {
        lastTableIndex = 0;
    } else if (tableId <= TABLE_ID_EIT_ACTUAL_SCHEDULE_BASIC_BEGIN) {
        lastTableIndex = lastTableId - TABLE_ID_EIT_ACTUAL_SCHEDULE_BASIC_BEGIN;
    } else if (tableId <= TABLE_ID_EIT_ACTUAL_SCHEDULE_EXTENDED_BEGIN) {
        lastTableIndex = lastTableId - TABLE_ID_EIT_ACTUAL_SCHEDULE_EXTENDED_BEGIN;
    } else if (tableId <= TABLE_ID_EIT_OTHER_SCHEDULE_BASIC_BEGIN) {
        lastTableIndex = lastTableId - TABLE_ID_EIT_OTHER_SCHEDULE_BASIC_BEGIN;
    } else {
        lastTableIndex = lastTableId - TABLE_ID_EIT_OTHER_SCHEDULE_EXTENDED_BEGIN;
    }
    return {
        tableId:
            tableId === TABLE_ID_EIT_ACTUAL_PF || tableId === TABLE_ID_EIT_OTHER_PF
                ? "EIT[p/f]"
                : (tableId & 0xf) <= 0x7
                  ? "EIT[schedule basic]"
                  : "EIT[schedule extended]",
        other,
        tableIndex,
        tableIdNumber: tableId,
        serviceId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        transportStreamId,
        originalNetworkId,
        segmentLastSectionNumber,
        lastTableId,
        lastTableIndex,
        events,
    };
}

export type DSMCCDownloadDataHeader = {
    protocolDiscriminator: number;
    dsmccType: number;
    messageId: number;
    transactionId: number;
    /** always undefined */
    adaptationType?: number;
    adaptationData?: Uint8Array;
};

function readDSMCCDownloadDataHeader(
    reader: BinaryReader
): [DSMCCDownloadDataHeader, Uint8Array] | undefined {
    const protocolDiscriminator = reader.readUint8();
    const dsmccType = reader.readUint8();
    const messageId = reader.readUint16();
    const transactionId = reader.readUint32();
    reader.skip(1);
    const adaptationLength = reader.readUint8();
    const messageLength = reader.readUint16();
    if (messageLength < adaptationLength) {
        return undefined;
    }
    if (!reader.canRead(messageLength)) {
        return undefined;
    }
    if (adaptationLength > 0) {
        const adaptationType = reader.readUint8();
        const adaptationData = reader.slice(adaptationLength - 1);
        return [
            {
                protocolDiscriminator,
                dsmccType,
                messageId,
                transactionId,
                adaptationType,
                adaptationData,
            },
            reader.subarray(messageLength - adaptationLength),
        ];
    }
    return [
        {
            protocolDiscriminator,
            dsmccType,
            messageId,
            transactionId,
        },
        reader.subarray(messageLength - adaptationLength),
    ];
}

export type DownloadInfoIndicationSection = {
    tableId: "DII";
    tableIdExtension: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    dsmccDownloadDataHeader: DSMCCDownloadDataHeader;
    downloadId: number;
    blockSize: number;
    windowSize: number;
    ackPeriod: number;
    tCDownloadWindow: number;
    tCDownloadScenario: number;
    modules: DSMCCModule[];
    privateData: Uint8Array;
};

export type DSMCCModule = {
    moduleId: number;
    moduleSize: number;
    moduleVersion: number;
    moduleInfo: Uint8Array;
};

export type DownloadDataBlockSection = {
    tableId: "DDB";
    tableIdExtension: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    dsmccDownloadDataHeader: DSMCCDownloadDataHeader;
    moduleId: number;
    moduleVersion: number;
    blockNumber: number;
    blockData: Uint8Array;
};

export function readDII(buffer: Uint8Array): DownloadInfoIndicationSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1)) {
        return undefined;
    }
    const tableIdExtension = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();

    const header = readDSMCCDownloadDataHeader(reader);
    if (header == null) {
        return undefined;
    }
    const [dsmccDownloadDataHeader, message] = header;
    const mreader = new BinaryReader(message);
    if (!mreader.canRead(4 + 2 + 1 + 1 + 4 + 4 + 2)) {
        return undefined;
    }
    const downloadId = mreader.readUint32();
    const blockSize = mreader.readUint16();
    const windowSize = mreader.readUint8();
    const ackPeriod = mreader.readUint8();
    const tCDownloadWindow = mreader.readUint32();
    const tCDownloadScenario = mreader.readUint32();
    const compatibilityDescriptorLength = mreader.readUint16();
    if (!mreader.canRead(compatibilityDescriptorLength)) {
        return undefined;
    }
    // always descriptorCount === 2
    mreader.skip(compatibilityDescriptorLength);
    if (!mreader.canRead(2)) {
        return undefined;
    }
    const numberOfModules = mreader.readUint16();
    const modules: DSMCCModule[] = [];
    for (let i = 0; i < numberOfModules; i++) {
        if (!mreader.canRead(2 + 4 + 1 + 1)) {
            return undefined;
        }
        const moduleId = mreader.readUint16();
        const moduleSize = mreader.readUint32();
        const moduleVersion = mreader.readUint8();
        const moduleInfoLength = mreader.readUint8();
        if (!mreader.canRead(moduleInfoLength)) {
            return undefined;
        }
        const moduleInfo = mreader.slice(moduleInfoLength);
        modules.push({
            moduleId,
            moduleSize,
            moduleVersion,
            moduleInfo,
        });
    }
    if (!mreader.canRead(2)) {
        return undefined;
    }
    const privateDataLength = mreader.readUint16();
    if (!mreader.canRead(privateDataLength)) {
        return undefined;
    }
    const privateData = mreader.slice(privateDataLength);
    return {
        tableId: "DII",
        tableIdExtension,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        dsmccDownloadDataHeader,
        downloadId,
        blockSize,
        windowSize,
        ackPeriod,
        tCDownloadWindow,
        tCDownloadScenario,
        modules,
        privateData,
    };
}

export function readDDB(buffer: Uint8Array): DownloadDataBlockSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1)) {
        return undefined;
    }
    const tableIdExtension = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();

    const header = readDSMCCDownloadDataHeader(reader);
    if (header == null) {
        return undefined;
    }
    const [dsmccDownloadDataHeader, message] = header;
    const mreader = new BinaryReader(message);
    if (!mreader.canRead(2 + 1 + 1 + 2)) {
        return undefined;
    }
    const moduleId = mreader.readUint16();
    const moduleVersion = mreader.readUint8();
    mreader.skip(1);
    const blockNumber = mreader.readUint16();
    const blockData = mreader.slice();
    return {
        tableId: "DDB",
        tableIdExtension,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        dsmccDownloadDataHeader,
        moduleId,
        moduleVersion,
        blockNumber,
        blockData,
    };
}

export type StreamDescriptorSection = {
    tableId: "streamDescriptor";
    dataEventId: number;
    eventMessageGroupId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    streamDescriptors: StreamDescriptor[];
};

function readStreamDescriptorSection(buffer: Uint8Array): StreamDescriptorSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1)) {
        return undefined;
    }
    const h0 = reader.readUint16();
    const dataEventId = h0 >> 12;
    const eventMessageGroupId = h0 & 15;
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const streamDescriptors = readStreamDescriptors(reader.subarray());
    return {
        tableId: "streamDescriptor",
        dataEventId,
        eventMessageGroupId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        streamDescriptors,
    };
}

export type StreamDescriptor = NPTReferenceDescriptor | GeneralEventDescriptor;

export type NPTReferenceDescriptor = {
    tag: "nptReference";
    postDiscontinuityIndicator: boolean;
    dsmContentId: number;
    stcReference: number;
    nptReference: number;
    scaleNumerator: number;
    scaleDenominator: number;
};

function readNPTReferenceDescriptor(buffer: Uint8Array): NPTReferenceDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(18)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const postDiscontinuityIndicator = !!(b0 & 0x80);
    const dsmContentId = b0 & 0x7f;
    const stcHigh = !!(reader.readUint8() & 1);
    const stcReference = reader.readUint32() + (stcHigh ? 0x100000000 : 0);
    const nptSign = !!(reader.readUint32() & 1);
    const nptReference = reader.readUint32() - (nptSign ? 0x100000000 : 0);
    const scaleNumerator = reader.readInt16();
    const scaleDenominator = reader.readInt16();
    return {
        tag: "nptReference",
        postDiscontinuityIndicator,
        dsmContentId,
        stcReference,
        nptReference,
        scaleNumerator,
        scaleDenominator,
    };
}

export type GeneralEventDescriptor = {
    tag: "generalEvent";
    eventMessageGroupId: number;
    time: GeneralEventDescriptorTime;
    /** always 1 */
    eventMessageType: number;
    eventMessageId: number;
    /** max: 244 bytes */
    privateData: Uint8Array;
};

function readGeneralEventDescriptor(buffer: Uint8Array): GeneralEventDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 5 + 1 + 2)) {
        return undefined;
    }
    const eventMessageGroupId = reader.readUint16() >> 4;
    const timeMode = reader.readUint8();
    let time: GeneralEventDescriptorTime | undefined;
    switch (timeMode) {
        case 0x00:
            time = { timeMode: "immediate" };
            reader.skip(5);
            break;
        case 0x01:
            time = { timeMode: "MJD", eventMessageMJDJSTTime: reader.readUint40() };
            break;
        case 0x02: {
            const nptHigh = !!(reader.readUint8() & 1);
            const eventMessageNPT = reader.readUint32() + (nptHigh ? 0x100000000 : 0);
            time = { timeMode: "NPT", eventMessageNPT };
            break;
        }
        case 0x03: {
            const relativeTimeHigh = reader.readUint8() & 15;
            const eventMessageRelativeTime = reader.readUint32() + relativeTimeHigh * 0x100000000;
            time = { timeMode: "relative", eventMessageRelativeTime };
            break;
        }
        case 0x05:
            time = { timeMode: "MJDStreamTime", eventMessageMJDJSTTime: reader.readUint40() };
            break;
    }
    if (time == null) {
        return undefined;
    }
    const eventMessageType = reader.readUint8();
    const eventMessageId = reader.readUint16();
    const privateData = reader.slice();
    return {
        tag: "generalEvent",
        eventMessageGroupId,
        time,
        eventMessageType,
        eventMessageId,
        privateData,
    };
}

export type GeneralEventDescriptorTime =
    | {
          timeMode: "immediate";
      }
    | {
          /* unused */
          timeMode: "MJD" | "MJDStreamTime";
          eventMessageMJDJSTTime: number;
      }
    | {
          timeMode: "NPT";
          eventMessageNPT: number;
      }
    | {
          /* unused */
          timeMode: "relative";
          eventMessageRelativeTime: number;
      };

function readStreamDescriptors(buffer: Uint8Array): StreamDescriptor[] {
    const reader = new BinaryReader(buffer);
    const descriptors: StreamDescriptor[] = [];
    while (reader.canRead(2)) {
        const tag = reader.readUint8();
        const length = reader.readUint8();
        if (!reader.canRead(length)) {
            break;
        }
        const descriptor = reader.subarray(length);
        let desc: StreamDescriptor | undefined = undefined;
        switch (tag) {
            case 0x17:
                desc = readNPTReferenceDescriptor(descriptor);
                break;
            case 0x40:
                desc = readGeneralEventDescriptor(descriptor);
                break;
            default:
                throw 1;
                break;
        }
        if (desc != null) {
            descriptors.push(desc);
        }
    }
    return descriptors;
}

export type TimeOffsetSection = {
    tableId: "TOT";
    jstTime: number;
    descriptors: Descriptor[];
};

function readTOT(buffer: Uint8Array): TimeOffsetSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(5 + 2)) {
        return undefined;
    }
    const jstTime = reader.readUint40();
    const descriptorLoopLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(descriptorLoopLength)) {
        return undefined;
    }
    const descriptors = readDescriptors(reader.subarray(descriptorLoopLength));
    return {
        tableId: "TOT",
        jstTime,
        descriptors,
    };
}

export type CommonDataSection = {
    tableId: "CDT";
    downloadDataId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    originalNetworkId: number;
    dataType: number;
    descriptors: Descriptor[];
    dataModule: CommonDataSectionDataModule;
};

export type CommonDataSectionDataModule = {
    logoType: number;
    logoId: number;
    logoVersion: number;
    data: Uint8Array;
};

function readCDT(buffer: Uint8Array): CommonDataSection | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1)) {
        return undefined;
    }
    const downloadDataId = reader.readUint16();
    const h = reader.readUint8();
    const versionNumber = (h >> 1) & 0x1f;
    const currentNextIndicator = !!(h & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    if (!reader.canRead(2 + 1 + 2)) {
        return undefined;
    }
    const originalNetworkId = reader.readUint16();
    const dataType = reader.readUint8();
    const descriptorsLoopLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(descriptorsLoopLength)) {
        return undefined;
    }
    const descriptors = readDescriptors(reader.subarray(descriptorsLoopLength));
    if (!reader.canRead(1 + 2 + 2 + 2)) {
        return undefined;
    }
    const logoType = reader.readUint8();
    const logoId = reader.readUint16() & 0x1ff;
    const logoVersion = reader.readUint16() & 0xfff;
    const dataSize = reader.readUint16();
    if (!reader.canRead(dataSize)) {
        return undefined;
    }
    const data = reader.slice(dataSize);
    return {
        tableId: "CDT",
        downloadDataId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        originalNetworkId,
        dataType,
        descriptors,
        dataModule: {
            logoType,
            logoId,
            logoVersion,
            data,
        },
    };
}
