import { MMTTLVReaderEventTarget } from "./event";
import { MMTHeader, MMTHeaderExtension } from "./mmt-header";
import { readMessages as readMessage } from "./mmt-si";
import { readMPU } from "./mpu";
import { TLVContext } from "./tlv";
import { BinaryReader, concatBuffers } from "./utils";

const MMTP_PAYLOAD_TYPE_MPU = 0x00;
const MMTP_PAYLOAD_TYPE_SI = 0x02;

export const MMTP_FRAGMENTATION_INDICATOR_COMPLETE = 0b00;
export const MMTP_FRAGMENTATION_INDICATOR_HEAD = 0b01;
export const MMTP_FRAGMENTATION_INDICATOR_MIDDLE = 0b10;
export const MMTP_FRAGMENTATION_INDICATOR_TAIL = 0b11;

export const MMT_PID_PLT = 0x0000;
export const MMT_PID_CAT = 0x0001;
export const MMT_PID_EIT = 0x8000;
export const MMT_PID_BIT = 0x8002;
export const MMT_PID_SDTT = 0x8003;
export const MMT_PID_SDT = 0x8004;
export const MMT_PID_TOT = 0x8005;
export const MMT_PID_CDT = 0x8006;
export const MMT_PID_INVALID = 0xffff;

const MMT_MULTI_TYPE_HEADER_EXTENSION_SCRAMBLE = 0x0001;
const MMT_SCRAMBLE_CONTROL_NONE = 0b00;

const MMT_MULTI_TYPE_HEADER_EXTENSION_DOWNLOAD_ID = 0x0002;
const MMT_MULTI_TYPE_HEADER_EXTENSION_ITEM_FRAGMENTATION = 0x0003;

type Package = {
    active: boolean;
    version: number;
};

type TableId =
    | "PLT"
    | "CAT"
    | "EIT"
    | "BIT"
    | "SDTT"
    | "SDT"
    | "TOT"
    | "CDT"
    | "MPT"
    | "EMM"
    | "ECM"
    | "AIT"
    | "EMT"
    | "DDMT/DAMT";

type Asset = {
    packetSequenceNumber?: number;
    fragmentIndicator?: number;
    referencedPackages: Set<number>;
    packetCount: number;
    dropPacketCount: number;
    scrambledPacketCount: number;
    tableId?: TableId;
    assetType?: number;
};

export type MMTPacketStatistics = {
    packetCount: number;
    dropPacketCount: number;
    scrambledPacketCount: number;
    tableId?: string;
    assetType?: number;
};

export class MMTPReader {
    siPacketQueue: Map<number, Uint8Array[]>;
    eventTarget: MMTTLVReaderEventTarget;
    packages: Map<number, Package> = new Map();
    assets: Map<number, Asset> = new Map();
    pltVersion = -1;
    catVersion = -1;
    constructor(eventTarget: MMTTLVReaderEventTarget) {
        this.eventTarget = eventTarget;
        this.siPacketQueue = new Map();
        this.reset();
    }

    statistics(): Map<number, MMTPacketStatistics> {
        const r = new Map<number, MMTPacketStatistics>();
        for (const [packetId, asset] of this.assets.entries()) {
            r.set(packetId, {
                packetCount: asset.packetCount,
                dropPacketCount: asset.dropPacketCount,
                scrambledPacketCount: asset.scrambledPacketCount,
                tableId: asset.tableId,
                assetType: asset.assetType,
            });
        }
        return r;
    }

    reset() {
        this.siPacketQueue.clear();
        this.packages.clear();
        this.assets.clear();
        this.pltVersion = -1;
        this.catVersion = -1;
        for (const [tableId, pid] of [
            ["PLT", MMT_PID_PLT],
            ["CAT", MMT_PID_CAT],
            ["EIT", MMT_PID_EIT],
            ["BIT", MMT_PID_BIT],
            ["SDTT", MMT_PID_SDTT],
            ["SDT", MMT_PID_SDT],
            ["TOT", MMT_PID_TOT],
            ["CDT", MMT_PID_CDT],
        ] as const) {
            this.assets.set(pid, {
                packetSequenceNumber: undefined,
                fragmentIndicator: undefined,
                referencedPackages: new Set([pid]),
                packetCount: 0,
                dropPacketCount: 0,
                scrambledPacketCount: 0,
                tableId,
                assetType: undefined,
            });
        }
    }

    private addAsset(mptPacketId: number, packetId: number, tableId?: TableId, assetType?: number) {
        const a = this.assets.get(packetId);
        if (a != null) {
            a.tableId = tableId;
            a.assetType = assetType;
            a.referencedPackages.add(mptPacketId);
        } else {
            this.assets.set(packetId, {
                packetSequenceNumber: undefined,
                fragmentIndicator: undefined,
                referencedPackages: new Set([mptPacketId]),
                packetCount: 0,
                dropPacketCount: 0,
                scrambledPacketCount: 0,
                tableId,
                assetType,
            });
        }
    }

    onSI(packetId: number, payloads: Uint8Array[]) {
        const message = readMessage(concatBuffers(payloads));
        if (message == null) {
            return;
        }
        switch (message.messageId) {
            case "PA":
                if (packetId === MMT_PID_PLT && message.tables[0]?.tableId === "PLT") {
                    const plt = message.tables[0];
                    if (this.pltVersion !== plt.version) {
                        this.pltVersion = plt.version;
                        this.packages.forEach((pkg) => (pkg.active = false));
                        for (const pkg of plt.packages) {
                            this.addAsset(
                                pkg.locationInfo.packetId,
                                pkg.locationInfo.packetId,
                                "MPT"
                            );
                            const p = this.packages.get(pkg.locationInfo.packetId);
                            if (p != null) {
                                p.active = true;
                            } else {
                                this.packages.set(pkg.locationInfo.packetId, {
                                    active: true,
                                    version: -1,
                                });
                            }
                        }
                        this.packages.forEach((pkg, mptPacketId) => {
                            if (pkg.active) {
                                return;
                            }
                            this.assets.forEach((asset) => {
                                asset.referencedPackages.delete(mptPacketId);
                                if (asset.referencedPackages.size === 0) {
                                    asset.packetSequenceNumber = undefined;
                                }
                            });
                        });
                    }
                    this.eventTarget.dispatchEvent("plt", { packetId, table: plt });
                } else if (message.tables[0]?.tableId === "MPT") {
                    const p = this.packages.get(packetId);
                    if (p?.version !== message.tables[0].version) {
                        if (p != null) {
                            p.version = message.tables[0].version;
                        }
                        this.assets.forEach((asset, pid) => {
                            if (asset.referencedPackages.has(pid)) {
                                asset.referencedPackages.delete(pid);
                            }
                        });
                        for (const desc of message.tables[0].mptDescriptors) {
                            if (desc.tag === "accessControl") {
                                const assetPacketId = desc.locationInfo.packetId;
                                if (assetPacketId === MMT_PID_INVALID) {
                                    continue;
                                }
                                this.addAsset(packetId, assetPacketId, "ECM");
                            }
                            if (desc.tag === "applicationService") {
                                const aitPacketId = desc.aitLocationInfo.packetId;
                                this.addAsset(packetId, aitPacketId, "AIT");
                                const dtPacketId = desc.dtMessageLocationInfo?.packetId;
                                if (dtPacketId != null) {
                                    this.addAsset(packetId, dtPacketId, "DDMT/DAMT");
                                }
                                for (const emt of desc.emtList) {
                                    const emtPacketId = emt.emtLocationInfo.packetId;
                                    this.addAsset(packetId, emtPacketId, "EMT");
                                }
                            }
                        }
                        for (const asset of message.tables[0].assets) {
                            const assetPacketId = asset.locations[0]?.packetId;
                            if (assetPacketId == null) {
                                continue;
                            }
                            this.addAsset(packetId, assetPacketId, undefined, asset.assetType);
                        }
                        this.assets.forEach((asset, pid) => {
                            if (asset.referencedPackages.size === 0) {
                                asset.packetSequenceNumber = undefined;
                            }
                        });
                    }
                    this.eventTarget.dispatchEvent("mpt", { packetId, table: message.tables[0] });
                }
                break;
            case "M2section":
                switch (packetId) {
                    case MMT_PID_SDT:
                        if (
                            message.table.tableId === "SDT[actual]" ||
                            message.table.tableId === "SDT[other]"
                        ) {
                            this.eventTarget.dispatchEvent("sdt", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    case MMT_PID_CDT:
                        if (message.table.tableId === "CDT") {
                            this.eventTarget.dispatchEvent("cdt", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    case MMT_PID_BIT:
                        if (message.table.tableId === "BIT") {
                            this.eventTarget.dispatchEvent("bit", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    case MMT_PID_EIT:
                        if (
                            message.table.tableId === "EIT[p/f]" ||
                            message.table.tableId === "EIT[schedule basic]" ||
                            message.table.tableId === "EIT[schedule extended]"
                        ) {
                            this.eventTarget.dispatchEvent("eit", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                    default:
                        if (message.table.tableId === "AIT") {
                            this.eventTarget.dispatchEvent("ait", {
                                packetId,
                                table: message.table,
                            });
                        } else if (message.table.tableId === "EMT") {
                            this.eventTarget.dispatchEvent("emt", {
                                packetId,
                                table: message.table,
                            });
                        }
                        break;
                }
                break;
            case "M2shortSection":
                if (packetId === MMT_PID_TOT) {
                    this.eventTarget.dispatchEvent("tot", { packetId, table: message.table });
                }
                break;
            case "CAT":
                if (packetId === MMT_PID_CAT) {
                    if (this.catVersion === message.table.version) {
                        return;
                    }
                    this.catVersion = message.table.version;
                    const emmPID: number[] = [];
                    for (const desc of message.table.descriptors) {
                        if (desc.tag === "accessControl") {
                            const assetPacketId = desc.locationInfo.packetId;
                            if (assetPacketId === MMT_PID_INVALID) {
                                continue;
                            }
                            emmPID.push(assetPacketId);
                        }
                    }
                    for (const assetPacketId of emmPID) {
                        this.addAsset(packetId, assetPacketId, "EMM");
                    }
                    this.assets.forEach((asset, pid) => {
                        if (asset.referencedPackages.has(packetId) && emmPID.indexOf(pid) === -1) {
                            asset.referencedPackages.delete(packetId);
                            if (asset.referencedPackages.size === 0) {
                                asset.packetSequenceNumber = undefined;
                            }
                        }
                    });
                }
                break;
            case "dataTransmission":
                if (message.table.tableId === "DDMT") {
                    this.eventTarget.dispatchEvent("ddmt", {
                        packetId,
                        table: message.table,
                    });
                } else if (message.table.tableId === "DAMT") {
                    this.eventTarget.dispatchEvent("damt", {
                        packetId,
                        table: message.table,
                    });
                }
                break;
        }
    }

    push(packet: Uint8Array, offset: number, context: TLVContext) {
        const reader = new BinaryReader(packet, offset);
        if (!reader.canRead(1 + 1 + 2 + 4 + 4)) {
            return;
        }
        const flags = reader.readUint8();
        // always 0
        const version = flags >> 6;
        // always 0
        const packetCounterFlag = !!((flags >> 5) & 1);
        // always 0
        const fecType = (flags >> 4) & 3;
        const extensionFlag = !!((flags >> 1) & 1);
        const rapFlag = !!(flags & 1);
        const payloadType = reader.readUint8() & ((1 << 6) - 1);
        const packetId = reader.readUint16();
        const timestamp = reader.readUint32();
        const packetSequenceNumber = reader.readUint32();
        if (packetCounterFlag && !reader.canRead(4)) {
            return;
        }
        const packetCounter = packetCounterFlag ? reader.readUint32() : undefined;
        let asset = this.assets.get(packetId);
        if (asset == null) {
            asset = {
                referencedPackages: new Set(),
                packetSequenceNumber: undefined,
                fragmentIndicator: undefined,
                packetCount: 0,
                dropPacketCount: 0,
                scrambledPacketCount: 0,
                tableId: undefined,
                assetType: undefined,
            };
            this.assets.set(packetId, asset);
        }
        const prevPacketSequenceNumber = asset.packetSequenceNumber;
        asset.packetCount += 1;
        let scrambled = false;
        let downloadId: number | undefined;
        let itemFragmentNumber: number | undefined;
        let lastItemFragmentNumber: number | undefined;
        if (extensionFlag) {
            if (!reader.canRead(4)) {
                return;
            }
            // always 0
            const extensionType = reader.readUint16();
            const extensionLength = reader.readUint16();
            if (!reader.canRead(extensionLength)) {
                return;
            }
            const ext = reader.subarray(extensionLength);
            for (let i = 0; extensionType == 0x0000 && i + 4 <= ext.length; ) {
                const hdr = (ext[i] << 8) | ext[i + 1];
                const hdrExtEndFlag = !!(hdr >> 15);
                const hdrExtType = hdr & 0x7fff;
                const hdrExtLength = (ext[i + 2] << 8) | ext[i + 3];
                i += 4;
                if (i + hdrExtLength > ext.length) {
                    break;
                }
                switch (hdrExtType) {
                    case MMT_MULTI_TYPE_HEADER_EXTENSION_SCRAMBLE:
                        if (hdrExtLength < 1) {
                            break;
                        }
                        const control = (ext[i] >> 3) & 3;
                        if (control !== MMT_SCRAMBLE_CONTROL_NONE) {
                            asset.scrambledPacketCount += 1;
                            this.eventTarget?.dispatchEvent("scrambled", {
                                context,
                                packetId,
                            });
                            scrambled = true;
                        }
                        break;
                    case MMT_MULTI_TYPE_HEADER_EXTENSION_DOWNLOAD_ID:
                        if (hdrExtLength >= 4) {
                            downloadId =
                                ext[i] * (1 << 24) +
                                (ext[i + 1] << 16) +
                                (ext[i + 2] << 8) +
                                ext[i + 3];
                        }
                        break;
                    case MMT_MULTI_TYPE_HEADER_EXTENSION_ITEM_FRAGMENTATION:
                        if (hdrExtLength >= 8) {
                            itemFragmentNumber =
                                ext[i] * (1 << 24) +
                                (ext[i + 1] << 16) +
                                (ext[i + 2] << 8) +
                                ext[i + 3];
                            lastItemFragmentNumber =
                                ext[i + 4] * (1 << 24) +
                                (ext[i + 5] << 16) +
                                (ext[i + 6] << 8) +
                                ext[i + 7];
                        }
                        break;
                }
                i += hdrExtLength;
                if (hdrExtEndFlag) {
                    break;
                }
            }
        }
        if (payloadType === MMTP_PAYLOAD_TYPE_MPU) {
            if (!reader.canRead(2)) {
                return;
            }
            const payloadLength = reader.readUint16();
            if (!reader.canRead(payloadLength) || payloadLength < 1) {
                return;
            }
            const payload = reader.subarray(payloadLength);
            const h = payload[0];
            const fragmentationIndicator = (h >> 1) & 3;
            let drop = false;
            const newFragment =
                asset.fragmentIndicator === MMTP_FRAGMENTATION_INDICATOR_HEAD ||
                asset.fragmentIndicator === MMTP_FRAGMENTATION_INDICATOR_COMPLETE;
            switch (asset.fragmentIndicator) {
                // tail=>middle: drop
                // tail=>tail: drop
                // complete=>middle: drop
                // complete=>tail: drop
                case MMTP_FRAGMENTATION_INDICATOR_TAIL:
                case MMTP_FRAGMENTATION_INDICATOR_COMPLETE:
                    asset.fragmentIndicator = fragmentationIndicator;
                    drop =
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_HEAD &&
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_COMPLETE;
                    break;
                // head=>complete: drop
                // head=>head: drop
                // middle=>complete: drop
                // middle=>head: drop
                case MMTP_FRAGMENTATION_INDICATOR_HEAD:
                case MMTP_FRAGMENTATION_INDICATOR_MIDDLE:
                    asset.fragmentIndicator = fragmentationIndicator;
                    drop =
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_MIDDLE &&
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_TAIL;
                    break;
                default:
                    asset.fragmentIndicator = fragmentationIndicator;
                    break;
            }
            if (drop || newFragment) {
                if (prevPacketSequenceNumber != null && asset.referencedPackages.size > 0) {
                    const expected = (prevPacketSequenceNumber + 1) % 0x100000000;
                    if (expected !== packetSequenceNumber) {
                        asset.dropPacketCount += 1;
                        this.eventTarget?.dispatchEvent("mmtDiscontinuity", {
                            packetId,
                            expected,
                            actual: packetSequenceNumber,
                            context,
                        });
                    }
                }
            }
            if (scrambled) {
                return;
            }
            if (this.eventTarget.getListenerCount("mpu") === 0) {
                return;
            }
            const mpu = readMPU(payload);
            if (mpu != null) {
                const headerExtensions: MMTHeaderExtension[] = [];
                if (downloadId != null) {
                    headerExtensions.push({
                        headerType: "downloadId",
                        downloadId,
                    });
                }
                if (lastItemFragmentNumber != null && itemFragmentNumber != null) {
                    headerExtensions.push({
                        headerType: "itemFragmentation",
                        itemFragmentNumber,
                        lastItemFragmentNumber,
                    });
                }
                const mmtHeader: MMTHeader = {
                    version,
                    fecType,
                    extensionFlag,
                    rapFlag,
                    payloadType,
                    packetId,
                    timestamp,
                    packetSequenceNumber,
                    packetCounter,
                    headerExtensions,
                };
                this.eventTarget.dispatchEvent("mpu", {
                    mmtHeader,
                    mpu,
                });
            }
        } else if (payloadType === MMTP_PAYLOAD_TYPE_SI) {
            if (!reader.canRead(2)) {
                return;
            }
            const h = reader.readUint8();
            const fragmentationIndicator = h >> 6;
            let drop = false;
            const newFragment =
                asset.fragmentIndicator === MMTP_FRAGMENTATION_INDICATOR_HEAD ||
                asset.fragmentIndicator === MMTP_FRAGMENTATION_INDICATOR_COMPLETE;
            switch (asset.fragmentIndicator) {
                // tail=>middle: drop
                // tail=>tail: drop
                // complete=>middle: drop
                // complete=>tail: drop
                case MMTP_FRAGMENTATION_INDICATOR_TAIL:
                case MMTP_FRAGMENTATION_INDICATOR_COMPLETE:
                    asset.fragmentIndicator = fragmentationIndicator;
                    drop =
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_HEAD &&
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_COMPLETE;
                    break;
                // head=>complete: drop
                // head=>head: drop
                // middle=>complete: drop
                // middle=>head: drop
                case MMTP_FRAGMENTATION_INDICATOR_HEAD:
                case MMTP_FRAGMENTATION_INDICATOR_MIDDLE:
                    asset.fragmentIndicator = fragmentationIndicator;
                    drop =
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_MIDDLE &&
                        fragmentationIndicator !== MMTP_FRAGMENTATION_INDICATOR_TAIL;
                    break;
                default:
                    asset.fragmentIndicator = fragmentationIndicator;
                    break;
            }
            if (drop || newFragment) {
                if (prevPacketSequenceNumber != null && asset.referencedPackages.size > 0) {
                    const expected = (prevPacketSequenceNumber + 1) % 0x100000000;
                    if (expected !== packetSequenceNumber) {
                        asset.dropPacketCount += 1;
                        this.eventTarget?.dispatchEvent("mmtDiscontinuity", {
                            packetId,
                            expected,
                            actual: packetSequenceNumber,
                            context,
                        });
                    }
                }
            }
            if (scrambled) {
                return;
            }
            if (packetId === MMT_PID_SDT && this.eventTarget.getListenerCount("sdt") === 0) {
                return;
            }
            if (packetId === MMT_PID_CDT && this.eventTarget.getListenerCount("cdt") === 0) {
                return;
            }
            if (packetId === MMT_PID_BIT && this.eventTarget.getListenerCount("bit") === 0) {
                return;
            }
            if (packetId === MMT_PID_EIT && this.eventTarget.getListenerCount("eit") === 0) {
                return;
            }
            if (packetId === MMT_PID_TOT && this.eventTarget.getListenerCount("tot") === 0) {
                return;
            }
            // always 0
            const lengthExtensionFlag = !!((h >> 1) & 1);
            // always 0
            const aggregationFlag = !!(h & 1);
            // always 0
            const fragmentCounter = reader.readUint8();
            if (!aggregationFlag) {
                const payload = packet.slice(reader.tell());
                if (fragmentationIndicator === MMTP_FRAGMENTATION_INDICATOR_COMPLETE) {
                    this.onSI(packetId, [payload]);
                    this.siPacketQueue.delete(packetId);
                } else if (fragmentationIndicator === MMTP_FRAGMENTATION_INDICATOR_HEAD) {
                    this.siPacketQueue.set(packetId, [payload]);
                } else {
                    const entry = this.siPacketQueue.get(packetId);
                    if (entry != null) {
                        entry.push(payload);
                        if (fragmentationIndicator === MMTP_FRAGMENTATION_INDICATOR_TAIL) {
                            this.onSI(packetId, entry);
                        }
                    }
                }
            }
        }
    }
}
