import {
    NetworkNameDescriptor,
    SystemManagementDescriptor,
    ServiceListDescriptor,
    ServiceListEntry,
    SatelliteDeliverySystemDescriptor,
    readNetworkNameDescriptor,
    readSystemManagementDescriptor,
    readServiceListDescriptor,
    readSatelliteDeliverySystemDescriptor,
} from "./si-descriptor";
export {
    NetworkNameDescriptor,
    SystemManagementDescriptor,
    ServiceListDescriptor,
    ServiceListEntry,
    SatelliteDeliverySystemDescriptor,
};
import { TLV_HEADER_SIZE } from "./tlv";
import { BinaryReader } from "./utils";

export const TLV_SI_NIT_ACTUAL = 0x40;
export const TLV_SI_NETWORK_NAME_DESCRIPTOR = 0x40;
export const TLV_SI_SYSTEM_MANAGEMENT_DESCRIPTOR = 0xfe;
export const TLV_SI_REMOTE_CONTROL_KEY_DESCRIPTOR = 0xcd;
export const TLV_SI_SERVICE_LIST_DESCRIPTOR = 0x41;
export const TLV_SI_SATELLITE_DELIVERY_SYSTEM_DESCRIPTOR = 0x43;
export const TLV_SI_NIT_OTHER = 0x41;
export const TLV_SI_AMT = 0xfe;

export type TLVSIDescriptor =
    | NetworkNameDescriptor
    | SystemManagementDescriptor
    | RemoteControlKeyDescriptor
    | ServiceListDescriptor
    | SatelliteDeliverySystemDescriptor;

export type RemoteControlKeyDescriptor = {
    tag: "remoteControlKey";
    keys: RemoteControlKey[];
};

export type RemoteControlKey = {
    remoteControlKeyId: number;
    serviceId: number;
};

export type TLVNetworkInformationTable = {
    tableId: "TLV-NIT[actual]" | "TLV-NIT[other]";
    networkId: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    networkDescriptors: TLVSIDescriptor[];
    tlvStreams: TLVStream[];
};

export type TLVStream = {
    tlvStreamId: number;
    originalNetworkId: number;
    descriptors: TLVSIDescriptor[];
};

export type AddressMapTable = {
    tableId: "AMT";
    tableIdExtension: number;
    versionNumber: number;
    currentNextIndicator: boolean;
    sectionNumber: number;
    lastSectionNumber: number;
    services: Service[];
};

export type Service = {
    serviceId: number;
    ip: ServiceIPInformation;
    /** always empty */
    privateData: Uint8Array;
};

export type ServiceIPInformation = {
    /** always IPv6 */
    version: "IPv4" | "IPv6";
    sourceAddress: Uint8Array;
    /** always 128 */
    sourceAddressMask: number;
    destAddress: Uint8Array;
    /** always 128 */
    destAddressMask: number;
};

function readRemoteControlKeyDescriptor(
    buffer: Uint8Array
): RemoteControlKeyDescriptor | undefined {
    if (buffer.length < 1) {
        return undefined;
    }
    const numOfRemoteControlKeyId = buffer[0];
    const keys: RemoteControlKey[] = [];
    for (let i = 0; i < numOfRemoteControlKeyId; i++) {
        if (buffer.length < 1 + i * 5 + 2) {
            break;
        }
        const remoteControlKeyId = buffer[1 + i * 5];
        const serviceId = (buffer[1 + i * 5 + 1] << 8) | buffer[1 + i * 5 + 2];
        keys.push({
            remoteControlKeyId,
            serviceId,
        });
    }
    return {
        tag: "remoteControlKey",
        keys,
    };
}

export function readDescriptors(buffer: Uint8Array): TLVSIDescriptor[] {
    const reader = new BinaryReader(buffer);
    const descriptors: TLVSIDescriptor[] = [];
    while (reader.canRead(4)) {
        const tag = reader.readUint8();
        const length = reader.readUint8();
        if (!reader.canRead(length)) {
            break;
        }
        const data = reader.subarray(length);
        switch (tag) {
            case TLV_SI_NETWORK_NAME_DESCRIPTOR:
                descriptors.push(readNetworkNameDescriptor(data));
                break;
            case TLV_SI_SYSTEM_MANAGEMENT_DESCRIPTOR: {
                const d = readSystemManagementDescriptor(data);
                if (d != null) {
                    descriptors.push(d);
                }
                break;
            }
            case TLV_SI_REMOTE_CONTROL_KEY_DESCRIPTOR: {
                const d = readRemoteControlKeyDescriptor(data);
                if (d != null) {
                    descriptors.push(d);
                }
                break;
            }
            case TLV_SI_SERVICE_LIST_DESCRIPTOR: {
                const d = readServiceListDescriptor(data);
                if (d != null) {
                    descriptors.push(d);
                }
                break;
            }
            case TLV_SI_SATELLITE_DELIVERY_SYSTEM_DESCRIPTOR: {
                const d = readSatelliteDeliverySystemDescriptor(data);
                if (d != null) {
                    descriptors.push(d);
                }
                break;
            }
            default:
                break;
        }
    }
    return descriptors;
}

export function readNIT(
    reader: BinaryReader,
    tableId: "TLV-NIT[actual]" | "TLV-NIT[other]"
): TLVNetworkInformationTable | undefined {
    if (!reader.canRead(2 + 2 + 1 + 1 + 1)) {
        return undefined;
    }
    const h = reader.readUint16();
    const sectionSyntaxIndicator = !!(h & 0b10000000_00000000);
    if (!sectionSyntaxIndicator) {
        return undefined;
    }
    // const mustBe111 = h & 0b01110000_00000000;
    const sectionLength = h & 0b00001111_11111111;
    if (!reader.canRead(sectionLength)) {
        return undefined;
    }
    const networkId = reader.readUint16();
    const h2 = reader.readUint8();
    // const mustBe11 = h2 & 0b11000000;
    const versionNumber = h2 & 0b00111110;
    const currentNextIndicator = !!(h2 & 0b00000001);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    if (!reader.canRead(2)) {
        return undefined;
    }
    const networkDescriptorsLength = reader.readUint16() & ((1 << 12) - 1);
    if (!reader.canRead(networkDescriptorsLength)) {
        return undefined;
    }
    const networkDescriptors = readDescriptors(reader.subarray(networkDescriptorsLength));
    const tlvStreamLoopLength = reader.readUint16() & ((1 << 12) - 1);
    if (!reader.canRead(tlvStreamLoopLength)) {
        return undefined;
    }
    const tlvStreams: TLVStream[] = [];
    while (reader.canRead(2 + 2 + 2 + 4 /* CRC_32 */)) {
        const tlvStreamId = reader.readUint16();
        const originalNetworkId = reader.readUint16();
        const tlvStreamDescriptorsLength = reader.readUint16() & ((1 << 12) - 1);
        if (!reader.canRead(tlvStreamDescriptorsLength)) {
            return undefined;
        }
        const descriptors = readDescriptors(reader.subarray(tlvStreamDescriptorsLength));
        tlvStreams.push({
            tlvStreamId,
            originalNetworkId,
            descriptors,
        });
    }
    return {
        tableId,
        networkId,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        networkDescriptors,
        tlvStreams,
    };
}
export function readAMT(reader: BinaryReader): AddressMapTable | undefined {
    if (!reader.canRead(2 + 2 + 1 + 1 + 1)) {
        return undefined;
    }
    const h = reader.readUint16();
    const sectionSyntaxIndicator = !!(h & 0b10000000_00000000);
    if (!sectionSyntaxIndicator) {
        return undefined;
    }
    // const mustBe111 = h & 0b01110000_00000000;
    const sectionLength = h & 0b00001111_11111111;
    if (!reader.canRead(sectionLength)) {
        return undefined;
    }
    const tableIdExtension = reader.readUint16();
    const h2 = reader.readUint8();
    // const mustBe11 = h2 & 0b11000000;
    const versionNumber = h2 & 0b00111110;
    const currentNextIndicator = !!(h2 & 0b00000001);
    const sectionNumber = reader.readUint8();
    const lastSectionNumber = reader.readUint8();
    if (!reader.canRead(2)) {
        return undefined;
    }
    const numOfServiceId = (reader.readUint16() & 0b1111111111000000) >> 6;
    const services: Service[] = [];
    for (let i = 0; i < numOfServiceId; i++) {
        if (!reader.canRead(2 + 2)) {
            return undefined;
        }
        const serviceId = reader.readUint16();
        const h = reader.readUint16();
        const ipVersion = h & (1 << 15);
        const serviceLoopLength = h & ((1 << 10) - 1);
        let ip: ServiceIPInformation;
        let privateData;
        if (ipVersion === 0) {
            if (!reader.canRead(4 + 1 + 4 + 1)) {
                return undefined;
            }
            const sourceAddress = reader.slice(4);
            const sourceAddressMask = reader.readUint8();
            const destAddress = reader.slice(4);
            const destAddressMask = reader.readUint8();
            ip = {
                version: "IPv4",
                sourceAddress,
                sourceAddressMask,
                destAddress,
                destAddressMask,
            };
            if (!reader.canRead(serviceLoopLength - (4 + 1 + 4 + 1))) {
                return undefined;
            }
            privateData = reader.slice(serviceLoopLength - (4 + 1 + 4 + 1));
        } else {
            if (!reader.canRead(16 + 1 + 16 + 1)) {
                return undefined;
            }
            const sourceAddress = reader.slice(16);
            const sourceAddressMask = reader.readUint8();
            const destAddress = reader.slice(16);
            const destAddressMask = reader.readUint8();
            ip = {
                version: "IPv6",
                sourceAddress,
                sourceAddressMask,
                destAddress,
                destAddressMask,
            };
            if (!reader.canRead(serviceLoopLength - (16 + 1 + 16 + 1))) {
                return undefined;
            }
            privateData = reader.slice(serviceLoopLength - (16 + 1 + 16 + 1));
        }
        services.push({
            serviceId,
            ip,
            privateData,
        });
    }
    return {
        tableId: "AMT",
        tableIdExtension,
        versionNumber,
        currentNextIndicator,
        sectionNumber,
        lastSectionNumber,
        services,
    };
}

export function readTLVSI(tlvPacket: Uint8Array) {
    const reader = new BinaryReader(tlvPacket, TLV_HEADER_SIZE);
    if (!reader.canRead(1)) {
        return undefined;
    }
    const tableId = reader.readUint8();
    switch (tableId) {
        case TLV_SI_NIT_ACTUAL:
            return readNIT(reader, "TLV-NIT[actual]");
        case TLV_SI_NIT_OTHER:
            return readNIT(reader, "TLV-NIT[other]");
        case TLV_SI_AMT:
            return readAMT(reader);
        default:
            break;
    }
}
