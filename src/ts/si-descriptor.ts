import { BinaryReader } from "../utils";
import {
    EmergencyInformationDescriptor,
    readEmergencyInformationDescriptor,
    NetworkNameDescriptor,
    readNetworkNameDescriptor,
    ServiceListDescriptor,
    ServiceListEntry,
    SystemManagementDescriptor,
    readServiceListDescriptor,
    readSystemManagementDescriptor,
    readSatelliteDeliverySystemDescriptor,
    SatelliteDeliverySystemDescriptor,
} from "../si-descriptor";
export {
    EmergencyInformationDescriptor,
    NetworkNameDescriptor,
    ServiceListDescriptor,
    ServiceListEntry,
    SystemManagementDescriptor,
    SatelliteDeliverySystemDescriptor,
};

export type Descriptor =
    | CADescriptor
    | AccessControlDescriptor
    | CAServiceDescriptor
    | DigitalCopyControlDescriptor
    | EmergencyInformationDescriptor
    | ContentAvailabilityDescriptor
    | StreamIdentifierDescriptor
    | HierarchicalTransmissionDescriptor
    | DataComponentDescriptor
    | VideoDecodeControlDescriptor
    | NetworkNameDescriptor
    | SystemManagementDescriptor
    | CAEMMTSDescriptor
    | ServiceListDescriptor
    | SatelliteDeliverySystemDescriptor
    | TerrestrialDeliverySystemDescriptor
    | PartialReceptionDescriptor
    | TSInformationDescriptor
    | SIParameterDescriptor
    | BroadcasterNameDescriptor
    | ExtendedBroadcasterDescriptor
    | ServiceDescriptor
    | CAContractInfoDescriptor
    | LogoTransmissionDescriptor
    | LinkageDescriptor
    | ShortEventDescriptor
    | ComponentDescriptor
    | AudioComponentDescriptor
    | DataContentDescriptor
    | ContentDescriptor
    | ParentalRatingDescriptor
    | EventGroupDescriptor
    | ComponentGroupDescriptor
    | SeriesDescriptor
    | ExtendedEventDescriptor
    | LocalTimeOffsetDescriptor
    | StuffingDescriptor;

export const CA_DESCRIPTOR = 0x09;
export const ACCESS_CONTROL_DESCRIPTOR = 0xf6;
export const CA_SERVICE_DESCRIPTOR = 0xcc;
export const DIGITAL_COPY_CONTROL_DESCRIPTOR = 0xc1;
export const EMERGENCY_INFORMATION_DESCRIPTOR = 0xfc;
export const CONTENT_AVAILABILITY_DESCRIPTOR = 0xde;
export const STREAM_IDENTIFIER_DESCRIPTOR = 0x52;
export const HIERARCHICAL_TRANSMISSION_DESCRIPTOR = 0xc0;
export const DATA_COMPONENT_DESCRIPTOR = 0xfd;
export const VIDEO_DECODE_CONTROL_DESCRIPTOR = 0xc8;
export const NETWORK_NAME_DESCRIPTOR = 0x40;
export const SYSTEM_MANAGEMENT_DESCRIPTOR = 0xfe;
export const CA_EMM_TS_DESCRIPTOR = 0xca;
export const SERVICE_LIST_DESCRIPTOR = 0x41;
export const SATELLITE_DELIVERY_SYSTEM_DESCRIPTOR = 0x43;
export const TERRESTRIAL_DELIVERY_SYSTEM_DESCRIPTOR = 0xfa;
export const PARTIAL_RECEPTION_DESCRIPTOR = 0xfb;
export const TS_INFORMATION_DESCRIPTOR = 0xcd;
export const SI_PARAMETER_DESCRIPTOR = 0xd7;
export const BROADCASTER_NAME_DESCRIPTOR = 0xd8;
export const EXTENDED_BROADCASTER_DESCRIPTOR = 0xce;
export const SERVICE_DESCRIPTOR = 0x48;
export const CA_CONTRACT_INFO_DESCRIPTOR = 0xcb;
export const LOGO_TRANSMISSION_DESCRIPTOR = 0xcf;
export const LINKAGE_DESCRIPTOR = 0x4a;
export const SHORT_EVENT_DESCRIPTOR = 0x4d;
export const COMPONENT_DESCRIPTOR = 0x50;
export const AUDIO_COMPONENT_DESCRIPTOR = 0xc4;
export const DATA_CONTENT_DESCRIPTOR = 0xc7;
export const CONTENT_DESCRIPTOR = 0x54;
export const PARENTAL_RATING_DESCRIPTOR = 0x55;
export const EVENT_GROUP_DESCRIPTOR = 0xd6;
export const COMPONENT_GROUP_DESCRIPTOR = 0xd9;
export const SERIES_DESCRIPTOR = 0xd5;
export const EXTENDED_EVENT_DESCRIPTOR = 0x4e;
export const LOCAL_TIME_OFFSET_DESCRIPTOR = 0x58;
export const STUFFING_DESCRIPTOR = 0x42;

export function readDescriptors(buffer: Uint8Array): Descriptor[] {
    const descriptors: Descriptor[] = [];
    const reader = new BinaryReader(buffer);
    while (reader.canRead(2)) {
        const tag = reader.readUint8();
        const length = reader.readUint8();
        if (!reader.canRead(length)) {
            break;
        }
        const payload = reader.subarray(length);
        let desc: Descriptor | undefined;
        switch (tag) {
            case CA_DESCRIPTOR:
                desc = readCADescriptor(payload);
                break;
            case ACCESS_CONTROL_DESCRIPTOR:
                desc = readAccessControlDescriptor(payload);
                break;
            case CA_SERVICE_DESCRIPTOR:
                desc = readCAServiceDescriptor(payload);
                break;
            case DIGITAL_COPY_CONTROL_DESCRIPTOR:
                desc = readDigitalCopyControlDescriptor(payload);
                break;
            case EMERGENCY_INFORMATION_DESCRIPTOR:
                desc = readEmergencyInformationDescriptor(payload);
                break;
            case CONTENT_AVAILABILITY_DESCRIPTOR:
                desc = readContentAvailabilityDescriptor(payload);
                break;
            case STREAM_IDENTIFIER_DESCRIPTOR:
                desc = readStreamIdentifierDescriptor(payload);
                break;
            case HIERARCHICAL_TRANSMISSION_DESCRIPTOR:
                desc = readHierarchicalTransmissionDescriptor(payload);
                break;
            case DATA_COMPONENT_DESCRIPTOR:
                desc = readDataComponentDescriptor(payload);
                break;
            case VIDEO_DECODE_CONTROL_DESCRIPTOR:
                desc = readVideoDecodeControlDescriptor(payload);
                break;
            case NETWORK_NAME_DESCRIPTOR:
                desc = readNetworkNameDescriptor(payload);
                break;
            case SYSTEM_MANAGEMENT_DESCRIPTOR:
                desc = readSystemManagementDescriptor(payload);
                break;
            case CA_EMM_TS_DESCRIPTOR:
                desc = readCAEMMTSDescriptor(payload);
                break;
            case SERVICE_LIST_DESCRIPTOR:
                desc = readServiceListDescriptor(payload);
                break;
            case SATELLITE_DELIVERY_SYSTEM_DESCRIPTOR:
                desc = readSatelliteDeliverySystemDescriptor(payload);
                break;
            case TERRESTRIAL_DELIVERY_SYSTEM_DESCRIPTOR:
                desc = readTerrestrialDeliverySystemDescriptor(payload);
                break;
            case PARTIAL_RECEPTION_DESCRIPTOR:
                desc = readPartialReceptionDescriptor(payload);
                break;
            case TS_INFORMATION_DESCRIPTOR:
                desc = readTSInformationDescriptor(payload);
                break;
            case SI_PARAMETER_DESCRIPTOR:
                desc = readSIParameterDescriptor(payload);
                break;
            case BROADCASTER_NAME_DESCRIPTOR:
                desc = readBroadcasterNameDescriptor(payload);
                break;
            case EXTENDED_BROADCASTER_DESCRIPTOR:
                desc = readExtendedBroadcasterDescriptor(payload);
                break;
            case SERVICE_DESCRIPTOR:
                desc = readServiceDescriptor(payload);
                break;
            case CA_CONTRACT_INFO_DESCRIPTOR:
                desc = readCAContractInfoDescriptor(payload);
                break;
            case LOGO_TRANSMISSION_DESCRIPTOR:
                desc = readLogoTransmissionDescriptor(payload);
                break;
            case LINKAGE_DESCRIPTOR:
                desc = readLinkageDescriptor(payload);
                break;
            case SHORT_EVENT_DESCRIPTOR:
                desc = readShortEventDescriptor(payload);
                break;
            case COMPONENT_DESCRIPTOR:
                desc = readComponentDescriptor(payload);
                break;
            case AUDIO_COMPONENT_DESCRIPTOR:
                desc = readAudioComponentDescriptor(payload);
                break;
            case DATA_CONTENT_DESCRIPTOR:
                desc = readDataContentDescriptor(payload);
                break;
            case CONTENT_DESCRIPTOR:
                desc = readContentDescriptor(payload);
                break;
            case PARENTAL_RATING_DESCRIPTOR:
                desc = readParentalRatingDescriptor(payload);
                break;
            case EVENT_GROUP_DESCRIPTOR:
                desc = readEventGroupDescriptor(payload);
                break;
            case COMPONENT_GROUP_DESCRIPTOR:
                desc = readComponentGroupDescriptor(payload);
                break;
            case SERIES_DESCRIPTOR:
                desc = readSeriesDescriptor(payload);
                break;
            case EXTENDED_EVENT_DESCRIPTOR:
                desc = readExtendedEventDescriptor(payload);
                break;
            case LOCAL_TIME_OFFSET_DESCRIPTOR:
                desc = readLocalTimeOffsetDescriptor(payload);
                break;
            case STUFFING_DESCRIPTOR:
                desc = readStuffingDescriptor(payload);
                break;
            default:
                continue;
        }
        if (desc != null) {
            descriptors.push(desc);
        }
    }
    return descriptors;
}

export type CADescriptor = {
    tag: "ca";
    caSystemId: number;
    caPID: number;
    privateData: Uint8Array;
};

function readCADescriptor(buffer: Uint8Array): CADescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(4)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const caPID = reader.readUint16() & 0x1fff;
    const privateData = reader.slice();
    return {
        tag: "ca",
        caSystemId,
        caPID,
        privateData,
    };
}

export type AccessControlDescriptor = {
    tag: "accessControl";
    caSystemId: number;
    /** always 0b111 */
    transmissionType: number;
    /** EMM_PID */
    pid: number;
    /**
     * * privateData[0] = 0x01: Type A
     * * privateData[0] = 0x02: Type B
     */
    privateData: Uint8Array;
};

function readAccessControlDescriptor(buffer: Uint8Array): AccessControlDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(4)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const h = reader.readUint16();
    const transmissionType = h >> 13;
    const pid = h & 0x1fff;
    const privateData = reader.slice();
    return {
        tag: "accessControl",
        caSystemId,
        transmissionType,
        pid,
        privateData,
    };
}

export type CAServiceDescriptor = {
    tag: "caService";
    caSystemId: number;
    caBroadcasterGroupId: number;
    messageControl: number;
    serviceIdList: number[];
};

function readCAServiceDescriptor(buffer: Uint8Array): CAServiceDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(4)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const caBroadcasterGroupId = reader.readUint8();
    const messageControl = reader.readUint8();
    const serviceIdList: number[] = [];
    while (reader.canRead(2)) {
        serviceIdList.push(reader.readUint16());
    }
    return {
        tag: "caService",
        caSystemId,
        caBroadcasterGroupId,
        messageControl,
        serviceIdList,
    };
}

export type DigitalCopyControlDescriptor = {
    tag: "digitalCopyControl";
    digitalRecordingControlData: number;
    copyControlType: number;
    apsControlData?: number;
    /** unit: 1/4 Mbps */
    maximumBitRate?: number;
    componentControls?: ComponentControl[];
};

export type ComponentControl = {
    componentTag: number;
    digitalRecordingControlData: number;
    copyControlType: number;
    apsControlData?: number;
    /** unit: 1/4 Mbps */
    maximumBitRate?: number;
};

function readDigitalCopyControlDescriptor(
    buffer: Uint8Array
): DigitalCopyControlDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const f = reader.readUint8();
    const digitalRecordingControlData = f >> 6;
    const maximumBitRateFlag = !!((f >> 5) & 1);
    const componentControlFlag = !!((f >> 4) & 1);
    const copyControlType = (f >> 2) & 3;
    const apsControlData = copyControlType !== 0 ? f & 3 : undefined;
    if (maximumBitRateFlag && !reader.canRead(1)) {
        return undefined;
    }
    const maximumBitRate = maximumBitRateFlag ? reader.readUint8() : undefined;
    const componentControls: ComponentControl[] | undefined = componentControlFlag ? [] : undefined;
    if (componentControls != null) {
        if (!reader.canRead(1)) {
            return undefined;
        }
        const componentControlLength = reader.readUint8();
        if (!reader.canRead(componentControlLength)) {
            return undefined;
        }
        const creader = new BinaryReader(reader.subarray(componentControlLength));
        while (creader.canRead(2)) {
            const componentTag = creader.readUint8();
            const f = creader.readUint8();
            const digitalRecordingControlData = f >> 6;
            const maximumBitRateFlag = !!((f >> 5) & 1);
            const copyControlType = (f >> 2) & 3;
            const apsControlData = copyControlType !== 0 ? f & 3 : undefined;
            if (maximumBitRateFlag && !creader.canRead(1)) {
                break;
            }
            const maximumBitRate = maximumBitRateFlag ? creader.readUint8() : undefined;
            componentControls.push({
                componentTag,
                digitalRecordingControlData,
                copyControlType,
                apsControlData,
                maximumBitRate,
            });
        }
    }
    return {
        tag: "digitalCopyControl",
        digitalRecordingControlData,
        copyControlType,
        apsControlData,
        maximumBitRate,
        componentControls,
    };
}

export type ContentAvailabilityDescriptor = {
    tag: "contentAvailability";
    copyRestrictionMode: boolean;
    /** alwaus 1 */
    imageConstraintToken: boolean;
    /** alwaus 0 */
    retentionMode: boolean;
    /** alwaus 0b111 */
    retentionState: number;
    encryptionMode: boolean;
};

function readContentAvailabilityDescriptor(
    buffer: Uint8Array
): ContentAvailabilityDescriptor | undefined {
    if (buffer.length < 1) {
        return undefined;
    }
    const copyRestrictionMode = !!(buffer[0] & 0x40);
    const imageConstraintToken = !!(buffer[0] & 0x20);
    const retentionMode = !!(buffer[0] & 0x10);
    const retentionState = (buffer[0] >> 1) & 7;
    const encryptionMode = !!(buffer[0] & 1);
    return {
        tag: "contentAvailability",
        copyRestrictionMode,
        imageConstraintToken,
        retentionMode,
        retentionState,
        encryptionMode,
    };
}

export type StreamIdentifierDescriptor = {
    tag: "streamIdentifier";
    componentTag: number;
};

function readStreamIdentifierDescriptor(
    buffer: Uint8Array
): StreamIdentifierDescriptor | undefined {
    if (buffer.length < 1) {
        return undefined;
    }
    return {
        tag: "streamIdentifier",
        componentTag: buffer[0],
    };
}

export type HierarchicalTransmissionDescriptor = {
    tag: "hierarchicalTransmission";
    qualityLevel: boolean;
    referencePID: number;
};

function readHierarchicalTransmissionDescriptor(
    buffer: Uint8Array
): HierarchicalTransmissionDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const qualityLevel = !!(reader.readUint8() & 1);
    const referencePID = reader.readUint16() & 0x1fff;
}

export type DataComponentDescriptor = {
    tag: "dataComponent";
    dataComponentId: number;
    additionalDataComponentInfo: Uint8Array;
};

function readDataComponentDescriptor(buffer: Uint8Array): DataComponentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const dataComponentId = reader.readUint16();
    const additionalDataComponentInfo = reader.slice();
    return {
        tag: "dataComponent",
        dataComponentId,
        additionalDataComponentInfo,
    };
}

export type VideoDecodeControlDescriptor = {
    tag: "videoDecodeControl";
    stillPictureFlag: boolean;
    sequenceEndCodeFlag: boolean;
    videoEncodeFormat: number;
};

function readVideoDecodeControlDescriptor(
    buffer: Uint8Array
): VideoDecodeControlDescriptor | undefined {
    if (buffer.length < 1) {
        return undefined;
    }
    return {
        tag: "videoDecodeControl",
        stillPictureFlag: !!(buffer[0] & 0x80),
        sequenceEndCodeFlag: !!(buffer[0] & 0x40),
        videoEncodeFormat: (buffer[0] >> 2) & 15,
    };
}

export type CAEMMTSDescriptor = {
    tag: "caEMMTS";
    caSystemId: number;
    transportStreamId: number;
    originalNetworkId: number;
    powerSupplyPeriod: number;
};

function readCAEMMTSDescriptor(buffer: Uint8Array): CAEMMTSDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 2 + 2 + 1)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const transportStreamId = reader.readUint16();
    const originalNetworkId = reader.readUint16();
    const powerSupplyPeriod = reader.readUint8();
    return {
        tag: "caEMMTS",
        caSystemId,
        transportStreamId,
        originalNetworkId,
        powerSupplyPeriod,
    };
}

export type TerrestrialDeliverySystemDescriptor = {
    tag: "terrestrialDeliverySystem";
    areaCode: number;
    guardInterval: number;
    transmissionMode: number;
    frequencies: number[];
};

function readTerrestrialDeliverySystemDescriptor(
    buffer: Uint8Array
): TerrestrialDeliverySystemDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const h = reader.readUint16();
    const areaCode = h >> 4;
    const guardInterval = (h >> 2) & 3;
    const transmissionMode = h & 3;
    const frequencies: number[] = [];
    while (reader.canRead(2)) {
        frequencies.push(reader.readUint16());
    }
    return {
        tag: "terrestrialDeliverySystem",
        areaCode,
        guardInterval,
        transmissionMode,
        frequencies,
    };
}

export type PartialReceptionDescriptor = {
    tag: "partialReception";
    serviceIdList: number[];
};

function readPartialReceptionDescriptor(
    buffer: Uint8Array
): PartialReceptionDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const serviceIdList: number[] = [];
    while (reader.canRead(2)) {
        serviceIdList.push(reader.readUint16());
    }
    return {
        tag: "partialReception",
        serviceIdList,
    };
}

export type TSInformationDescriptor = {
    tag: "tsInformation";
    remoteControlKeyId: number;
    tsName: Uint8Array;
    transmissionTypes: TransmissionType[];
};

export type TransmissionType = {
    transmissionTypeInfo: number;
    serviceIdList: number[];
};

function readTSInformationDescriptor(buffer: Uint8Array): TSInformationDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const remoteControlKeyId = reader.readUint8();
    const h = reader.readUint8();
    const lengthOfTSName = h >> 2;
    const transmissionTypeCount = h & 3;
    if (!reader.canRead(lengthOfTSName)) {
        return undefined;
    }
    const tsName = reader.slice(lengthOfTSName);
    const transmissionTypes: TransmissionType[] = [];
    for (let j = 0; j < transmissionTypeCount; j++) {
        if (!reader.canRead(2)) {
            return undefined;
        }
        const transmissionTypeInfo = reader.readUint8();
        const numOfService = reader.readUint8();
        const serviceIdList: number[] = [];
        for (let k = 0; k < numOfService; k++) {
            if (!reader.canRead(2)) {
                return undefined;
            }
            const serviceId = reader.readUint16();
            serviceIdList.push(serviceId);
        }
        transmissionTypes.push({
            transmissionTypeInfo,
            serviceIdList,
        });
    }
    return {
        tag: "tsInformation",
        remoteControlKeyId,
        tsName,
        transmissionTypes,
    };
}

export type SIParameterDescriptor = {
    tag: "siParameterDescriptor";
    parameterVersion: number;
    updateTime: number;
    tableParameters: SITableParameter[];
};

export type SITableParameter = {
    tableId: number;
    tableDescription: Uint8Array;
};

function readSIParameterDescriptor(buffer: Uint8Array): SIParameterDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const parameterVersion = reader.readUint8();
    const updateTime = reader.readUint16();
    const tableParameters: SITableParameter[] = [];
    while (reader.canRead(1 + 1)) {
        const tableId = reader.readUint8();
        const tableDescriptionLength = reader.readUint8();
        const tableDescription = reader.slice(tableDescriptionLength);
        tableParameters.push({
            tableId,
            tableDescription,
        });
    }
    return {
        tag: "siParameterDescriptor",
        parameterVersion,
        updateTime,
        tableParameters,
    };
}

export type BroadcasterNameDescriptor = {
    tag: "broadcasterName";
    name: Uint8Array;
};

function readBroadcasterNameDescriptor(buffer: Uint8Array): BroadcasterNameDescriptor {
    return {
        tag: "broadcasterName",
        name: buffer.slice(),
    };
}

export type ExtendedBroadcasterDescriptor =
    | {
          tag: "extendedBroadcaster";
          broadcasterType: number;
      }
    | {
          tag: "extendedBroadcaster";
          broadcasterType: 0x1;
          terrestrialBroadcasterId: number;
          affiliationIdList: number[];
          broadcasters: ExtendedBroadcasterDescriptorBroadcaster[];
          privateData: Uint8Array;
      };

export type ExtendedBroadcasterDescriptorBroadcaster = {
    originalNetworkId: number;
    broadcasterId: number;
};

function readExtendedBroadcasterDescriptor(
    buffer: Uint8Array
): ExtendedBroadcasterDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const broadcasterType = reader.readUint8() >> 4;
    if (broadcasterType === 0x1) {
        const terrestrialBroadcasterId = reader.readUint16();
        const h = reader.readUint8();
        const numberOfAffiliationIdLoop = h >> 4;
        const numberOfBroadcasterIdLoop = h & 15;
        const affiliationIdList: number[] = [];
        if (!reader.canRead(numberOfAffiliationIdLoop)) {
            return undefined;
        }
        for (let i = 0; i < numberOfAffiliationIdLoop; i++) {
            const affiliationId = reader.readUint8();
            affiliationIdList.push(affiliationId);
        }
        if (!reader.canRead(numberOfBroadcasterIdLoop * 3)) {
            return undefined;
        }
        const broadcasters: ExtendedBroadcasterDescriptorBroadcaster[] = [];
        for (let i = 0; i < numberOfBroadcasterIdLoop; i++) {
            const originalNetworkId = reader.readUint16();
            const broadcasterId = reader.readUint8();
            broadcasters.push({
                originalNetworkId,
                broadcasterId,
            });
        }
        const privateData = reader.slice();
        return {
            tag: "extendedBroadcaster",
            broadcasterType,
            terrestrialBroadcasterId,
            affiliationIdList,
            broadcasters,
        };
    }
    return {
        tag: "extendedBroadcaster",
        broadcasterType,
    };
}

export type ServiceDescriptor = {
    tag: "serviceDescriptor";
    serviceType: number;
    serviceProviderName: Uint8Array;
    serviceName: Uint8Array;
};

function readServiceDescriptor(buffer: Uint8Array): ServiceDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1)) {
        return undefined;
    }
    const serviceType = reader.readUint8();
    const serviceProviderNameLength = reader.readUint8();
    if (!reader.canRead(serviceProviderNameLength)) {
        return undefined;
    }
    const serviceProviderName = reader.slice(serviceProviderNameLength);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const serviceNameLength = reader.readUint8();
    if (!reader.canRead(serviceNameLength)) {
        return undefined;
    }
    const serviceName = reader.slice(serviceNameLength);
    return {
        tag: "serviceDescriptor",
        serviceType,
        serviceProviderName,
        serviceName,
    };
}

export type CAContractInfoDescriptor = {
    tag: "caContractInfoDescriptor";
    caSystemId: number;
    caUnitId: number;
    components: number[];
    contractVerificationInfo: Uint8Array;
    /** unused */
    feeName: Uint8Array;
};

function readCAContractInfoDescriptor(buffer: Uint8Array): CAContractInfoDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const b = reader.readUint8();
    const caUnitId = b >> 4;
    const numOfComponent = b & 0xf;
    if (!reader.canRead(numOfComponent)) {
        return undefined;
    }
    const components: number[] = [];
    for (let i = 0; i < numOfComponent; i++) {
        components.push(reader.readUint8());
    }
    if (!reader.canRead(1)) {
        return undefined;
    }
    const contractVerificationInfoLength = reader.readUint8();
    if (!reader.canRead(contractVerificationInfoLength)) {
        return undefined;
    }
    const contractVerificationInfo = reader.slice(contractVerificationInfoLength);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const feeNameLength = reader.readUint8();
    if (!reader.canRead(feeNameLength)) {
        return undefined;
    }
    const feeName = reader.slice(feeNameLength);
    return {
        tag: "caContractInfoDescriptor",
        caSystemId,
        caUnitId,
        components,
        contractVerificationInfo,
        feeName,
    };
}

export const LOGO_TRANSMISSION_TYPE_DIRECT = 1;
export const LOGO_TRANSMISSION_TYPE_INDIRECT = 2;
export const LOGO_TRANSMISSION_TYPE_SIMPLE = 3;

export type LogoTransmissionDescriptor =
    | LogoTransmissionDescriptorDirect
    | LogoTransmissionDescriptorIndirect
    | LogoTransmissionDescriptorSimple;

export type LogoTransmissionDescriptorDirect = {
    tag: "logoTransmission";
    logoTransmissionType: 1;
    logoId: number;
    logoVersion: number;
    downloadDataId: number;
};

export type LogoTransmissionDescriptorIndirect = {
    tag: "logoTransmission";
    logoTransmissionType: 2;
    logoId: number;
};

export type LogoTransmissionDescriptorSimple = {
    tag: "logoTransmission";
    logoTransmissionType: 3;
    logoChar: Uint8Array;
};

function readLogoTransmissionDescriptor(
    buffer: Uint8Array
): LogoTransmissionDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const logoTransmissionType = reader.readUint8();
    if (logoTransmissionType === LOGO_TRANSMISSION_TYPE_DIRECT) {
        if (!reader.canRead(2 + 2 + 2)) {
            return undefined;
        }
        const logoId = reader.readUint16() & 0x1ff;
        const logoVersion = reader.readUint16() & 0xfff;
        const downloadDataId = reader.readUint16();
        return {
            tag: "logoTransmission",
            logoTransmissionType,
            logoId,
            logoVersion,
            downloadDataId,
        };
    } else if (logoTransmissionType === LOGO_TRANSMISSION_TYPE_INDIRECT) {
        if (!reader.canRead(2)) {
            return undefined;
        }
        const logoId = reader.readUint16() & 0x1ff;
        return {
            tag: "logoTransmission",
            logoTransmissionType,
            logoId,
        };
    } else if (logoTransmissionType === LOGO_TRANSMISSION_TYPE_SIMPLE) {
        return {
            tag: "logoTransmission",
            logoTransmissionType,
            logoChar: reader.slice(),
        };
    } else {
        return undefined;
    }
}

export type LinkageDescriptor = {
    tag: "linkage";
    transportStreamId: number;
    originalNetworkId: number;
    serviceId: number;
    linkageType: number;
    privateData: Uint8Array;
};

function readLinkageDescriptor(buffer: Uint8Array): LinkageDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 2 + 2 + 1)) {
        return undefined;
    }
    const transportStreamId = reader.readUint16();
    const originalNetworkId = reader.readUint16();
    const serviceId = reader.readUint16();
    const linkageType = reader.readUint8();
    const privateData = reader.slice();
    return {
        tag: "linkage",
        transportStreamId,
        originalNetworkId,
        serviceId,
        linkageType,
        privateData,
    };
}

export type ShortEventDescriptor = {
    tag: "shortEvent";
    iso639LanguageCode: number;
    eventName: Uint8Array;
    text: Uint8Array;
};

function readShortEventDescriptor(buffer: Uint8Array): ShortEventDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(3 + 1)) {
        return undefined;
    }
    const iso639LanguageCode = reader.readUint24();
    const eventNameLength = reader.readUint8();
    if (!reader.canRead(eventNameLength)) {
        return undefined;
    }
    const eventName = reader.slice(eventNameLength);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const textLength = reader.readUint8();
    if (!reader.canRead(textLength)) {
        return undefined;
    }
    const text = reader.slice(textLength);
    return {
        tag: "shortEvent",
        iso639LanguageCode,
        eventName,
        text,
    };
}

export type ComponentDescriptor = {
    tag: "component";
    /** always 0x01 (video) */
    streamContent: number;
    componentType: number;
    componentTag: number;
    iso639LanguageCode: number;
    text: Uint8Array;
};

function readComponentDescriptor(buffer: Uint8Array): ComponentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 1 + 3)) {
        return undefined;
    }
    const streamContent = reader.readUint8() & 0xf;
    const componentType = reader.readUint8();
    const componentTag = reader.readUint8();
    const iso639LanguageCode = reader.readUint24();
    const text = reader.slice();
    return {
        tag: "component",
        streamContent,
        componentType,
        componentTag,
        iso639LanguageCode,
        text,
    };
}

export type AudioComponentDescriptor = {
    tag: "audioComponent";
    streamContent: number;
    componentType: number;
    componentTag: number;
    streamType: number;
    simulcastGroupTag: number;
    mainComponentFlag: boolean;
    qualityIndicator: number;
    samplingRate: number;
    iso639LanguageCode: number;
    esMultiLingualISO639LanguageCode?: number;
    text: Uint8Array;
};

function readAudioComponentDescriptor(buffer: Uint8Array): AudioComponentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 1 + 1 + 1 + 1 + 3)) {
        return undefined;
    }
    const streamContent = reader.readUint8() & 0x0f;
    const componentType = reader.readUint8();
    const componentTag = reader.readUint8();
    const streamType = reader.readUint8();
    const simulcastGroupTag = reader.readUint8();
    const b6 = reader.readUint8();
    const esMultiLingualFlag = !!(b6 & 0x80);
    const mainComponentFlag = !!(b6 & 0x40);
    const qualityIndicator = (b6 >> 4) & 3;
    const samplingRate = (b6 >> 1) & 7;
    const iso639LanguageCode = reader.readUint24();
    if (esMultiLingualFlag && !reader.canRead(3)) {
        return undefined;
    }
    const esMultiLingualISO639LanguageCode = esMultiLingualFlag ? reader.readUint24() : undefined;
    return {
        tag: "audioComponent",
        streamContent,
        componentType,
        componentTag,
        streamType,
        simulcastGroupTag,
        mainComponentFlag,
        qualityIndicator,
        samplingRate,
        iso639LanguageCode,
        esMultiLingualISO639LanguageCode,
        text: reader.slice(),
    };
}

export type DataContentDescriptor = {
    tag: "dataContent";
    dataComponentId: number;
    entryComponent: number;
    selector: Uint8Array;
    componentReferences: number[];
    iso639LanguageCode: number;
    text: Uint8Array;
};

function readDataContentDescriptor(buffer: Uint8Array): DataContentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 1)) {
        return undefined;
    }
    const dataComponentId = reader.readUint16();
    const entryComponent = reader.readUint8();
    const selectorLength = reader.readUint8();
    if (!reader.canRead(selectorLength)) {
        return undefined;
    }
    const selector = reader.slice(selectorLength);
    if (!reader.canRead(1 + 3 + 1)) {
        return undefined;
    }
    const numOfComponentRef = reader.readUint8();
    if (!reader.canRead(numOfComponentRef)) {
        return undefined;
    }
    const componentReferences = Array.from(reader.subarray(numOfComponentRef));
    if (!reader.canRead(3 + 1)) {
        return undefined;
    }
    const iso639LanguageCode = reader.readUint24();
    const textLength = reader.readUint8();
    if (!reader.canRead(textLength)) {
        return undefined;
    }
    const text = reader.slice(textLength);
    return {
        tag: "dataContent",
        dataComponentId,
        entryComponent,
        selector,
        componentReferences,
        iso639LanguageCode,
        text,
    };
}

export type ContentDescriptor = {
    tag: "content";
    items: ContentDescriptorItem[];
};

export type ContentDescriptorItem = {
    contentNibbleLevel1: number;
    contentNibbleLevel2: number;
    userNibble: number;
};

function readContentDescriptor(buffer: Uint8Array): ContentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const items: ContentDescriptorItem[] = [];
    while (reader.canRead(1 + 1)) {
        const b0 = reader.readUint8();
        const userNibble = reader.readUint8();
        items.push({
            contentNibbleLevel1: b0 >> 4,
            contentNibbleLevel2: b0 & 0xf,
            userNibble,
        });
    }
    return {
        tag: "content",
        items,
    };
}

export type ParentalRatingDescriptor = {
    tag: "parentalRating";
    ratings: ParentalRating[];
};

export type ParentalRating = {
    countryCode: number;
    rating: number;
};

function readParentalRatingDescriptor(buffer: Uint8Array): ParentalRatingDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const ratings: ParentalRating[] = [];
    while (reader.canRead(3 + 1)) {
        const countryCode = reader.readUint24();
        const rating = reader.readUint8();
        ratings.push({
            countryCode,
            rating,
        });
    }
    return {
        tag: "parentalRating",
        ratings,
    };
}

export const EVENT_GROUP_TYPE_SHARING = 0x1;
export const EVENT_GROUP_TYPE_RELAY = 0x2;
export const EVENT_GROUP_TYPE_MOVEMENT = 0x3;
export const EVENT_GROUP_TYPE_RELAY_TO_OTHER_NETWORK = 0x4;
export const EVENT_GROUP_TYPE_MOVEMENT_FROM_OTHER_NETWORK = 0x5;

export type EventGroupDescriptor =
    | {
          tag: "eventGroup";
          groupType: number;
          events: EventGroupEvent[];
          privateData: Uint8Array;
      }
    | {
          tag: "eventGroup";
          groupType: 4 | 5;
          events: EventGroupEvent[];
          otherNetworkEvents: EventGroupOtherNetworkEvent[];
      };

export type EventGroupEvent = {
    serviceId: number;
    eventId: number;
};

export type EventGroupOtherNetworkEvent = {
    originalNetworkId: number;
    transportStreamId: number;
    serviceId: number;
    eventId: number;
};

function readEventGroupDescriptor(buffer: Uint8Array): EventGroupDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const groupType = b0 >> 4;
    const eventCount = b0 & 0xf;
    const events: EventGroupEvent[] = [];
    if (!reader.canRead((2 + 2) * eventCount)) {
        return undefined;
    }
    for (let i = 0; i < eventCount; i++) {
        const serviceId = reader.readUint16();
        const eventId = reader.readUint16();
        events.push({
            serviceId,
            eventId,
        });
    }
    if (
        groupType === EVENT_GROUP_TYPE_RELAY_TO_OTHER_NETWORK ||
        groupType === EVENT_GROUP_TYPE_MOVEMENT_FROM_OTHER_NETWORK
    ) {
        const otherNetworkEvents: EventGroupOtherNetworkEvent[] = [];
        while (reader.canRead(8)) {
            const originalNetworkId = reader.readUint16();
            const transportStreamId = reader.readUint16();
            const serviceId = reader.readUint16();
            const eventId = reader.readUint16();
            otherNetworkEvents.push({
                originalNetworkId,
                transportStreamId,
                serviceId,
                eventId,
            });
        }
        return {
            tag: "eventGroup",
            groupType,
            events,
            otherNetworkEvents,
        };
    } else {
        return {
            tag: "eventGroup",
            groupType,
            events,
            privateData: reader.slice(),
        };
    }
}

export type ComponentGroupDescriptor = {
    tag: "componentGroup";
    componentGroupType: number;
    groups: ComponentGroup[];
};

export type ComponentGroup = {
    componentGroupId: number;
    caUnits: CAUnit[];
    totalBitRate?: number;
    text: Uint8Array;
};

export type CAUnit = {
    caUnitId: number;
    componentTags: number[];
};

export function readComponentGroupDescriptor(
    buffer: Uint8Array
): ComponentGroupDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const h = reader.readUint8();
    const componentGroupType = h >> 5;
    const totalBitRateFlag = h & 0x10;
    const numOfGroup = h & 0xf;
    const groups: ComponentGroup[] = [];
    for (let i = 0; i < numOfGroup; i++) {
        if (!reader.canRead(1)) {
            return undefined;
        }
        const h = reader.readUint8();
        const componentGroupId = h >> 4;
        const numOfCAUnit = h & 0xf;
        const caUnits: CAUnit[] = [];
        for (let i = 0; i < numOfCAUnit; i++) {
            if (!reader.canRead(1)) {
                return undefined;
            }
            const h = reader.readUint8();
            const caUnitId = h >> 4;
            const numOfComponent = h & 0xf;
            if (!reader.canRead(numOfComponent)) {
                return undefined;
            }
            const componentTags = Array.from(reader.subarray(numOfComponent));
            caUnits.push({
                caUnitId,
                componentTags,
            });
        }
        if (totalBitRateFlag && !reader.canRead(1)) {
            return undefined;
        }
        const totalBitRate = totalBitRateFlag ? reader.readUint8() : undefined;
        if (!reader.canRead(1)) {
            return undefined;
        }
        const textLength = reader.readUint8();
        if (!reader.canRead(textLength)) {
            return undefined;
        }
        const text = reader.slice(textLength);
        groups.push({
            componentGroupId,
            caUnits,
            totalBitRate,
            text,
        });
    }
    return {
        tag: "componentGroup",
        componentGroupType,
        groups,
    };
}

export type SeriesDescriptor = {
    tag: "series";
    seriesId: number;
    repeatLabel: number;
    programPattern: number;
    expireDateValidFlag: boolean;
    /** MJD */
    expireDate: number;
    episodeNumber: number;
    lastEpisodeNumber: number;
    seriesName: Uint8Array;
};

function readSeriesDescriptor(buffer: Uint8Array): SeriesDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 2 + 3)) {
        return undefined;
    }
    const seriesId = reader.readUint16();
    const b1 = reader.readUint8();
    const repeatLabel = b1 >> 4;
    const programPattern = (b1 >> 1) & 7;
    const expireDateValidFlag = !!(b1 & 1);
    const expireDate = reader.readUint16();
    const b = reader.readUint24();
    const episodeNumber = b >> 12;
    const lastEpisodeNumber = b & 0xfff;
    const seriesName = reader.slice();
    return {
        tag: "series",
        seriesId,
        repeatLabel,
        programPattern,
        expireDateValidFlag,
        expireDate,
        episodeNumber,
        lastEpisodeNumber,
        seriesName,
    };
}

export type ExtendedEventDescriptor = {
    tag: "extendedEvent";
    descriptorNumber: number;
    lastDescriptorNumber: number;
    iso639LanguageCode: number;
    items: ExtendedEventItem[];
    /** unused */
    text: Uint8Array;
};

export type ExtendedEventItem = {
    itemDescription: Uint8Array;
    item: Uint8Array;
};

function readExtendedEventDescriptor(buffer: Uint8Array): ExtendedEventDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 3 + 1)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const descriptorNumber = b0 >> 4;
    const lastDescriptorNumber = b0 & 0xf;
    const iso639LanguageCode = reader.readUint24();
    const lengthOfItems = reader.readUint8();
    if (!reader.canRead(lengthOfItems)) {
        return undefined;
    }
    const items: ExtendedEventItem[] = [];
    const ireader = new BinaryReader(reader.subarray(lengthOfItems));
    while (ireader.canRead(1)) {
        const itemDescriptionLength = ireader.readUint8();
        if (!ireader.canRead(itemDescriptionLength)) {
            break;
        }
        const itemDescription = ireader.slice(itemDescriptionLength);
        if (!ireader.canRead(1)) {
            break;
        }
        const itemLength = ireader.readUint8();
        if (!ireader.canRead(itemLength)) {
            break;
        }
        const item = ireader.slice(itemLength);
        items.push({
            itemDescription,
            item,
        });
    }
    if (!reader.canRead(1)) {
        return undefined;
    }
    const textLength = reader.readUint8();
    if (!reader.canRead(textLength)) {
        return undefined;
    }
    const text = reader.slice(textLength);
    return {
        tag: "extendedEvent",
        descriptorNumber,
        lastDescriptorNumber,
        iso639LanguageCode,
        items,
        text,
    };
}

export type LocalTimeOffsetDescriptor = {
    tag: "localTimeOffset";
    offsets: LocalTimeOffset[];
};

export type LocalTimeOffset = {
    countryCode: number;
    countryRegionId: number;
    localTimeOffsetPolarity: boolean;
    localTimeOffset: number;
    timeOfChange: number;
    nextTimeOffset: number;
};

function readLocalTimeOffsetDescriptor(buffer: Uint8Array): LocalTimeOffsetDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const offsets: LocalTimeOffset[] = [];
    while (reader.canRead(3 + 1 + 2 + 5 + 2)) {
        const countryCode = reader.readUint24();
        const a = reader.readUint8();
        const countryRegionId = a >> 2;
        const localTimeOffsetPolarity = !!(a & 1);
        const localTimeOffset = reader.readUint16();
        const timeOfChange = reader.readUint40();
        const nextTimeOffset = reader.readUint16();
        offsets.push({
            countryCode,
            countryRegionId,
            localTimeOffsetPolarity,
            localTimeOffset,
            timeOfChange,
            nextTimeOffset,
        });
    }
    return {
        tag: "localTimeOffset",
        offsets,
    };
}

export type StuffingDescriptor = {
    tag: "stuffing";
};

function readStuffingDescriptor(_: Uint8Array): StuffingDescriptor {
    return { tag: "stuffing" };
}
