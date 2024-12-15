import { MMTGeneralLocationInfo, readMMTGeneralLocationInfo } from "./mmt-general-location-info";
import { MMTSIDescriptor, readMMTSIDescriptors } from "./mmt-si-descriptor";
import { BinaryReader, fourCC } from "./utils";

const MMT_SI_PA_MESSAGE = 0x0000;
const MMT_SI_M2_SECTION_MESSAGE = 0x8000;
const MMT_SI_CA_MESSAGE = 0x8001;
const MMT_SI_M2_SHORT_SECTION_MESSAGE = 0x8002;
const MMT_SI_DATA_TRANSMISSION_MESSAGE = 0x8003;

export const MMT_SI_TABLE_MPT = 0x20;
export const MMT_SI_TABLE_PLT = 0x80;
export const MMT_SI_TABLE_ECM = 0x82;
export const MMT_SI_TABLE_EMM = 0x84;
export const MMT_SI_TABLE_EMM_MESSAGE = 0x85;
export const MMT_SI_TABLE_CAT = 0x86;
export const MMT_SI_TABLE_MH_EIT_PF = 0x8b;
export const MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_BEGIN = 0x8c;
export const MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_END = 0x93;
export const MMT_SI_TABLE_MH_EIT_SCHEDULE_EXTENDED_BEGIN = 0x94;
export const MMT_SI_TABLE_MH_EIT_SCHEDULE_EXTENDED_END = 0x9b;
export const MMT_SI_TABLE_MH_AIT = 0x9c;
export const MMT_SI_TABLE_MH_SDTT = 0x9e;
export const MMT_SI_TABLE_MH_BIT = 0x9d;
export const MMT_SI_TABLE_MH_SDT_ACTUAL = 0x9f;
export const MMT_SI_TABLE_MH_SDT_OTHER = 0xa0;
export const MMT_SI_TABLE_MH_TOT = 0xa1;
export const MMT_SI_TABLE_MH_CDT = 0xa2;
export const MMT_SI_TABLE_DDMT = 0xa3;
export const MMT_SI_TABLE_DAMT = 0xa4;
export const MMT_SI_TABLE_EMT = 0xa6;

export const MMT_ASSET_TYPE_HEV1 = fourCC("hev1");
export const MMT_ASSET_TYPE_MP4A = fourCC("mp4a");
export const MMT_ASSET_TYPE_TIMED_TEXT = fourCC("stpp");
export const MMT_ASSET_TYPE_APPLICATION = fourCC("aapp");

export type Message =
    | PAMessage
    | M2sectionMessage
    | M2shortSectionMessage
    | CAMessage
    | DataTransmissionMessage;

export function readMessages(buffer: Uint8Array): Message | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1)) {
        return undefined;
    }

    const messageId = reader.readUint16();
    const version = reader.readUint8();
    let message: Message | undefined;
    switch (messageId) {
        case MMT_SI_PA_MESSAGE: {
            if (!reader.canRead(4)) {
                break;
            }
            const length = reader.readUint32();
            if (!reader.canRead(length)) {
                break;
            }
            const payload = reader.subarray(length);
            message = readPAMessage(version, payload);
            break;
        }
        case MMT_SI_M2_SECTION_MESSAGE: {
            if (!reader.canRead(2)) {
                break;
            }
            const length = reader.readUint16();
            if (!reader.canRead(length)) {
                break;
            }
            const payload = reader.subarray(length);
            message = readM2sectionMessage(version, payload);
            break;
        }
        case MMT_SI_CA_MESSAGE: {
            if (!reader.canRead(2)) {
                break;
            }
            const length = reader.readUint16();
            if (!reader.canRead(length)) {
                break;
            }
            const payload = reader.subarray(length);
            message = readCAMessage(version, payload);
            break;
        }
        case MMT_SI_M2_SHORT_SECTION_MESSAGE: {
            if (!reader.canRead(2)) {
                break;
            }
            const length = reader.readUint16();
            if (!reader.canRead(length)) {
                break;
            }
            const payload = reader.subarray(length);
            message = readM2shortSectionMessage(version, payload);
            break;
        }
        case MMT_SI_DATA_TRANSMISSION_MESSAGE: {
            if (!reader.canRead(4)) {
                break;
            }
            const length = reader.readUint32();
            if (!reader.canRead(length)) {
                break;
            }
            const payload = reader.subarray(length);
            message = readDataTransmissionMessage(version, payload);
            break;
        }
    }
    return message;
}

export type PAMessage = {
    messageId: "PA";
    version: number;
    // unused
    // extension.tables
    tables: MMTSITable[];
};

function readPAMessage(version: number, buffer: Uint8Array): PAMessage | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    // always 0
    const numberOfTables = reader.readUint8();
    if (numberOfTables > 0) {
        if (!reader.canRead(numberOfTables * 4)) {
            return undefined;
        }
        reader.skip(numberOfTables * 4);
    }
    const tables = readTables(buffer.subarray(reader.tell()));
    return {
        messageId: "PA",
        version,
        tables,
    };
}

export type M2sectionMessage = {
    messageId: "M2section";
    version: number;
    table: M2Section;
};

export type M2Section =
    | MHEventInformationTable
    // | MHSoftwareDownloadTriggerTable
    | MHServiceDescriptionTable
    | MHCommonDataTable
    | MHBroadcasterInformationTable
    | MHApplicationInformationTable
    | EventMessageTable;

function readM2sectionMessage(version: number, buffer: Uint8Array): M2sectionMessage | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const tableId = reader.readUint8();
    const b1 = reader.readUint16();
    const sectionSyntaxIndicator = !!(b1 & 0x8000);
    if (!sectionSyntaxIndicator) {
        return undefined;
    }
    const sectionLength = b1 & 0xfff;
    if (!reader.canRead(sectionLength) || sectionLength < 4 /* CRC_32 */) {
        return undefined;
    }
    const payload = reader.subarray(sectionLength - 4 /* CRC_32 */);
    let table: M2Section | undefined;
    if (tableId >= MMT_SI_TABLE_MH_EIT_PF && tableId <= MMT_SI_TABLE_MH_EIT_SCHEDULE_EXTENDED_END) {
        table = readMHEventInformationTable(tableId, payload);
    }
    switch (tableId) {
        case MMT_SI_TABLE_MH_SDTT:
            break;
        case MMT_SI_TABLE_MH_BIT:
            table = readMHBroadcasterInformationTable(tableId, payload);
            break;
        case MMT_SI_TABLE_MH_SDT_ACTUAL:
        case MMT_SI_TABLE_MH_SDT_OTHER:
            table = readMHServiceDescriptionTable(tableId, payload);
            break;
        case MMT_SI_TABLE_MH_TOT:
            break;
        case MMT_SI_TABLE_MH_CDT:
            table = readMHCommonDataTable(tableId, payload);
            break;
        case MMT_SI_TABLE_MH_AIT:
            table = readMHApplicationInformationTable(tableId, payload);
            break;
        case MMT_SI_TABLE_EMT:
            table = readEventMessageTable(tableId, payload);
            break;
    }
    if (
        tableId == MMT_SI_TABLE_ECM ||
        tableId == MMT_SI_TABLE_EMM ||
        tableId == MMT_SI_TABLE_EMM_MESSAGE
    ) {
        return undefined;
    }
    if (table == null) {
        return undefined;
    }
    return {
        messageId: "M2section",
        version,
        table,
    };
}

export type MHEventInformationTable = {
    tableId: "EIT[p/f]" | "EIT[schedule basic]" | "EIT[schedule extended]";
    tableIdNumber: number;
    tableIndex: number;
    serviceId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    tlvStreamId: number;
    originalNetworkId: number;
    segmentLastSectionNumber: number;
    lastTableId: number;
    lastTableIndex: number;
    events: MHEventInformation[];
};

export type MHEventInformation = {
    eventId: number;
    /** MJD+BCD */
    startTime?: number;
    duration?: number;
    /** always 000 (undefined) */
    runningStatus: number;
    freeCAMode: boolean;
    descriptors: MMTSIDescriptor[];
};

function readMHEventInformationTable(
    tableId: number,
    buffer: Uint8Array
): MHEventInformationTable | undefined {
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
    const tlvStreamId = reader.readUint16();
    const originalNetworkId = reader.readUint16();
    const segmentLastSectionNumber = reader.readUint8();
    const lastTableId = reader.readUint8();
    const events: MHEventInformation[] = [];
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
        const descriptors = readMMTSIDescriptors(reader.subarray(descriptorsLoopLength));
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
    if (tableId === MMT_SI_TABLE_MH_EIT_PF) {
        tableIndex = 0;
    } else if (tableId <= MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_END) {
        tableIndex = tableId - MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_BEGIN;
    } else {
        tableIndex = tableId - MMT_SI_TABLE_MH_EIT_SCHEDULE_EXTENDED_BEGIN;
    }
    let lastTableIndex: number;
    if (lastTableId === MMT_SI_TABLE_MH_EIT_PF) {
        lastTableIndex = 0;
    } else if (lastTableId <= MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_END) {
        lastTableIndex = lastTableId - MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_BEGIN;
    } else {
        lastTableIndex = lastTableId - MMT_SI_TABLE_MH_EIT_SCHEDULE_EXTENDED_BEGIN;
    }
    return {
        tableId:
            tableId === MMT_SI_TABLE_MH_EIT_PF
                ? "EIT[p/f]"
                : tableId <= MMT_SI_TABLE_MH_EIT_SCHEDULE_BASIC_END
                  ? "EIT[schedule basic]"
                  : "EIT[schedule extended]",
        tableIndex,
        tableIdNumber: tableId,
        serviceId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        tlvStreamId,
        originalNetworkId,
        segmentLastSectionNumber,
        lastTableId,
        lastTableIndex,
        events,
    };
}

export type MHServiceDescriptionTable = {
    tableId: "SDT[actual]" | "SDT[other]";
    tlvStreamId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    originalNetworkId: number;
    services: MHServiceDescription[];
};

export type MHServiceDescription = {
    serviceId: number;
    eitUserDefinedFlags: number;
    eitScheduleFlag: boolean;
    eitPresentFollowingFlag: boolean;
    runningStatus: number;
    freeCAMode: boolean;
    descriptors: MMTSIDescriptor[];
};

function readMHServiceDescriptionTable(
    tableId: number,
    buffer: Uint8Array
): MHServiceDescriptionTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2 + 1)) {
        return undefined;
    }
    const tlvStreamId = reader.readUint16();
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const originalNetworkId = reader.readUint16();
    reader.skip(1);
    const services: MHServiceDescription[] = [];
    while (reader.canRead(2 + 1 + 2)) {
        const serviceId = reader.readUint16();
        const b = reader.readUint8();
        const eitUserDefinedFlags = (b >> 5) & 7;
        const eitScheduleFlag = !!((b >> 1) & 1);
        const eitPresentFollowingFlag = !!(b & 1);
        const f = reader.readUint16();
        const runningStatus = f >> 13;
        const freeCAMode = !!((f >> 12) & 1);
        const descriptorsLoopLength = f & ((1 << 12) - 1);
        if (!reader.canRead(descriptorsLoopLength)) {
            break;
        }
        const descriptors = readMMTSIDescriptors(reader.subarray(descriptorsLoopLength));
        services.push({
            serviceId,
            eitUserDefinedFlags,
            eitScheduleFlag,
            eitPresentFollowingFlag,
            runningStatus,
            freeCAMode,
            descriptors,
        });
    }
    return {
        tableId: tableId === MMT_SI_TABLE_MH_SDT_ACTUAL ? "SDT[actual]" : "SDT[other]",
        tlvStreamId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        originalNetworkId,
        services,
    };
}

export const MH_CDT_DATA_TYPE_LOGO_DATA = 0x01;
export const MH_CDT_LOGO_TYPE_LARGE = 0x07;
export const MH_CDT_LOGO_TYPE_SMALL = 0x06;
export const MH_CDT_LOGO_TYPE_2K = 0x05;

export type MHCommonDataTable = {
    tableId: "CDT";
    downloadDataId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    originalNetworkId: number;
    dataType: number;
    /** unused */
    descriptors: MMTSIDescriptor[];
    dataModule: MHCommonDataTableDataModule;
};

export type MHCommonDataTableDataModule = {
    logoType: number;
    logoId: number;
    logoVersion: number;
    data: Uint8Array;
};

function readMHCommonDataTable(
    _tableId: number,
    buffer: Uint8Array
): MHCommonDataTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2 + 1 + 2)) {
        return undefined;
    }
    const downloadDataId = reader.readUint16();
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const originalNetworkId = reader.readUint16();
    const dataType = reader.readUint8();
    const descriptorsLoopLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(descriptorsLoopLength)) {
        return undefined;
    }
    const descriptors = readMMTSIDescriptors(reader.subarray(descriptorsLoopLength));
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

export type MHTimeOffsetTable = {
    tableId: "TOT";
    jstTime: number;
    descriptors: MMTSIDescriptor[];
};

function readMHTimeOffsetTable(
    _tableId: number,
    buffer: Uint8Array
): MHTimeOffsetTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(5 + 2)) {
        return undefined;
    }
    const jstTime = reader.readUint40();
    const descriptorLoopLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(descriptorLoopLength)) {
        return undefined;
    }
    const descriptors = readMMTSIDescriptors(reader.subarray(descriptorLoopLength));
    return {
        tableId: "TOT",
        jstTime,
        descriptors,
    };
}

export type MHBroadcasterInformationTable = {
    tableId: "BIT";
    originalNetworkId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    broadcastViewPropriety: boolean;
    firstDescriptors: MMTSIDescriptor[];
    broadcasters: MHBroadcaster[];
};

export type MHBroadcaster = {
    broadcasterId: number;
    broadcasterDescriptors: MMTSIDescriptor[];
};

function readMHBroadcasterInformationTable(
    _tableId: number,
    buffer: Uint8Array
): MHBroadcasterInformationTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2)) {
        return undefined;
    }
    const originalNetworkId = reader.readUint16();
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const b = reader.readUint16();
    const broadcastViewPropriety = !!((b >> 12) & 1);
    const firstDescriptorsLength = b & 0xfff;
    if (!reader.canRead(firstDescriptorsLength)) {
        return undefined;
    }
    const firstDescriptors = readMMTSIDescriptors(reader.subarray(firstDescriptorsLength));
    const broadcasters: MHBroadcaster[] = [];
    while (reader.canRead(1 + 2)) {
        const broadcasterId = reader.readUint8();
        const broadcasterDescriptorsLength = reader.readUint16() & 0xfff;
        const broadcasterDescriptors = readMMTSIDescriptors(
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
        broadcastViewPropriety,
        firstDescriptors,
        broadcasters,
    };
}

export const APPLICATION_TYPE_ARIB_HTML5 = 0x0011;

export type MHApplicationInformationTable = {
    tableId: "AIT";
    /** @see {@link APPLICATION_TYPE_ARIB_HTML5} */
    applicationType: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    /** always 0 */
    sectionNumber: number;
    /** always 0 */
    lastSectionNumber: number;
    /** unused */
    commonDescriptors: MMTSIDescriptor[];
    applications: MHApplication[];
};

export const APPLICATION_CONTROL_CODE_AUTOSTART = 0x01;
export const APPLICATION_CONTROL_CODE_PRESENT = 0x02;
export const APPLICATION_CONTROL_CODE_KILL = 0x04;

export type MHApplication = {
    organizationId: number;
    applicationId: number;
    /**
     * @see {@link APPLICATION_CONTROL_CODE_AUTOSTART}
     * @see {@link APPLICATION_CONTROL_CODE_PRESENT}
     * @see {@link APPLICATION_CONTROL_CODE_KILL}
     */
    applicationControlCode: number;
    applicationDescriptors: MMTSIDescriptor[];
};

function readMHApplicationInformationTable(
    _tableId: number,
    buffer: Uint8Array
): MHApplicationInformationTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2)) {
        return undefined;
    }
    const applicationType = reader.readUint16();
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const commonDescriptorLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(commonDescriptorLength)) {
        return undefined;
    }
    const commonDescriptors = readMMTSIDescriptors(reader.subarray(commonDescriptorLength));
    const applicationLoopLength = reader.readUint16() & 0xfff;
    if (!reader.canRead(applicationLoopLength)) {
        return undefined;
    }
    const areader = new BinaryReader(reader.subarray(applicationLoopLength));
    const applications: MHApplication[] = [];
    while (areader.canRead(2 + 4 + 1 + 2)) {
        const organizationId = areader.readUint16();
        const applicationId = areader.readUint32();
        const applicationControlCode = areader.readUint8();
        const applicationDescriptorsLength = areader.readUint16() & 0xfff;
        if (!areader.canRead(applicationDescriptorsLength)) {
            return undefined;
        }
        const applicationDescriptors = readMMTSIDescriptors(
            areader.subarray(applicationDescriptorsLength)
        );
        applications.push({
            organizationId,
            applicationId,
            applicationControlCode,
            applicationDescriptors,
        });
    }
    return {
        tableId: "AIT",
        applicationType,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        commonDescriptors,
        applications,
    };
}

export type EventMessageTable = {
    tableId: "EMT";
    dataEventId: number;
    eventMessageGroupId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    descriptors: MMTSIDescriptor[];
};

function readEventMessageTable(
    _tableId: number,
    buffer: Uint8Array
): EventMessageTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1 + 1 + 2)) {
        return undefined;
    }
    const h = reader.readUint16();
    const dataEventId = h >> 12;
    const eventMessageGroupId = h & 0xfff;
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const descriptors = readMMTSIDescriptors(reader.subarray());
    return {
        tableId: "EMT",
        dataEventId,
        eventMessageGroupId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        descriptors,
    };
}

export type M2shortSectionMessage = {
    messageId: "M2shortSection";
    version: number;
    table: M2ShortSection;
};

export type M2ShortSection = MHTimeOffsetTable;

function readM2shortSectionMessage(
    version: number,
    buffer: Uint8Array
): M2shortSectionMessage | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const tableId = reader.readUint8();
    const b1 = reader.readUint16();
    const sectionSyntaxIndicator = !!(b1 & 0x8000);
    if (sectionSyntaxIndicator) {
        return undefined;
    }
    const sectionLength = b1 & 0xfff;
    if (!reader.canRead(sectionLength) || sectionLength < 4 /* CRC_32 */) {
        return undefined;
    }
    const payload = reader.subarray(sectionLength - 4 /* CRC_32 */);
    let table: M2ShortSection | undefined;
    switch (tableId) {
        case MMT_SI_TABLE_MH_TOT:
            table = readMHTimeOffsetTable(tableId, payload);
            break;
    }
    if (table == null) {
        return undefined;
    }
    return {
        messageId: "M2shortSection",
        version,
        table,
    };
}

export type CAMessage = {
    messageId: "CAT";
    version: number;
    table: ConditionalAccessTable;
};

export type ConditionalAccessTable = {
    tableId: "CAT";
    version: number;
    descriptors: MMTSIDescriptor[];
};

function readCAMessage(version: number, buffer: Uint8Array): CAMessage | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 2)) {
        return undefined;
    }
    const tableId = reader.readUint8();
    const tableVersion = reader.readUint8();
    const length = reader.readUint16();
    if (!reader.canRead(length)) {
        return undefined;
    }
    const payload = reader.subarray(length);
    let table: ConditionalAccessTable | undefined;
    switch (tableId) {
        case MMT_SI_TABLE_CAT:
            table = readConditionalAccessTable(tableVersion, payload);
            break;
    }
    if (table == null) {
        return undefined;
    }
    return {
        messageId: "CAT",
        version,
        table,
    };
}

function readConditionalAccessTable(version: number, payload: Uint8Array): ConditionalAccessTable {
    const descriptors = readMMTSIDescriptors(payload);
    return {
        tableId: "CAT",
        version,
        descriptors,
    };
}

export type DataTransmissionSection = DataDirectoryManagementTable | DataAssetManagementTable;

export type DataTransmissionMessage = {
    messageId: "dataTransmission";
    /** always 0 */
    version: number;
    table: DataTransmissionSection;
};

function readDataTransmissionMessage(
    version: number,
    buffer: Uint8Array
): DataTransmissionMessage | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const tableId = reader.readUint8();
    const b1 = reader.readUint16();
    const sectionSyntaxIndicator = !!(b1 & 0x8000);
    if (!sectionSyntaxIndicator) {
        return undefined;
    }
    const sectionLength = b1 & 0xfff;
    if (!reader.canRead(sectionLength) || sectionLength < 4 /* CRC_32 */) {
        return undefined;
    }
    const payload = reader.subarray(sectionLength - 4 /* CRC_32 */);
    let table: DataTransmissionSection | undefined;
    switch (tableId) {
        case MMT_SI_TABLE_DDMT:
            table = readDataDirectoryManagementTable(tableId, payload);
            break;
        case MMT_SI_TABLE_DAMT:
            table = readDataAssetManagementTable(tableId, payload);
            break;
    }
    if (table == null) {
        return undefined;
    }
    return {
        messageId: "dataTransmission",
        version,
        table,
    };
}

export type DataDirectoryManagementTable = {
    tableId: "DDMT";
    dataTransmissionSessionId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    baseDirectoryPath: Uint8Array;
    directoryNodes: DataDirectoryNode[];
};

export type DataDirectoryNode = {
    nodeTag: number;
    directoryNodeVersion: number;
    directoryNodePath: Uint8Array;
    /** unused */
    files: DataDirectoryNodeFile[];
};

export type DataDirectoryNodeFile = {
    nodeTag: number;
    fileName: Uint8Array;
};

function readDataDirectoryManagementTable(
    _tableId: number,
    buffer: Uint8Array
): DataDirectoryManagementTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 1 + 1 + 1)) {
        return undefined;
    }
    const dataTransmissionSessionId = reader.readUint8();
    reader.skip(1);
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const baseDirectoryPathLength = reader.readUint8();
    if (!reader.canRead(baseDirectoryPathLength)) {
        return undefined;
    }
    const baseDirectoryPath = reader.slice(baseDirectoryPathLength);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const numOfDirectoryNodes = reader.readUint8();
    const directoryNodes: DataDirectoryNode[] = [];
    for (let j = 0; j < numOfDirectoryNodes; j++) {
        if (!reader.canRead(2 + 1 + 1)) {
            return undefined;
        }
        const nodeTag = reader.readUint16();
        const directoryNodeVersion = reader.readUint8();
        const directoryNodePathLength = reader.readUint8();
        if (!reader.canRead(directoryNodePathLength)) {
            return undefined;
        }
        const directoryNodePath = reader.slice(directoryNodePathLength);
        if (!reader.canRead(2)) {
            return undefined;
        }
        const numOfFiles = reader.readUint16();
        const files: DataDirectoryNodeFile[] = [];
        for (let k = 0; k < numOfFiles; k++) {
            if (!reader.canRead(2 + 1)) {
                return undefined;
            }
            const nodeTag = reader.readUint16();
            const fileNameLength = reader.readUint8();
            if (!reader.canRead(fileNameLength)) {
                return undefined;
            }
            const fileName = reader.slice(fileNameLength);
            files.push({
                nodeTag,
                fileName,
            });
        }
        directoryNodes.push({
            nodeTag,
            directoryNodeVersion,
            directoryNodePath,
            files,
        });
    }
    return {
        tableId: "DDMT",
        dataTransmissionSessionId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        baseDirectoryPath,
        directoryNodes,
    };
}

export const DOWNLOAD_ID_DATA_EVENT_ID_SHIFT = 28;
export const DOWNLOAD_ID_DATA_EVENT_ID_MASK = 0xf;

export type DataAssetManagementTable = {
    tableId: "DAMT";
    dataTransmissionSessionId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    transactionId: number;
    componentTag: number;
    /** dataEventId = (downloadId >>> {@link DOWNLOAD_ID_DATA_EVENT_ID_SHIFT}) & {@link DOWNLOAD_ID_DATA_EVENT_ID_MASK} */
    downloadId: number;
    mpus: DataAssetMPU[];
    /** unused */
    componentInfo: Uint8Array;
};

export const INDEX_ITEM_COMPRESSION_TYPE_ZLIB = 0b00;
export const INDEX_ITEM_COMPRESSION_TYPE_UNCOMPRESSED = 0b11;

export type DataAssetMPU = {
    mpuSequenceNumber: number;
    mpuSize: number;
    /**
     * @see {@link INDEX_ITEM_COMPRESSION_TYPE_ZLIB}
     * @see {@link INDEX_ITEM_COMPRESSION_TYPE_UNCOMPRESSED}
     */
    indexItemCompressionType: number;
    /** always undefined (0x00000000) */
    indexItemId?: number;
    /** unused */
    items: DataAssetMPUNodeTag[] | DataAssetMPUItem[];
    /** always `[{ tag: "mpuNode", nodeId: ... }]` */
    mpuInfo: MMTSIDescriptor[];
};

export type DataAssetMPUNodeTag = {
    nodeTag: number;
};

export type DataAssetMPUItem = {
    nodeTag: number;
    itemId: number;
    itemSize: number;
    itemVersion: number;
    itemChecksum?: number;
    itemInfo: Uint8Array;
};

function readDataAssetManagementTable(
    _tableId: number,
    buffer: Uint8Array
): DataAssetManagementTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 1 + 1 + 4 + 2 + 4 + 1)) {
        return undefined;
    }
    const dataTransmissionSessionId = reader.readUint8();
    reader.skip(1);
    const b2 = reader.readUint8();
    const versionNumber = (b2 >> 1) & 0x1f;
    const currentNextIndicator = !!(b2 & 1);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    const transactionId = reader.readUint32();
    const componentTag = reader.readUint16();
    const downloadId = reader.readUint32();
    const numOfMPUs = reader.readUint8();
    const mpus: DataAssetMPU[] = [];
    for (let j = 0; j < numOfMPUs; j++) {
        if (!reader.canRead(4 + 4 + 1)) {
            return undefined;
        }
        const mpuSequenceNumber = reader.readUint32();
        const mpuSize = reader.readUint32();
        const h = reader.readUint8();
        const indexItemFlag = !!(h >> 7);
        const indexItemIdFlag = !!((h >> 6) & 1);
        const indexItemCompressionType = (h >> 4) & 3;
        let indexItemId: number | undefined;
        if (indexItemFlag && indexItemIdFlag) {
            if (!reader.canRead(4)) {
                return undefined;
            }
            indexItemId = reader.readUint32();
        }
        if (!reader.canRead(2)) {
            return undefined;
        }
        const numOfItems = reader.readUint16();
        const items: DataAssetMPUNodeTag[] | DataAssetMPUItem[] = [];
        if (indexItemFlag) {
            if (!reader.canRead(2 * numOfItems)) {
                return undefined;
            }
            for (let k = 0; k < numOfItems; k++) {
                const nodeTag = reader.readUint16();
                (items as DataAssetMPUNodeTag[]).push({
                    nodeTag,
                });
            }
        } else {
            for (let k = 0; k < numOfItems; k++) {
                if (!reader.canRead(2 + 4 + 4 + 1 + 1)) {
                    return undefined;
                }
                const nodeTag = reader.readUint16();
                const itemId = reader.readUint32();
                const itemSize = reader.readUint32();
                const itemVersion = reader.readUint8();
                const checksumFlag = !!(reader.readUint8() >> 7);
                let itemChecksum: number | undefined;
                if (checksumFlag) {
                    if (!reader.canRead(4)) {
                        return undefined;
                    }
                    itemChecksum = reader.readUint32();
                }
                if (!reader.canRead(1)) {
                    return undefined;
                }
                const itemInfoLength = reader.readUint8();
                if (!reader.canRead(itemInfoLength)) {
                    return undefined;
                }
                const itemInfo = reader.slice(itemInfoLength);
                (items as DataAssetMPUItem[]).push({
                    nodeTag,
                    itemId,
                    itemSize,
                    itemVersion,
                    itemChecksum,
                    itemInfo,
                });
            }
        }
        if (!reader.canRead(1)) {
            return undefined;
        }
        const mpuInfoLength = reader.readUint8();
        if (!reader.canRead(mpuInfoLength)) {
            return undefined;
        }
        const mpuInfo = readMMTSIDescriptors(reader.slice(mpuInfoLength));
        mpus.push({
            mpuSequenceNumber,
            mpuSize,
            indexItemCompressionType,
            indexItemId,
            items,
            mpuInfo,
        });
    }
    if (!reader.canRead(1)) {
        return undefined;
    }
    const componentInfoLength = reader.readUint8();
    if (!reader.canRead(componentInfoLength)) {
        return undefined;
    }
    const componentInfo = reader.slice(componentInfoLength);
    return {
        tableId: "DAMT",
        dataTransmissionSessionId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        transactionId,
        componentTag,
        downloadId,
        mpus,
        componentInfo,
    };
}

export type MMTSITable = PackageListTable | MMTPackageTable;

function readTables(buffer: Uint8Array): MMTSITable[] {
    const reader = new BinaryReader(buffer);
    const tables: MMTSITable[] = [];
    while (reader.canRead(1 + 1 + 2)) {
        const tableId = reader.readUint8();
        const version = reader.readUint8();
        const length = reader.readUint16();
        const tab = reader.subarray(length);
        let table: MMTSITable | undefined;
        switch (tableId) {
            case MMT_SI_TABLE_MPT:
                table = readMMTPackageTable(version, tab);
                break;
            case MMT_SI_TABLE_PLT:
                table = readPackageListTable(version, tab);
                break;
        }
        if (table != null) {
            tables.push(table);
        }
    }
    return tables;
}

export type MMTPackageTable = {
    tableId: "MPT";
    version: number;
    mptMode: number;
    /** (mmtPackageId[0] << 8) | mmtPackageId[1] === serviceId */
    mmtPackageId: Uint8Array;
    mptDescriptors: MMTSIDescriptor[];
    assets: MMTAsset[];
};

export type MMTAsset = {
    /** always 0 */
    identifierType: number;
    /** unused */
    assetIdScheme: number;
    assetId: Uint8Array;
    assetType: number;
    assetClockRelationFlag: boolean;
    /** always locations.length === 1 && locations[0].locationType === "sameDataFlow" */
    locations: MMTGeneralLocationInfo[];
    assetDescriptors: MMTSIDescriptor[];
};

function readMMTPackageTable(version: number, buffer: Uint8Array): MMTPackageTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1)) {
        return undefined;
    }
    const mptMode = reader.readUint8() & 3;
    // always 2
    const mmtPackageIdLength = reader.readUint8();
    if (!reader.canRead(mmtPackageIdLength)) {
        return undefined;
    }
    const mmtPackageId = reader.slice(mmtPackageIdLength);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const mptDescriptorsLength = reader.readUint16();
    if (!reader.canRead(mptDescriptorsLength)) {
        return undefined;
    }
    const mptDescriptors = readMMTSIDescriptors(reader.subarray(mptDescriptorsLength));
    if (!reader.canRead(1)) {
        return undefined;
    }
    const numberOfAssets = reader.readUint8();
    const assets: MMTAsset[] = [];
    for (let i = 0; i < numberOfAssets; i++) {
        if (!reader.canRead(1 + 4 + 1)) {
            break;
        }
        // always 0
        const identifierType = reader.readUint8();
        // unused
        const assetIdScheme = reader.readUint32();
        // unused
        const assetIdLength = reader.readUint8();
        if (!reader.canRead(assetIdLength)) {
            break;
        }
        const assetId = reader.slice(assetIdLength);
        if (!reader.canRead(4 + 1 + 1)) {
            break;
        }
        const assetType = reader.readUint32();
        // always 0
        const assetClockRelationFlag = !!(reader.readUint8() & 1);
        // always 1
        const locationCount = reader.readUint8();
        const locations: MMTGeneralLocationInfo[] = [];
        for (let j = 0; j < locationCount; j++) {
            const info = readMMTGeneralLocationInfo(reader);
            if (info == null) {
                return undefined;
            }
            locations.push(info);
        }
        if (!reader.canRead(2)) {
            break;
        }
        const assetDescriptorsLength = reader.readUint16();
        if (!reader.canRead(assetDescriptorsLength)) {
            break;
        }
        const assetDescriptors = readMMTSIDescriptors(reader.subarray(assetDescriptorsLength));
        assets.push({
            identifierType,
            assetIdScheme,
            assetId,
            assetType,
            assetClockRelationFlag,
            locations,
            assetDescriptors,
        });
    }
    return {
        tableId: "MPT",
        version,
        mptMode,
        mmtPackageId,
        mptDescriptors,
        assets,
    };
}

export function mmtPackageIdToServiceId(mmtPackageId: Uint8Array): number | undefined {
    if (mmtPackageId.length !== 2) {
        return undefined;
    }
    return (mmtPackageId[0] << 8) | mmtPackageId[1];
}

export type PackageListTable = {
    tableId: "PLT";
    version: number;
    packages: Package[];
    // ip_delivery: unused
};

export type Package = {
    /** (mmtPackageId[0] << 8) | mmtPackageId[1] === serviceId */
    mmtPackageId: Uint8Array;
    locationInfo: MMTGeneralLocationInfo;
};

function readPackageListTable(version: number, buffer: Uint8Array): PackageListTable | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const numOfPackage = reader.readUint8();
    const packages: Package[] = [];
    for (let i = 0; i < numOfPackage; i++) {
        if (!reader.canRead(1)) {
            break;
        }
        const mmtPackageIdLength = reader.readUint8();
        if (!reader.canRead(mmtPackageIdLength)) {
            break;
        }
        const mmtPackageId = reader.slice(mmtPackageIdLength);
        const locationInfo = readMMTGeneralLocationInfo(reader);
        if (locationInfo == null) {
            return undefined;
        }
        packages.push({
            mmtPackageId,
            locationInfo,
        });
    }
    return {
        tableId: "PLT",
        version,
        packages,
    };
}
