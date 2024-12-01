export type NTP64Timestamp = {
    seconds: number;
    fractional: number;
};

export function ntp64TimestampToDate({ seconds, fractional }: NTP64Timestamp) {
    return new Date((seconds + fractional * Math.pow(2, -32)) * 1000);
}
