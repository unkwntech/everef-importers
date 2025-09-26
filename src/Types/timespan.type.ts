export default interface TimeSpan {
    StartDate?: Date | TimeSpecial;
    EndDate: Date | TimeSpecial;
    Duration?: number;
}

export enum TimeSpecial {
    TODAY,
}
