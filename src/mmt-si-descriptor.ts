import { MMTGeneralLocationInfo, readMMTGeneralLocationInfo } from "./mmt-general-location-info";
import { NTP64Timestamp } from "./ntp";
import {
    EmergencyInformationDescriptor,
    readEmergencyInformationDescriptor,
} from "./si-descriptor";
export { EmergencyInformationDescriptor };
import { BinaryReader } from "./utils";
import {
    SAMPLING_RATE_48000,
    QUALITY_INDICATOR_MODE1,
    QUALITY_INDICATOR_MODE2,
    QUALITY_INDICATOR_MODE3,
    STREAM_TYPE_LATM_LOAS,
} from "./ts/si-descriptor";
export {
    SAMPLING_RATE_48000,
    QUALITY_INDICATOR_MODE1,
    QUALITY_INDICATOR_MODE2,
    QUALITY_INDICATOR_MODE3,
    STREAM_TYPE_LATM_LOAS,
};

const MMT_SI_ACESS_CONTROL_DESCRIPTOR = 0x8004;
const MMT_SI_CONTENT_COPY_CONTROL_DESCRIPTOR = 0x8038;
const MMT_SI_EMERGENCY_INFORMATION_DESCRIPTOR = 0x8007;
const MMT_SI_EMERGENCY_NEWS_DESCRIPTOR = 0x8040;
const MMT_SI_CONTENT_USAGE_CONTROL_DESCRIPTOR = 0x8039;
const MMT_SI_MH_PARENTAL_RATING_DESCRIPTOR = 0x8013;
const MMT_SI_APPLICATION_SERVICE_DESCRIPTOR = 0x8034;
const MMT_SI_ASSET_GROUP_DESCRIPTOR = 0x8000;
const MMT_SI_MPU_TIMESTAMP_DESCRIPTOR = 0x0001;
const MMT_SI_MH_HIERARCHY_DESCRIPTOR = 0x8037;
const MMT_SI_VIDEO_COMPONENT_DESCRIPTOR = 0x8010;
const MMT_SI_MH_STREAM_IDENTIFIER_DESCRIPTOR = 0x8011;
const MMT_SI_MH_AUDIO_COMPONENT_DESCRIPTOR = 0x8014;
const MMT_SI_MH_TARGET_REGION_DESCRIPTOR = 0x8015;
const MMT_SI_MH_DATA_COMPONENT_DESCRIPTOR = 0x8020;
const MMT_SI_MPU_EXTENDED_TIMESTAMP_DESCRIPTOR = 0x8026;
const MMT_SI_MH_EVENT_GROUP_DESCRIPTOR = 0x800c;
const MMT_SI_MH_SHORT_EVENT_DESCRIPTOR = 0xf001;
const MMT_SI_MH_EXTENDED_EVENT_DESCRIPTOR = 0xf002;
const MMT_SI_MH_CONTENT_DESCRIPTOR = 0x8012;
const MMT_SI_MH_SERIES_DESCRIPTOR = 0x8016;
const MMT_SI_MULTIMEDIA_SERVICE_INFO_DESCRIPTOR = 0x803f;
const MMT_SI_MH_SERVICE_DESCRIPTOR = 0x8019;
const MMT_SI_MH_CA_CONTRACT_INFO_DESCRIPTOR = 0x8041;
const MMT_SI_MH_LOGO_TRANSMISSION_DESCRIPTOR = 0x8025;
const MMT_SI_MH_SI_PARAMETER_DESCRIPTOR = 0x8017;
const MMT_SI_MH_BROADCASTER_NAME_DESCRIPTOR = 0x8018;
const MMT_SI_MH_SERVICE_LIST_DESCRIPTOR = 0x800d;
const MMT_SI_RELATED_BROADCASTER_DESCRIPTOR = 0x803e;
const MMT_SI_MH_LOCAL_TIME_OFFSET_DESCRIPTOR = 0x8023;
const MMT_SI_SCRAMBLER_DESCRIPTOR = 0x8005;
const MMT_SI_MH_CA_SERVICE_DESCRIPTOR = 0x8042;
const MMT_SI_MH_APPLICATION_DESCRIPTOR = 0x8029;
const MMT_SI_MH_TRANSPORT_PROTOCOL_DESCRIPTOR = 0x802a;
const MMT_SI_MH_SIMPLE_APPLICATION_LOCATION_DESCRIPTOR = 0x802b;
const MMT_SI_MH_APPLICATION_BOUNDARY_AND_PERMISSION_DESCRIPTOR = 0x802c;
const MMT_SI_UTC_NPT_REFERENCE_DESCRIPTOR = 0x8021;
const MMT_SI_EVENT_MESSAGE_DESCRIPTOR = 0xf003;
const MMT_SI_MPU_NODE_DESCRIPTOR = 0x8035;

export type MMTSIDescriptor =
    | AccessControlDescriptor
    | ContentCopyControlDescriptor
    | EmergencyInformationDescriptor
    | EmergencyNewsDescriptor
    | ContentUsageControlDescriptor
    | MHParentalRatingDescriptor
    | ApplicationServiceDescriptor
    | AssetGroupDescriptor
    | MPUTimestampDescriptor
    | MHHierarchyDescriptor
    | VideoComponentDescriptor
    | MHStreamIdentifierDescriptor
    | MHAudioComponentDescriptor
    | MHTargetRegionDescriptor
    | MHDataComponentDescriptor
    | MPUExtendedTimestampDescriptor
    | MHEventGroupDescriptor
    | MHShortEventDescriptor
    | MHExtendedEventDescriptor
    | MHContentDescriptor
    | MHSeriesDescriptor
    | MultimediaServiceInfoDescriptor
    | MHServiceDescriptor
    | MHCAContractInfoDescriptor
    | MHLogoTransmissionDescriptor
    | MHSIParameterDescriptor
    | MHBroadcasterNameDescriptor
    | MHServiceListDescriptor
    | SIRelatedBroadcasterDescriptor
    | MHLocalTimeOffsetDescriptor
    | ScramblerDescriptor
    | CAServiceDescriptor
    | MHApplicationDescriptor
    | MHTransportProtocolDescriptor
    | MHSimpleApplicationLocationDescriptor
    | MHApplicationBoundaryAndPermissionDescriptor
    | UTCNPTReferenceDescriptor
    | EventMessageDescriptor
    | MPUNodeDescriptor;

export function readMMTSIDescriptors(buffer: Uint8Array): MMTSIDescriptor[] {
    const reader = new BinaryReader(buffer);
    const descriptors: MMTSIDescriptor[] = [];
    while (reader.canRead(2 + 1)) {
        const descriptorTag = reader.readUint16();
        let descriptor: MMTSIDescriptor | undefined;
        let lengthBytes: number;
        let descriptorLength: number;
        if ((descriptorTag >= 0x4000 && descriptorTag <= 0x6fff) || descriptorTag >= 0xf000) {
            lengthBytes = 2;
        } else if (descriptorTag >= 0x7000 && descriptorTag <= 0x7fff) {
            lengthBytes = 4;
        } else {
            lengthBytes = 1;
        }
        switch (lengthBytes) {
            case 4:
                descriptorLength = reader.readUint32();
                break;
            case 2:
                descriptorLength = reader.readUint16();
                break;
            default:
                descriptorLength = reader.readUint8();
                break;
        }
        if (!reader.canRead(descriptorLength)) {
            break;
        }
        const desc = reader.subarray(descriptorLength);
        switch (descriptorTag) {
            case MMT_SI_ACESS_CONTROL_DESCRIPTOR:
                descriptor = readAccessControlDescriptor(desc);
                break;
            case MMT_SI_CONTENT_COPY_CONTROL_DESCRIPTOR:
                descriptor = readContentCopyControlDescriptor(desc);
                break;
            case MMT_SI_EMERGENCY_INFORMATION_DESCRIPTOR:
                descriptor = readEmergencyInformationDescriptor(desc);
                break;
            case MMT_SI_EMERGENCY_NEWS_DESCRIPTOR:
                descriptor = readEmergencyNewsDescriptor(desc);
                break;
            case MMT_SI_CONTENT_USAGE_CONTROL_DESCRIPTOR:
                descriptor = readContentUsageControlDescriptor(desc);
                break;
            case MMT_SI_MH_PARENTAL_RATING_DESCRIPTOR:
                descriptor = readMHParentalRatingDescriptor(desc);
                break;
            case MMT_SI_APPLICATION_SERVICE_DESCRIPTOR:
                descriptor = readApplicationServiceDescriptor(desc);
                break;
            case MMT_SI_ASSET_GROUP_DESCRIPTOR:
                descriptor = readAssetGroupDescriptor(desc);
                break;
            case MMT_SI_MPU_TIMESTAMP_DESCRIPTOR:
                descriptor = readMPUTimestampDescriptor(desc);
                break;
            case MMT_SI_MH_HIERARCHY_DESCRIPTOR:
                descriptor = readMHHierarchyDescriptor(desc);
                break;
            case MMT_SI_VIDEO_COMPONENT_DESCRIPTOR:
                descriptor = readVideoComponentDescriptor(desc);
                break;
            case MMT_SI_MH_STREAM_IDENTIFIER_DESCRIPTOR:
                descriptor = readMHStreamIdentifierDescriptor(desc);
                break;
            case MMT_SI_MH_AUDIO_COMPONENT_DESCRIPTOR:
                descriptor = readMHAudioComponentDescriptor(desc);
                break;
            case MMT_SI_MH_TARGET_REGION_DESCRIPTOR:
                descriptor = readMHTargetRegionDescriptor(desc);
                break;
            case MMT_SI_MH_DATA_COMPONENT_DESCRIPTOR:
                descriptor = readMHDataComponentDescriptor(desc);
                break;
            case MMT_SI_MPU_EXTENDED_TIMESTAMP_DESCRIPTOR:
                descriptor = readMPUExtendedTimestampDescriptor(desc);
                break;
            case MMT_SI_MH_EVENT_GROUP_DESCRIPTOR:
                descriptor = readMHEventGroupDescriptor(desc);
                break;
            case MMT_SI_MH_CONTENT_DESCRIPTOR:
                descriptor = readMHContentDescriptor(desc);
                break;
            case MMT_SI_MH_SERIES_DESCRIPTOR:
                descriptor = readMHSeriesDescriptor(desc);
                break;
            case MMT_SI_MULTIMEDIA_SERVICE_INFO_DESCRIPTOR:
                descriptor = readMultimediaServiceInfoDescriptor(desc);
                break;
            case MMT_SI_MH_SERVICE_DESCRIPTOR:
                descriptor = readMHServiceDescriptor(desc);
                break;
            case MMT_SI_MH_CA_CONTRACT_INFO_DESCRIPTOR:
                descriptor = readMHCAContractInfoDescriptor(desc);
                break;
            case MMT_SI_MH_LOGO_TRANSMISSION_DESCRIPTOR:
                descriptor = readMHLogoTransmissionDescriptor(desc);
                break;
            case MMT_SI_MH_SI_PARAMETER_DESCRIPTOR:
                descriptor = readMHSIParameterDescriptor(desc);
                break;
            case MMT_SI_MH_BROADCASTER_NAME_DESCRIPTOR:
                descriptor = readMHBroadcasterNameDescriptor(desc);
                break;
            case MMT_SI_MH_SERVICE_LIST_DESCRIPTOR:
                descriptor = readMHServiceListDescriptor(desc);
                break;
            case MMT_SI_RELATED_BROADCASTER_DESCRIPTOR:
                descriptor = readSIRelatedBroadcasterDescriptor(desc);
                break;
            case MMT_SI_MH_LOCAL_TIME_OFFSET_DESCRIPTOR:
                descriptor = readMHLocalTimeOffsetDescriptor(desc);
                break;
            case MMT_SI_MH_SHORT_EVENT_DESCRIPTOR:
                descriptor = readMHShortEventDescriptor(desc);
                break;
            case MMT_SI_MH_EXTENDED_EVENT_DESCRIPTOR:
                descriptor = readMHExtendedEventDescriptor(desc);
                break;
            case MMT_SI_SCRAMBLER_DESCRIPTOR:
                descriptor = readScramblerDescriptor(desc);
                break;
            case MMT_SI_MH_CA_SERVICE_DESCRIPTOR:
                descriptor = readCAServiceDescriptor(desc);
                break;
            case MMT_SI_MH_APPLICATION_DESCRIPTOR:
                descriptor = readMHApplicationDescriptor(desc);
                break;
            case MMT_SI_MH_TRANSPORT_PROTOCOL_DESCRIPTOR:
                descriptor = readMHTransportProtocolDescriptor(desc);
                break;
            case MMT_SI_MH_SIMPLE_APPLICATION_LOCATION_DESCRIPTOR:
                descriptor = readMHSimpleApplicationLocationDescriptor(desc);
                break;
            case MMT_SI_MH_APPLICATION_BOUNDARY_AND_PERMISSION_DESCRIPTOR:
                descriptor = readMHApplicationBoundaryAndPermissionDescriptor(desc);
                break;
            case MMT_SI_UTC_NPT_REFERENCE_DESCRIPTOR:
                descriptor = readUTCNPTReferenceDescriptor(desc);
                break;
            case MMT_SI_EVENT_MESSAGE_DESCRIPTOR:
                descriptor = readEventMessageDescriptor(desc);
                break;
            case MMT_SI_MPU_NODE_DESCRIPTOR:
                descriptor = readMPUNodeDescriptor(desc);
                break;
            default:
                continue;
        }
        if (descriptor != null) {
            descriptors.push(descriptor);
        }
    }
    return descriptors;
}

export type AccessControlDescriptor = {
    tag: "accessControl";
    caSystemId: number;
    locationInfo: MMTGeneralLocationInfo;
    /** unused */
    privateData: Uint8Array;
};

function readAccessControlDescriptor(buffer: Uint8Array): AccessControlDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const locationInfo = readMMTGeneralLocationInfo(reader);
    if (locationInfo == null) {
        return undefined;
    }
    return {
        tag: "accessControl",
        caSystemId,
        locationInfo,
        privateData: buffer.slice(reader.tell()),
    };
}

export type ContentCopyControlDescriptor = {
    tag: "contentCopyControl";
    digitalRecordingControlData: number;
    maximumBitRate?: number;
    /** unused */
    componentControls?: ComponentControl[];
};

export type ComponentControl = {
    componentTag: number;
    digitalRecordingControlData: number;
    maximumBitRate?: number;
};

function readContentCopyControlDescriptor(
    buffer: Uint8Array
): ContentCopyControlDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const h = reader.readUint8();
    const digitalRecordingControlData = h >> 6;
    const maximumBitRateFlag = h & 0x20;
    const componentControlFlag = h & 0x10;
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
        while (creader.canRead(4)) {
            const componentTag = reader.readUint16();
            const h = reader.readUint8();
            reader.skip(1); // reserved_future_use
            const digitalRecordingControlData = h >> 6;
            const maximumBitRateFlag = h & 0x20;
            if (maximumBitRateFlag && !reader.canRead(1)) {
                break;
            }
            const maximumBitRate = maximumBitRateFlag ? reader.readUint8() : undefined;
            componentControls.push({
                componentTag,
                digitalRecordingControlData,
                maximumBitRate,
            });
        }
    }
    return {
        tag: "contentCopyControl",
        digitalRecordingControlData,
        maximumBitRate,
        componentControls,
    };
}

export type EmergencyNewsDescriptor = {
    tag: "emergencyNews";
    transmitTimestamp: NTP64Timestamp;
};

function readEmergencyNewsDescriptor(buffer: Uint8Array): EmergencyNewsDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(8 + 1)) {
        return undefined;
    }
    const transmitTimestamp = reader.readNTP64Timestamp();
    reader.skip(1);
    return {
        tag: "emergencyNews",
        transmitTimestamp,
    };
}

export type ContentUsageControlDescriptor = {
    tag: "contentUsageControl";
    remoteViewMode: boolean;
    copyRestrictionMode: boolean;
    /** always 1 */
    imageConstraintToken: boolean;
    /** always 0 */
    retentionMode: boolean;
    /** always 0b111 */
    retentionState: number;
    encryptionMode: boolean;
};

function readContentUsageControlDescriptor(
    buffer: Uint8Array
): ContentUsageControlDescriptor | undefined {
    if (buffer.length < 1 + 1) {
        return undefined;
    }
    const remoteViewMode = !!(buffer[0] & 0x80);
    const copyRestrictionMode = !!(buffer[0] & 0x40);
    const imageConstraintToken = !!(buffer[0] & 0x20);
    const retentionMode = !!(buffer[1] & 0b00010000);
    const retentionState = (buffer[1] & 0b00001110) >> 1;
    const encryptionMode = !!(buffer[1] & 0b00000001);
    return {
        tag: "contentUsageControl",
        remoteViewMode,
        copyRestrictionMode,
        imageConstraintToken,
        retentionMode,
        retentionState,
        encryptionMode,
    };
}

export type MHParentalRatingDescriptor = {
    tag: "mhParentalRating";
    ratings: MHParentalRating[];
};

export type MHParentalRating = {
    countryCode: number;
    rating: number;
};

function readMHParentalRatingDescriptor(
    buffer: Uint8Array
): MHParentalRatingDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const ratings: MHParentalRating[] = [];
    while (reader.canRead(3 + 1)) {
        const countryCode = reader.readUint24();
        const rating = reader.readUint8();
        ratings.push({
            countryCode,
            rating,
        });
    }
    return {
        tag: "mhParentalRating",
        ratings,
    };
}

export const APPLICATION_FORMAT_ARIB_HTML5 = 0x1;

export const DOCUMENT_RESOLUTION_1920_1080 = 0b0000;
export const DOCUMENT_RESOLUTION_3840_2160 = 0b0001;
export const DOCUMENT_RESOLUTION_7680_4320 = 0b0010;

export type ApplicationServiceDescriptor = {
    tag: "applicationService";
    /** @see {@link APPLICATION_FORMAT_ARIB_HTML5} */
    applicationFormat: number;
    documentResolution: number;
    /** always true */
    defaultAITFlag: boolean;
    aitLocationInfo: MMTGeneralLocationInfo;
    dtMessageLocationInfo?: MMTGeneralLocationInfo;
    emtList: ApplicationServiceEMT[];
    privateData: Uint8Array;
};

export type ApplicationServiceEMT = {
    emtTag: number;
    emtLocationInfo: MMTGeneralLocationInfo;
};

function readApplicationServiceDescriptor(
    buffer: Uint8Array
): ApplicationServiceDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 1)) {
        return undefined;
    }
    const applicationFormat = reader.readUint8() >> 4;
    const documentResolution = reader.readUint8() >> 4;
    const h = reader.readUint8();
    const defaultAITFlag = !!(h & 0x80);
    const dtMessageFlag = !!(h & 0x40);
    const emtNum = h & 0xf;
    const aitLocationInfo = readMMTGeneralLocationInfo(reader);
    if (aitLocationInfo == null) {
        return undefined;
    }
    const dtMessageLocationInfo = dtMessageFlag ? readMMTGeneralLocationInfo(reader) : undefined;
    if (dtMessageFlag && dtMessageLocationInfo == null) {
        return undefined;
    }
    const emtList: ApplicationServiceEMT[] = [];
    for (let j = 0; j < emtNum; j++) {
        if (!reader.canRead(1)) {
            break;
        }
        const emtTag = reader.readUint8();
        const emtLocationInfo = readMMTGeneralLocationInfo(reader);
        if (emtLocationInfo == null) {
            return undefined;
        }
        emtList.push({
            emtTag,
            emtLocationInfo,
        });
    }
    return {
        tag: "applicationService",
        applicationFormat,
        documentResolution,
        defaultAITFlag,
        aitLocationInfo,
        dtMessageLocationInfo,
        emtList,
        privateData: buffer.slice(reader.tell()),
    };
}

export type AssetGroupDescriptor = {
    tag: "assetGroup";
    groupIdentification: number;
    /** 0: lower layer, 1: higher layer */
    selectionLevel: number;
};

function readAssetGroupDescriptor(buffer: Uint8Array): AssetGroupDescriptor | undefined {
    if (buffer.length < 2) {
        return undefined;
    }
    return {
        tag: "assetGroup",
        groupIdentification: buffer[0],
        selectionLevel: buffer[1],
    };
}

export type MPUTimestampDescriptor = {
    tag: "mpuTimestamp";
    timestamps: MPUTimestamp[];
};

export type MPUTimestamp = {
    mpuSequenceNumber: number;
    mpuPresentationTime: NTP64Timestamp;
};

function readMPUTimestampDescriptor(buffer: Uint8Array): MPUTimestampDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const timestamps: MPUTimestamp[] = [];
    while (reader.canRead(4 + 8)) {
        const mpuSequenceNumber = reader.readUint32();
        const mpuPresentationTime = reader.readNTP64Timestamp();
        timestamps.push({
            mpuSequenceNumber,
            mpuPresentationTime,
        });
    }
    return {
        tag: "mpuTimestamp",
        timestamps,
    };
}

export type MHHierarchyDescriptor = {
    tag: "mhHierarchy";
    /** always 0 */
    temporalScalabilityFlag: boolean;
    /** always 1 */
    spatialScalabilityFlag: boolean;
    /** always 1 */
    qualityScalabilityFlag: boolean;
    /** 3 or 15 */
    hierarchyType: number;
    hierarchyLayerIndex: number;
    /** always 1 */
    trefPresentFlag: boolean;
    /** always 15 (undefined) */
    hierarchyEmbeddedLayerIndex: number;
    /** always 0 */
    hierarchyChannel: number;
};

function readMHHierarchyDescriptor(buffer: Uint8Array): MHHierarchyDescriptor | undefined {
    if (buffer.length < 4) {
        return undefined;
    }
    return {
        tag: "mhHierarchy",
        temporalScalabilityFlag: !!(buffer[0] & 0x40),
        spatialScalabilityFlag: !!(buffer[0] & 0x20),
        qualityScalabilityFlag: !!(buffer[0] & 0x10),
        hierarchyType: buffer[0] & 0x0f,
        hierarchyLayerIndex: buffer[1] & 0x3f,
        trefPresentFlag: !!(buffer[2] & 0x80),
        hierarchyEmbeddedLayerIndex: buffer[2] & 0x3f,
        hierarchyChannel: buffer[3] & 0x3f,
    };
}

export const VIDEO_RESOLUTION_1080 = 5;
export const VIDEO_RESOLUTION_2160 = 6;
export const VIDEO_RESOLUTION_4320 = 7;

export const ASPECT_RATIO_16_9 = 3;

export const FRAME_RATE_29_97 = 5;
export const FRAME_RATE_59_94 = 8;
export const FRAME_RATE_119_88 = 11;

export const TRANSFER_CHARACTERISTICS_BT709 = 1;
export const TRANSFER_CHARACTERISTICS_IEC_61966_2_4 = 2;
export const TRANSFER_CHARACTERISTICS_BT2020 = 3;
export const TRANSFER_CHARACTERISTICS_BT2100_HLG = 5;

export type VideoComponentDescriptor = {
    tag: "videoComponent";
    /**
     * @see {@link VIDEO_RESOLUTION_1080}
     * @see {@link VIDEO_RESOLUTION_2160}
     * @see {@link VIDEO_RESOLUTION_4320}
     */
    videoResolution: number;
    /** @see {@link ASPECT_RATIO_16_9} */
    videoAspectRatio: number;
    /** false: interlaced, true: progressive */
    videoScanFlag: boolean;
    /**
     * @see {@link FRAME_RATE_29_97}
     * @see {@link FRAME_RATE_59_94}
     * @see {@link FRAME_RATE_119_88}
     */
    videoFrameRate: number;
    componentTag: number;
    /**
     * @see {@link TRANSFER_CHARACTERISTICS_BT709}
     * @see {@link TRANSFER_CHARACTERISTICS_IEC_61966_2_4}
     * @see {@link TRANSFER_CHARACTERISTICS_BT2020}
     * @see {@link TRANSFER_CHARACTERISTICS_BT2100_HLG}
     */
    videoTransferCharacteristics: number;
    iso639LanguageCode: number;
    /** unused */
    text: Uint8Array;
};

function readVideoComponentDescriptor(buffer: Uint8Array): VideoComponentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 2 + 1 + 3)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const videoResolution = b0 >> 4;
    const videoAspectRatio = b0 & 0x0f;
    const b1 = reader.readUint8();
    const videoScanFlag = !!(b1 & 0x80);
    const videoFrameRate = b1 & 0x1f;
    const componentTag = reader.readUint16();
    const videoTransferCharacteristics = reader.readUint8() >> 4;
    const iso639LanguageCode = reader.readUint24();
    const text = buffer.slice(reader.tell());
    return {
        tag: "videoComponent",
        videoResolution,
        videoAspectRatio,
        videoScanFlag,
        videoFrameRate,
        componentTag,
        videoTransferCharacteristics,
        iso639LanguageCode,
        text,
    };
}

export type MHStreamIdentifierDescriptor = {
    tag: "streamIdentifier";
    componentTag: number;
};

function readMHStreamIdentifierDescriptor(
    buffer: Uint8Array
): MHStreamIdentifierDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    return {
        tag: "streamIdentifier",
        componentTag: reader.readUint16(),
    };
}

export const MH_AUDIO_COMPONENT_STREAM_CONTENT_MPEG4_AAC = 0x03;
export const MH_AUDIO_COMPONENT_STREAM_CONTENT_MPEG4_ALS = 0x04;

export const MH_AUDIO_COMPONENT_TYPE_MASK_DIALOGUE_CONTROL = 0b1_00_00000;
export const MH_AUDIO_COMPONENT_TYPE_DIALOG_CONTROL_NONE = 0b0_00_00000;

export const MH_AUDIO_COMPONENT_TYPE_MASK_HANDICAPPED = 0b11_00000;
export const MH_AUDIO_COMPONENT_TYPE_NOT_SPECIFIED = 0b00_00000;
export const MH_AUDIO_COMPONENT_TYPE_COMMENTARY_FOR_VISUALLY_IMPAIRED = 0b01_00000;
export const MH_AUDIO_COMPONENT_TYPE_FOR_HEARING_IMPAIRED = 0b10_00000;

export const MH_AUDIO_COMPONENT_TYPE_MASK_SOUND_MODE = 0b11111;
export const MH_AUDIO_COMPONENT_TYPE_STEREO = 0b00011;
export const MH_AUDIO_COMPONENT_TYPE_5POINT1 = 0b01001;
export const MH_AUDIO_COMPONENT_TYPE_7POINT1 = 0b01110;
export const MH_AUDIO_COMPONENT_TYPE_22POINT2 = 0b10001;

export type MHAudioComponentDescriptor = {
    tag: "mhAudioComponent";
    /**
     * @see {@link MH_AUDIO_COMPONENT_STREAM_CONTENT_MPEG4_AAC}
     * @see {@link MH_AUDIO_COMPONENT_STREAM_CONTENT_MPEG4_ALS}
     */
    streamContent: number;
    /**
     * @see {@link MH_AUDIO_COMPONENT_TYPE_MASK_DIALOGUE_CONTROL}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_DIALOG_CONTROL_NONE}
     *
     * @see {@link MH_AUDIO_COMPONENT_TYPE_MASK_HANDICAPPED}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_NOT_SPECIFIED}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_COMMENTARY_FOR_VISUALLY_IMPAIRED}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_FOR_HEARING_IMPAIRED}
     *
     * @see {@link MH_AUDIO_COMPONENT_TYPE_MASK_SOUND_MODE}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_STEREO}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_5POINT1}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_7POINT1}
     * @see {@link MH_AUDIO_COMPONENT_TYPE_22POINT2}
     */
    componentType: number;
    componentTag: number;
    /** @see {@link STREAM_TYPE_LATM_LOAS} */
    streamType: number;
    simulcastGroupTag: number;
    mainComponentFlag: boolean;
    /**
     * @see {@link QUALITY_INDICATOR_MODE1}
     * @see {@link QUALITY_INDICATOR_MODE2}
     * @see {@link QUALITY_INDICATOR_MODE3}
     */
    qualityIndicator: number;
    /** @see {@link SAMPLING_RATE_48000} */
    samplingRate: number;
    iso639LanguageCode: number;
    /** always undefined (dual mono) */
    esMultiLingualISO639LanguageCode?: number;
    text: Uint8Array;
};

function readMHAudioComponentDescriptor(
    buffer: Uint8Array
): MHAudioComponentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 2 + 1 + 1 + 1 + 3)) {
        return undefined;
    }
    const streamContent = reader.readUint8() & 0x0f;
    const componentType = reader.readUint8();
    const componentTag = reader.readUint16();
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
        tag: "mhAudioComponent",
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

export type TargetRegion = BSPrefectureSpec;
export type BSPrefectureSpec = {
    regionSpecType: "BSDigital";
    prefectureBitmap: Uint8Array;
};

function readTargetRegion(reader: BinaryReader): TargetRegion | undefined {
    if (!reader.canRead(1)) {
        return undefined;
    }
    const regionSpecType = reader.readUint8();
    if (regionSpecType !== 0x01) {
        return undefined;
    }
    if (!reader.canRead(7)) {
        return undefined;
    }
    return {
        regionSpecType: "BSDigital",
        prefectureBitmap: reader.slice(7),
    };
}

export type MHTargetRegionDescriptor = {
    tag: "targetRegion";
    targetRegion: TargetRegion;
};

function readMHTargetRegionDescriptor(buffer: Uint8Array): MHTargetRegionDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const targetRegion = readTargetRegion(reader);
    if (targetRegion == null) {
        return undefined;
    }
    return {
        tag: "targetRegion",
        targetRegion,
    };
}

export const DATA_COMPONENT_ID_SUBTITLE_2G = 0x0020;
export const DATA_COMPONENT_ID_MULTIMEDIA_2G = 0x0021;

export type MHDataComponentDescriptor = {
    tag: "dataComponent";
    dataComponentId: number;
    // Additional_Arib_Subtitle_Info
    additionalDataComponentInfo: Uint8Array;
    additionalAribSubtitleInfo?: AdditionalAribSubtitleInfo;
};

function readMHDataComponentDescriptor(buffer: Uint8Array): MHDataComponentDescriptor | undefined {
    if (buffer.length < 2) {
        return undefined;
    }
    const dataComponentId = (buffer[0] << 8) | buffer[1];
    const additionalDataComponentInfo = buffer.slice(2);
    const additionalAribSubtitleInfo =
        dataComponentId === DATA_COMPONENT_ID_SUBTITLE_2G
            ? readAdditionalAribSubtitleInfo(additionalDataComponentInfo)
            : undefined;
    return {
        tag: "dataComponent",
        dataComponentId,
        additionalDataComponentInfo,
        additionalAribSubtitleInfo,
    };
}

export type ReferenceStartTime = {
    startTime: NTP64Timestamp;
    leapIndicator: number;
};

export type AdditionalAribSubtitleInfo = {
    subtitleTag: number;
    /** always 0 */
    subtitleInfoVersion: number;
    /** jpn or eng */
    iso639LanguageCode: number;
    /** always 00  */
    type: number;
    /** always 0000 */
    subtitleFormat: number;
    /** always 01 */
    opm: number;
    /** always 0010 or 1111 */
    tmd: number;
    /** always 0010 or 1010 */
    dmf: number;
    /** always 0000 or 0001 */
    resolution: number;
    compressionType: number;
    /** unused */
    startMPUSequenceNumber?: number;
    referenceStartTime?: ReferenceStartTime;
};

function readAdditionalAribSubtitleInfo(
    buffer: Uint8Array
): AdditionalAribSubtitleInfo | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 1 + 3 + 1 + 1 + 1)) {
        return undefined;
    }
    const subtitleTag = reader.readUint8();
    const b1 = reader.readUint8();
    const subtitleInfoVersion = b1 >> 4;
    const startMPUSequenceNumberFlag = !!(b1 & 8);
    const iso639LanguageCode = reader.readUint24();
    const b5 = reader.readUint8();
    const type = b5 >> 6;
    const subtitleFormat = (b5 >> 2) & 0xf;
    const opm = b5 & 3;
    const b6 = reader.readUint8();
    const tmd = b6 >> 4;
    const dmf = b6 & 0xf;
    const b7 = reader.readUint8();
    const resolution = b7 >> 4;
    const compressionType = b7 & 0xf;
    if (startMPUSequenceNumberFlag && !reader.canRead(4)) {
        return undefined;
    }
    const startMPUSequenceNumber = startMPUSequenceNumberFlag ? reader.readUint32() : undefined;
    let referenceStartTime: ReferenceStartTime | undefined;
    if (tmd === 0b0010) {
        if (!reader.canRead(8 + 1)) {
            return undefined;
        }
        const startTime = reader.readNTP64Timestamp();
        const leapIndicator = reader.readUint8() >> 6;
        referenceStartTime = {
            startTime,
            leapIndicator,
        };
    }
    return {
        subtitleTag,
        subtitleInfoVersion,
        iso639LanguageCode,
        type,
        subtitleFormat,
        opm,
        tmd,
        dmf,
        resolution,
        compressionType,
        startMPUSequenceNumber,
        referenceStartTime,
    };
}

export type MPUExtendedTimestampDescriptor = {
    tag: "mpuExtendedTimestamp";
    ptsOffsetType: number;
    timescale?: number;
    defaultPTSOffset?: number;
    timestamps: MPUExtendedTimestamp[];
};

export type MPUExtendedTimestamp = {
    mpuSequenceNumber: number;
    mpuPresentationTimeLeapIndicator: number;
    mpuDecodingTimeOffset: number;
    accessUnits: MPUExtendedTimestampAccessUnit[];
};

export type MPUExtendedTimestampAccessUnit = {
    dtsPTSOffset: number;
    /** unused */
    ptsOffset?: number;
};

function readMPUExtendedTimestampDescriptor(
    buffer: Uint8Array
): MPUExtendedTimestampDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const ptsOffsetType = (b0 >> 1) & 3;
    const timescaleFlag = !!(b0 & 1);
    if (timescaleFlag && !reader.canRead(4)) {
        return undefined;
    }
    const timescale = timescaleFlag ? reader.readUint32() : undefined;
    if (ptsOffsetType === 0b01 && !reader.canRead(2)) {
        return undefined;
    }
    const defaultPTSOffset = ptsOffsetType === 0b01 ? reader.readUint16() : undefined;
    const timestamps: MPUExtendedTimestamp[] = [];
    while (reader.canRead(4 + 1 + 2 + 1)) {
        const mpuSequenceNumber = reader.readUint32();
        const mpuPresentationTimeLeapIndicator = reader.readUint8() >> 6;
        const mpuDecodingTimeOffset = reader.readUint16();
        const numOfAU = reader.readUint8();
        const accessUnits: MPUExtendedTimestampAccessUnit[] = [];
        if (ptsOffsetType === 0b10 && reader.canRead(numOfAU * 4)) {
            for (let j = 0; j < numOfAU; j++) {
                const dtsPTSOffset = reader.readUint16();
                const ptsOffset = reader.readUint16();
                accessUnits.push({
                    dtsPTSOffset,
                    ptsOffset,
                });
            }
        } else if (reader.canRead(numOfAU * 2)) {
            for (let j = 0; j < numOfAU; j++) {
                const dtsPTSOffset = reader.readUint16();
                accessUnits.push({
                    dtsPTSOffset,
                });
            }
        } else {
            break;
        }
        timestamps.push({
            mpuSequenceNumber,
            mpuPresentationTimeLeapIndicator,
            mpuDecodingTimeOffset,
            accessUnits,
        });
    }
    return {
        tag: "mpuExtendedTimestamp",
        ptsOffsetType,
        timescale,
        defaultPTSOffset,
        timestamps,
    };
}

export const EVENT_GROUP_TYPE_SHARING = 0x1;
export const EVENT_GROUP_TYPE_RELAY = 0x2;
export const EVENT_GROUP_TYPE_MOVEMENT = 0x3;
// unused
export const EVENT_GROUP_TYPE_RELAY_TO_OTHER_NETWORK = 0x4;
export const EVENT_GROUP_TYPE_MOVEMENT_FROM_OTHER_NETWORK = 0x5;

export type MHEventGroupDescriptor =
    | {
          tag: "mhEventGroup";
          /** always EVENT_GROUP_TYPE_SHARING, EVENT_GROUP_TYPE_RELAY, EVENT_GROUP_TYPE_MOVEMENT */
          groupType: number;
          events: MHEventGroupEvent[];
          privateData: Uint8Array;
      }
    | {
          tag: "mhEventGroup";
          groupType: 4 | 5;
          events: MHEventGroupEvent[];
          otherNetworkEvents: MHEventGroupOtherNetworkEvent[];
      };

export type MHEventGroupEvent = {
    serviceId: number;
    eventId: number;
};

export type MHEventGroupOtherNetworkEvent = {
    originalNetworkId: number;
    tlvStreamId: number;
    serviceId: number;
    eventId: number;
};

function readMHEventGroupDescriptor(buffer: Uint8Array): MHEventGroupDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const groupType = b0 >> 4;
    const eventCount = b0 & 0xf;
    const events: MHEventGroupEvent[] = [];
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
        const otherNetworkEvents: MHEventGroupOtherNetworkEvent[] = [];
        while (reader.canRead(8)) {
            const originalNetworkId = reader.readUint16();
            const tlvStreamId = reader.readUint16();
            const serviceId = reader.readUint16();
            const eventId = reader.readUint16();
            otherNetworkEvents.push({
                originalNetworkId,
                tlvStreamId,
                serviceId,
                eventId,
            });
        }
        return {
            tag: "mhEventGroup",
            groupType,
            events,
            otherNetworkEvents,
        };
    } else {
        return {
            tag: "mhEventGroup",
            groupType,
            events,
            privateData: reader.slice(),
        };
    }
}

export type MHShortEventDescriptor = {
    tag: "mhShortEvent";
    iso639LanguageCode: number;
    eventName: Uint8Array;
    text: Uint8Array;
};

function readMHShortEventDescriptor(buffer: Uint8Array): MHShortEventDescriptor | undefined {
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
    if (!reader.canRead(2)) {
        return undefined;
    }
    const textLength = reader.readUint16();
    if (!reader.canRead(textLength)) {
        return undefined;
    }
    const text = reader.slice(textLength);
    return {
        tag: "mhShortEvent",
        iso639LanguageCode,
        eventName,
        text,
    };
}

export type MHExtendedEventDescriptor = {
    tag: "mhExtendedEvent";
    descriptorNumber: number;
    lastDescriptorNumber: number;
    iso639LanguageCode: number;
    items: MHExtendedEventItem[];
    /** unused */
    text: Uint8Array;
};

export type MHExtendedEventItem = {
    itemDescription: Uint8Array;
    item: Uint8Array;
};

function readMHExtendedEventDescriptor(buffer: Uint8Array): MHExtendedEventDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 3 + 2)) {
        return undefined;
    }
    const b0 = reader.readUint8();
    const descriptorNumber = b0 >> 4;
    const lastDescriptorNumber = b0 & 0xf;
    const iso639LanguageCode = reader.readUint24();
    const lengthOfItems = reader.readUint16();
    if (!reader.canRead(lengthOfItems)) {
        return undefined;
    }
    const items: MHExtendedEventItem[] = [];
    const ireader = new BinaryReader(reader.subarray(lengthOfItems));
    while (ireader.canRead(1)) {
        const itemDescriptionLength = ireader.readUint8();
        if (!ireader.canRead(itemDescriptionLength)) {
            break;
        }
        const itemDescription = ireader.slice(itemDescriptionLength);
        if (!ireader.canRead(2)) {
            break;
        }
        const itemLength = ireader.readUint16();
        if (!ireader.canRead(itemLength)) {
            break;
        }
        const item = ireader.slice(itemLength);
        items.push({
            itemDescription,
            item,
        });
    }
    if (!reader.canRead(2)) {
        return undefined;
    }
    const textLength = reader.readUint16();
    if (!reader.canRead(textLength)) {
        return undefined;
    }
    const text = reader.slice(textLength);
    return {
        tag: "mhExtendedEvent",
        descriptorNumber,
        lastDescriptorNumber,
        iso639LanguageCode,
        items,
        text,
    };
}

export type MHContentDescriptor = {
    tag: "mhContent";
    items: MHContentDescriptorItem[];
};

export type MHContentDescriptorItem = {
    contentNibbleLevel1: number;
    contentNibbleLevel2: number;
    userNibble: number;
};

function readMHContentDescriptor(buffer: Uint8Array): MHContentDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const items: MHContentDescriptorItem[] = [];
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
        tag: "mhContent",
        items,
    };
}

export type MHSeriesDescriptor = {
    tag: "mhSeries";
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

function readMHSeriesDescriptor(buffer: Uint8Array): MHSeriesDescriptor | undefined {
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
        tag: "mhSeries",
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

export type MultimediaServiceInfoDescriptor = {
    tag: "multimediaServiceInfo";
    dataComponentId: number;
    subtitleServiceInfo?: MultimediaSubtitleServiceInfo;
    dataServiceInfo?: MultimediaDataServiceInfo;
    /** unused */
    selector: Uint8Array;
};

export type MultimediaSubtitleServiceInfo = {
    componentTag: number;
    iso639LanguageCode: number;
    text: Uint8Array;
};

export type MultimediaDataServiceInfo = {
    associatedContentsFlag: boolean;
};

function readMultimediaServiceInfoDescriptor(
    buffer: Uint8Array
): MultimediaServiceInfoDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const dataComponentId = reader.readUint16();
    let subtitleServiceInfo: MultimediaSubtitleServiceInfo | undefined;
    let dataServiceInfo: MultimediaDataServiceInfo | undefined;
    if (dataComponentId === 0x0020) {
        if (!reader.canRead(2 + 3 + 1)) {
            return undefined;
        }
        const componentTag = reader.readUint16();
        const iso639LanguageCode = reader.readUint24();
        const textLength = reader.readUint8();
        if (!reader.canRead(textLength)) {
            return undefined;
        }
        const text = reader.slice(textLength);
        subtitleServiceInfo = {
            componentTag,
            iso639LanguageCode,
            text,
        };
    }
    if (dataComponentId === 0x0021) {
        if (!reader.canRead(1)) {
            return undefined;
        }
        const associatedContentsFlag = !!(reader.readUint8() >> 7);
        dataServiceInfo = {
            associatedContentsFlag,
        };
    }
    if (!reader.canRead(1)) {
        return undefined;
    }
    const selectorLength = reader.readUint8();
    if (!reader.canRead(selectorLength)) {
        return undefined;
    }
    const selector = reader.slice(selectorLength);
    return {
        tag: "multimediaServiceInfo",
        dataComponentId,
        subtitleServiceInfo,
        dataServiceInfo,
        selector,
    };
}

export type MHServiceDescriptor = {
    tag: "mhServiceDescriptor";
    serviceType: number;
    serviceProviderName: Uint8Array;
    serviceName: Uint8Array;
};

function readMHServiceDescriptor(buffer: Uint8Array): MHServiceDescriptor | undefined {
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
        tag: "mhServiceDescriptor",
        serviceType,
        serviceProviderName,
        serviceName,
    };
}

export type MHCAContractInfoDescriptor = {
    tag: "mhCAContractInfoDescriptor";
    caSystemId: number;
    caUnitId: number;
    components: number[];
    contractVerificationInfo: Uint8Array;
    /** unused */
    feeName: Uint8Array;
};

function readMHCAContractInfoDescriptor(
    buffer: Uint8Array
): MHCAContractInfoDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1)) {
        return undefined;
    }
    const caSystemId = reader.readUint16();
    const b = reader.readUint8();
    const caUnitId = b >> 4;
    const numOfComponent = b & 0xf;
    if (!reader.canRead(numOfComponent * 2)) {
        return undefined;
    }
    const components: number[] = [];
    for (let i = 0; i < numOfComponent; i++) {
        components.push(reader.readUint16());
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
        tag: "mhCAContractInfoDescriptor",
        caSystemId,
        caUnitId,
        components,
        contractVerificationInfo,
        feeName,
    };
}

export const MH_LOGO_TRANSMISSION_TYPE_DIRECT = 1;
export const MH_LOGO_TRANSMISSION_TYPE_INDIRECT = 2;

export type MHLogoTransmissionDescriptor =
    | MHLogoTransmissionDescriptorDirect
    | MHLogoTransmissionDescriptorIndirect;

export type MHLogoTransmissionDescriptorDirect = {
    tag: "mhLogoTransmission";
    logoTransmissionType: 1;
    logoId: number;
    logoVersion: number;
    downloadDataId: number;
    logoList: MHLogoTransmissionDescriptorLogo[];
};

export type MHLogoTransmissionDescriptorLogo = {
    logoType: number;
    startSectionNumber: number;
    numOfSections: number;
};

export type MHLogoTransmissionDescriptorIndirect = {
    tag: "mhLogoTransmission";
    logoTransmissionType: 2;
    logoId: number;
};

function readMHLogoTransmissionDescriptor(
    buffer: Uint8Array
): MHLogoTransmissionDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const logoTransmissionType = reader.readUint8();
    if (logoTransmissionType === MH_LOGO_TRANSMISSION_TYPE_DIRECT) {
        if (!reader.canRead(2 + 2 + 2)) {
            return undefined;
        }
        const logoId = reader.readUint16() & 0x1ff;
        const logoVersion = reader.readUint16() & 0xfff;
        const downloadDataId = reader.readUint16();
        const logoList: MHLogoTransmissionDescriptorLogo[] = [];
        while (reader.canRead(1 + 1 + 1)) {
            const logoType = reader.readUint8();
            const startSectionNumber = reader.readUint8();
            const numOfSections = reader.readUint8();
            logoList.push({
                logoType,
                startSectionNumber,
                numOfSections,
            });
        }
        return {
            tag: "mhLogoTransmission",
            logoTransmissionType,
            logoId,
            logoVersion,
            downloadDataId,
            logoList,
        };
    } else if (logoTransmissionType === MH_LOGO_TRANSMISSION_TYPE_INDIRECT) {
        if (!reader.canRead(2)) {
            return undefined;
        }
        const logoId = reader.readUint16() & 0x1ff;
        return {
            tag: "mhLogoTransmission",
            logoTransmissionType,
            logoId,
        };
    } else {
        return undefined;
    }
}

export type MHSIParameterDescriptor = {
    tag: "mhSIParameterDescriptor";
    parameterVersion: number;
    updateTime: number;
    tableParameters: MHSITableParameter[];
};

export type MHSITableParameter = {
    tableId: number;
    tableDescription: Uint8Array;
};

function readMHSIParameterDescriptor(buffer: Uint8Array): MHSIParameterDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1 + 2)) {
        return undefined;
    }
    const parameterVersion = reader.readUint8();
    const updateTime = reader.readUint16();
    const tableParameters: MHSITableParameter[] = [];
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
        tag: "mhSIParameterDescriptor",
        parameterVersion,
        updateTime,
        tableParameters,
    };
}

export type MHBroadcasterNameDescriptor = {
    tag: "mhBroadcasterName";
    name: Uint8Array;
};

function readMHBroadcasterNameDescriptor(
    buffer: Uint8Array
): MHBroadcasterNameDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    return {
        tag: "mhBroadcasterName",
        name: reader.slice(),
    };
}

export type MHServiceListDescriptor = {
    tag: "mhServiceList";
    services: MHServiceListDescriptorService[];
};

export type MHServiceListDescriptorService = {
    serviceId: number;
    serviceType: number;
};

function readMHServiceListDescriptor(buffer: Uint8Array): MHServiceListDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const services: MHServiceListDescriptorService[] = [];
    while (reader.canRead(2 + 1)) {
        const serviceId = reader.readUint16();
        const serviceType = reader.readUint8();
        services.push({
            serviceId,
            serviceType,
        });
    }
    return {
        tag: "mhServiceList",
        services,
    };
}

export type SIRelatedBroadcasterDescriptor = {
    tag: "siRelatedBroadcaster";
    broadcasterIdList: SIRelatedBroadcasterDescriptorBroadcaster[];
    affiliationIdList: number[];
    originalNetworkIdList: number[];
};

export type SIRelatedBroadcasterDescriptorBroadcaster = {
    networkId: number;
    broadcasterId: number;
};

function readSIRelatedBroadcasterDescriptor(
    buffer: Uint8Array
): SIRelatedBroadcasterDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const a = reader.readUint8();
    const b = reader.readUint8();
    const numOfBroadcasterId = a >> 4;
    const numOfAffiliationId = a & 0xf;
    const numOfOriginalNetworkId = b >> 4;
    if (
        !reader.canRead(
            (2 + 1) * numOfBroadcasterId + 1 * numOfAffiliationId + 2 * numOfOriginalNetworkId
        )
    ) {
        return undefined;
    }
    const broadcasterIdList: SIRelatedBroadcasterDescriptorBroadcaster[] = [];
    for (let i = 0; i < numOfBroadcasterId; i++) {
        const networkId = reader.readUint16();
        const broadcasterId = reader.readUint8();
        broadcasterIdList.push({
            networkId,
            broadcasterId,
        });
    }
    const affiliationIdList: number[] = [];
    for (let i = 0; i < numOfAffiliationId; i++) {
        const numOfAffiliationId = reader.readUint8();
        affiliationIdList.push(numOfAffiliationId);
    }
    const originalNetworkIdList: number[] = [];
    for (let i = 0; i < numOfOriginalNetworkId; i++) {
        const originalNetworkId = reader.readUint16();
        originalNetworkIdList.push(originalNetworkId);
    }
    return {
        tag: "siRelatedBroadcaster",
        broadcasterIdList,
        affiliationIdList,
        originalNetworkIdList,
    };
}

export type MHLocalTimeOffsetDescriptor = {
    tag: "mhLocalTimeOffset";
    offsets: MHLocalTimeOffset[];
};

export type MHLocalTimeOffset = {
    countryCode: number;
    countryRegionId: number;
    localTimeOffsetPolarity: boolean;
    localTimeOffset: number;
    timeOfChange: number;
    nextTimeOffset: number;
};

function readMHLocalTimeOffsetDescriptor(
    buffer: Uint8Array
): MHLocalTimeOffsetDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const offsets: MHLocalTimeOffset[] = [];
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
        tag: "mhLocalTimeOffset",
        offsets,
    };
}

export type ScramblerDescriptor = {
    tag: "scrambler";
    layerType: number;
    scrambleSystemId: number;
    privateData: Uint8Array;
};

function readScramblerDescriptor(buffer: Uint8Array): ScramblerDescriptor | undefined {
    if (buffer.length < 2) {
        return undefined;
    }
    const layerType = buffer[0] >> 6;
    const scrambleSystemId = buffer[1];
    const privateData = buffer.slice(2);
    return {
        tag: "scrambler",
        layerType,
        scrambleSystemId,
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

export type MHApplicationDescriptor = {
    tag: "mhApplication";
    applicationProfiles: MHApplicationProfile[];
    /** true */
    serviceBoundFlag: boolean;
    /** 0b11 */
    visibility: number;
    presentApplicationPriority: boolean;
    /** 0x0ff (unspecified) */
    applicationPriority: number;
    transportProtocolLabel: Uint8Array;
};

export type MHApplicationProfile = {
    /** 0x0010 */
    applicationProfile: number;
    /** 0x01 */
    versionMajor: number;
    /** 0x01 */
    versionMinor: number;
    /** 0x01 */
    versionMicro: number;
};

function readMHApplicationDescriptor(buffer: Uint8Array): MHApplicationDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const applicationProfilesLength = reader.readUint8();
    const applicationProfiles: MHApplicationProfile[] = [];
    if (!reader.canRead(applicationProfilesLength)) {
        return undefined;
    }
    for (let i = 0; i < applicationProfilesLength; i += 2 + 1 + 1 + 1) {
        const applicationProfile = reader.readUint16();
        const versionMajor = reader.readUint8();
        const versionMinor = reader.readUint8();
        const versionMicro = reader.readUint8();
        applicationProfiles.push({
            applicationProfile,
            versionMajor,
            versionMinor,
            versionMicro,
        });
    }
    if (!reader.canRead(1 + 1)) {
        return undefined;
    }
    const h = reader.readUint8();
    const serviceBoundFlag = !!(h >> 7);
    const visibility = (h >> 5) & 3;
    const presentApplicationPriority = !!(h & 1);
    const applicationPriority = reader.readUint8();
    const transportProtocolLabel = reader.slice();
    return {
        tag: "mhApplication",
        applicationProfiles,
        serviceBoundFlag,
        visibility,
        presentApplicationPriority,
        applicationPriority,
        transportProtocolLabel,
    };
}

export const MH_TRANSPORT_PROTOCOL_ID_HTTP_HTTPS = 0x0003;
export const MH_TRANSPORT_PROTOCOL_ID_MMT_NON_TIMED = 0x0005;

export type MHTransportProtocolDescriptor = {
    tag: "mhTransportProtocol";
    /**
     * @see {@link MH_TRANSPORT_PROTOCOL_ID_HTTP_HTTPS}
     * @see {@link MH_TRANSPORT_PROTOCOL_ID_MMT_NON_TIMED}
     */
    protocolId: number;
    transportProtocolLabel: number;
    selector: Uint8Array;
    urlSelectors?: URLSelector[];
};

export type URLSelector = {
    urlBase: Uint8Array;
    /** unused */
    urlExtensions: Uint8Array[];
};

function readURLSelectors(buffer: Uint8Array): URLSelector[] | undefined {
    const reader = new BinaryReader(buffer);
    const selectors: URLSelector[] = [];
    while (reader.canRead(1)) {
        const urlBaseLength = reader.readUint8();
        if (!reader.canRead(urlBaseLength)) {
            return undefined;
        }
        const urlBase = reader.subarray(urlBaseLength);
        if (!reader.canRead(1)) {
            return undefined;
        }
        const urlExtensionCount = reader.readUint8();
        const urlExtensions: Uint8Array[] = [];
        for (let j = 0; j < urlExtensionCount; j++) {
            if (!reader.canRead(1)) {
                return undefined;
            }
            const urlExtensionLength = reader.readUint8();
            if (!reader.canRead(urlExtensionLength)) {
                return undefined;
            }
            const urlExtension = reader.subarray(urlExtensionLength);
            urlExtensions.push(urlExtension);
        }
        selectors.push({
            urlBase,
            urlExtensions,
        });
    }
    return selectors;
}

function readMHTransportProtocolDescriptor(
    buffer: Uint8Array
): MHTransportProtocolDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1)) {
        return undefined;
    }
    const protocolId = reader.readUint16();
    const transportProtocolLabel = reader.readUint8();
    const selector = reader.slice();
    let urlSelectors: URLSelector[] | undefined;
    if (
        protocolId === MH_TRANSPORT_PROTOCOL_ID_HTTP_HTTPS ||
        protocolId === MH_TRANSPORT_PROTOCOL_ID_MMT_NON_TIMED
    ) {
        urlSelectors = readURLSelectors(selector);
    }
    return {
        tag: "mhTransportProtocol",
        protocolId,
        transportProtocolLabel,
        selector,
        urlSelectors,
    };
}

export type MHSimpleApplicationLocationDescriptor = {
    tag: "mhSimpleApplicationLocation";
    initialPath: Uint8Array;
};

function readMHSimpleApplicationLocationDescriptor(
    buffer: Uint8Array
): MHSimpleApplicationLocationDescriptor {
    return {
        tag: "mhSimpleApplicationLocation",
        initialPath: buffer.slice(),
    };
}

export type MHApplicationBoundaryAndPermissionDescriptor = {
    tag: "mhApplicationBoundaryAndPermission";
    applicationBoundaryAndPermissions: MHApplicationBoundaryAndPermission[];
};

export type MHApplicationBoundaryAndPermission = {
    permissionBitmaps: Uint16Array;
    managedURLs: Uint8Array[];
};

function readMHApplicationBoundaryAndPermissionDescriptor(
    buffer: Uint8Array
): MHApplicationBoundaryAndPermissionDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const applicationBoundaryAndPermissions: MHApplicationBoundaryAndPermission[] = [];
    while (reader.canRead(1)) {
        const permissionBitmapCount = reader.readUint8();
        if (!reader.canRead(permissionBitmapCount * 2)) {
            return undefined;
        }
        const b = reader.slice(permissionBitmapCount * 2);
        const permissionBitmaps = new Uint16Array(b.buffer, b.byteOffset, permissionBitmapCount);
        if (!reader.canRead(1)) {
            return undefined;
        }
        const managedURLCount = reader.readUint8();
        const managedURLs: Uint8Array[] = [];
        for (let j = 0; j < managedURLCount; j++) {
            if (!reader.canRead(1)) {
                return undefined;
            }
            const managedURLLength = reader.readUint8();
            if (!reader.canRead(managedURLLength)) {
                return undefined;
            }
            const managedURL = reader.slice(managedURLLength);
            managedURLs.push(managedURL);
        }
        applicationBoundaryAndPermissions.push({
            permissionBitmaps,
            managedURLs,
        });
    }
    return {
        tag: "mhApplicationBoundaryAndPermission",
        applicationBoundaryAndPermissions,
    };
}

export const UTC_NPT_REFERENCE_SCALE_SAME = 0b11;

export type UTCNPTReferenceDescriptor = {
    tag: "utcNPTReference";
    utcReference: NTP64Timestamp;
    nptReference: NTP64Timestamp;
    utcNPTLeapIndicator: number;
    /** @see {@link UTC_NPT_REFERENCE_SCALE_SAME} */
    scale: number;
};

function readUTCNPTReferenceDescriptor(buffer: Uint8Array): UTCNPTReferenceDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(8 + 8 + 1)) {
        return undefined;
    }
    const utcReference = reader.readNTP64Timestamp();
    const nptReference = reader.readNTP64Timestamp(false);
    const h = reader.readUint8();
    const utcNPTLeapIndicator = h >> 6;
    const scale = (h >> 4) & 3;
    return {
        tag: "utcNPTReference",
        utcReference,
        nptReference,
        utcNPTLeapIndicator,
        scale,
    };
}

export type EventMessageDescriptor = {
    tag: "eventMessage";
    /** 1 */
    eventMessageGroupId: number;
    /** `timeMode: "immediate"` or `timeMode: "NPT"` */
    time: EventMessageTime;
    /** 1 */
    eventMessageType: number;
    eventMessageId: number;
    privateData: Uint8Array;
};

export type EventMessageTime =
    | {
          timeMode: "immediate";
      }
    | {
          timeMode: "UTC" | "UTCStreamTime";
          eventMessageUTCTime: NTP64Timestamp;
      }
    | {
          timeMode: "NPT";
          eventMessageNPT: NTP64Timestamp;
      }
    | {
          timeMode: "relative";
          eventMessageRelativeTime: NTP64Timestamp;
      };

function readEventMessageDescriptor(buffer: Uint8Array): EventMessageDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2 + 1 + 8 + 1 + 2)) {
        return undefined;
    }
    const eventMessageGroupId = reader.readUint16() >> 4;
    const timeMode = reader.readUint8();
    let time: EventMessageTime;
    switch (timeMode) {
        case 0x00:
            reader.skip(8);
            time = { timeMode: "immediate" };
            break;
        case 0x01:
            time = { timeMode: "UTC", eventMessageUTCTime: reader.readNTP64Timestamp() };
            break;
        case 0x02:
            time = { timeMode: "NPT", eventMessageNPT: reader.readNTP64Timestamp(false) };
            break;
        case 0x03:
            time = {
                timeMode: "relative",
                eventMessageRelativeTime: reader.readNTP64Timestamp(false),
            };
            break;
        case 0x05:
            time = { timeMode: "UTCStreamTime", eventMessageUTCTime: reader.readNTP64Timestamp() };
            break;
        default:
            return undefined;
    }
    const eventMessageType = reader.readUint8();
    const eventMessageId = reader.readUint16();
    const privateData = reader.slice();
    return {
        tag: "eventMessage",
        eventMessageGroupId,
        time,
        eventMessageType,
        eventMessageId,
        privateData,
    };
}

export type MPUNodeDescriptor = {
    tag: "mpuNode";
    nodeTag: number;
};

function readMPUNodeDescriptor(buffer: Uint8Array): MPUNodeDescriptor | undefined {
    if (buffer.length < 2) {
        return undefined;
    }
    return {
        tag: "mpuNode",
        nodeTag: (buffer[0] << 8) | buffer[1],
    };
}
