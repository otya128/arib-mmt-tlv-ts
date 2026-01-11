import { CustomEventTarget } from "../event-target";
import { TSPacket } from "./packet";
import {
    BroadcasterInformationSection,
    CommonDataSection,
    DownloadDataBlockSection,
    DownloadInfoIndicationSection,
    EventInformationSection,
    NetworkInformationSection,
    ProgramAssociationSection,
    ProgramMapSection,
    ServiceDescriptionSection,
    StreamDescriptorSection,
    TimeOffsetSection,
} from "./si";

export interface TSReaderEventMap {
    nit: SIEvent<NetworkInformationSection>;
    eit: SIEvent<EventInformationSection>;
    sdt: SIEvent<ServiceDescriptionSection>;
    cdt: SIEvent<CommonDataSection>;
    tot: SIEvent<TimeOffsetSection>;
    bit: SIEvent<BroadcasterInformationSection>;
    pat: SIEvent<ProgramAssociationSection>;
    pmt: SIEvent<ProgramMapSection>;
    dsmcc: SIEvent<
        DownloadInfoIndicationSection | DownloadDataBlockSection | StreamDescriptorSection
    >;
    packet: { offset: number; packet: TSPacket };
}

export type TSReaderEventTarget = CustomEventTarget<TSReaderEventMap>;

export type SIEvent<T> = { pid: number; section: T };
