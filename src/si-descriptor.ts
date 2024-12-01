import { BinaryReader } from "./utils";

export type NetworkNameDescriptor = {
    tag: "networkName";
    name: Uint8Array;
};

export function readNetworkNameDescriptor(buffer: Uint8Array): NetworkNameDescriptor {
    return {
        tag: "networkName",
        name: buffer.slice(),
    };
}

export type SystemManagementDescriptor = {
    tag: "systemManagement";
    broadcastingFlag: number;
    broadcastingIdentifier: number;
    additionalBroadcastingIdentification: number;
    /** always empty */
    additionalIdentificationInfo: Uint8Array;
};

export function readSystemManagementDescriptor(
    buffer: Uint8Array
): SystemManagementDescriptor | undefined {
    if (buffer.length < 2) {
        return undefined;
    }
    return {
        tag: "systemManagement",
        broadcastingFlag: buffer[0] >> 6,
        broadcastingIdentifier: buffer[0] & ((1 << 6) - 1),
        additionalBroadcastingIdentification: buffer[1],
        additionalIdentificationInfo: buffer.slice(2),
    };
}

export type ServiceListDescriptor = {
    tag: "serviceList";
    services: ServiceListEntry[];
};

export type ServiceListEntry = {
    serviceId: number;
    serviceType: number;
};

export function readServiceListDescriptor(buffer: Uint8Array): ServiceListDescriptor | undefined {
    const services: ServiceListEntry[] = [];
    for (let i = 0; i + 3 <= buffer.length; i += 3) {
        const serviceId = (buffer[i] << 8) | buffer[i + 1];
        const serviceType = buffer[i + 2];
        services.push({
            serviceId,
            serviceType,
        });
    }
    return {
        tag: "serviceList",
        services,
    };
}

export type EmergencyInformationDescriptor = {
    tag: "emergencyInformation";
    /** always services.length === 1 */
    services: EmergencyInformationService[];
};

export type EmergencyInformationService = {
    serviceId: number;
    startEndFlag: boolean;
    signalLevel: boolean;
    areaCodes: number[];
};

export function readEmergencyInformationDescriptor(
    buffer: Uint8Array
): EmergencyInformationDescriptor | undefined {
    const reader = new BinaryReader(buffer);
    const services: EmergencyInformationService[] = [];
    while (reader.canRead(2 + 1 + 1)) {
        const serviceId = reader.readUint16();
        const h = reader.readUint8();
        const startEndFlag = !!(h & 0x80);
        const signalLevel = !!(h & 0x40);
        const areaCodeLength = reader.readUint8();
        if (!reader.canRead(2 * areaCodeLength)) {
            break;
        }
        const areaCodes: number[] = [];
        for (let i = 0; i < areaCodeLength; i++) {
            areaCodes.push(reader.readUint16() >> 4);
        }
        services.push({
            serviceId,
            startEndFlag,
            signalLevel,
            areaCodes,
        });
    }
    return {
        tag: "emergencyInformation",
        services,
    };
}

export type SatelliteDeliverySystemDescriptor = {
    tag: "satelliteDeliverySystem";
    frequency: number;
    orbitalPosition: number;
    westEastFlag: boolean;
    polarization: number;
    modulation: number;
    symbolRate: number;
    fecInner: number;
};

export function readSatelliteDeliverySystemDescriptor(
    buffer: Uint8Array
): SatelliteDeliverySystemDescriptor | undefined {
    if (buffer.length < 4 + 2 + 1 + 4) {
        return undefined;
    }
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return {
        tag: "satelliteDeliverySystem",
        frequency: view.getUint32(0),
        orbitalPosition: view.getUint16(4),
        westEastFlag: !!(view.getUint8(6) & 0x80),
        polarization: (view.getUint8(6) & 0x60) >> 5,
        modulation: view.getUint8(6) & 0x1f,
        symbolRate: view.getUint32(7) >> 4,
        fecInner: view.getUint32(7) & 0xf,
    };
}
