export interface IPgConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: {
        ca: string;
    };
}

export interface IMongoConfig {
    uri: string;
}
