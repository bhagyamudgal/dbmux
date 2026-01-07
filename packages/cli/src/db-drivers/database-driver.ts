import type {
    ConnectionConfig,
    DatabaseInfo,
    QueryResult,
    TableDetail,
} from "@dbmux/types/database";

export type DatabaseDriver = {
    connect(config: ConnectionConfig): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(config: ConnectionConfig): Promise<boolean>;
    getDatabases(): Promise<DatabaseInfo[]>;
    getTables(schema?: string): Promise<string[]>;
    getTableInfo(tableName: string, schema?: string): Promise<TableDetail>;
    executeQuery(sql: string): Promise<QueryResult>;
    terminateConnections(databaseName: string): Promise<void>;
    dropDatabase(databaseName: string): Promise<void>;
};
