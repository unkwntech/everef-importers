interface Processor<T> {
    TableName: string;
    Insert(objects: T[]): void;
    Process(url: string): Promise<T[]>;
    DownloadAndInsert(url: string): Promise<void>;
}
