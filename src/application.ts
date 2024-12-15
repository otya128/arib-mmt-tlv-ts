import { BinaryReader } from "./utils";

export type IndexItem = {
    items: Item[];
};

export const ITEM_COMPRESSION_TYPE_ZLIB = 0x00;
export const ITEM_COMPRESSION_TYPE_UNCOMPRESSED = 0xff;

export type Item = {
    itemId: number;
    itemSize: number;
    itemVersion: number;
    fileName: Uint8Array;
    itemChecksum?: number;
    itemType: Uint8Array;
    /**
     * @see {@link ITEM_COMPRESSION_TYPE_ZLIB}
     * @see {@link ITEM_COMPRESSION_TYPE_UNCOMPRESSED}
     */
    compressionType: number;
    originalSize?: number;
};

export function readIndexItem(buffer: Uint8Array): IndexItem | undefined {
    const reader = new BinaryReader(buffer);
    if (!reader.canRead(2)) {
        return undefined;
    }
    const numOfItems = reader.readUint16();
    const items: Item[] = [];
    for (let i = 0; i < numOfItems; i++) {
        if (!reader.canRead(4 + 4 + 1 + 1)) {
            return undefined;
        }
        const itemId = reader.readUint32();
        const itemSize = reader.readUint32();
        const itemVersion = reader.readUint8();
        const fileNameLength = reader.readUint8();
        if (!reader.canRead(fileNameLength)) {
            return undefined;
        }
        const fileName = reader.slice(fileNameLength);
        if (!reader.canRead(1)) {
            return undefined;
        }
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
        const itemTypeLength = reader.readUint8();
        if (!reader.canRead(itemTypeLength)) {
            return undefined;
        }
        const itemType = reader.slice(itemTypeLength);
        if (!reader.canRead(1)) {
            return undefined;
        }
        const compressionType = reader.readUint8();
        let originalSize: number | undefined;
        if (compressionType !== ITEM_COMPRESSION_TYPE_UNCOMPRESSED) {
            if (!reader.canRead(4)) {
                return undefined;
            }
            originalSize = reader.readUint32();
        }
        items.push({
            itemId,
            itemSize,
            itemVersion,
            fileName,
            itemChecksum,
            itemType,
            compressionType,
            originalSize,
        });
    }
    return {
        items,
    };
}
