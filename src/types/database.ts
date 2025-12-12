export type DatabaseType = "postgresql" | "mysql" | "sqlite";

export type ConnectionConfig = {
    type: DatabaseType;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
    filePath?: string; // For SQLite
    lastConnectedAt?: string; // ISO timestamp of last connection
};

export type QueryResult = {
    rows: Record<string, unknown>[];
    rowCount: number;
    fields: string[];
    executionTime: number;
};

export type DatabaseInfo = {
    name: string;
    owner?: string;
    encoding?: string;
    size?: string;
    tables?: number;
};

export type TableInfo = {
    name: string;
    columns: ColumnInfo[];
    rowCount: number;
    schema?: string;
};

export type ColumnInfo = {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
};

export type TableDetail = {
    columns: ColumnInfo[];
    rowCount: number;
};

export type OperationType = "dump" | "restore";

export type OperationStatus = "success" | "failed";

export type DumpHistoryEntry = {
    id: string;
    operationType: OperationType;
    timestamp: string;
    database: string;
    connectionName: string;
    filePath: string;
    fileSize: number;
    status: OperationStatus;
    errorMessage?: string;
    deleted?: boolean;
    deletedAt?: string;
};

export type DBmuxConfig = {
    connections: Record<string, ConnectionConfig>;
    defaultConnection?: string;
    settings: {
        logLevel: "debug" | "info" | "warn" | "error";
        autoConnect: boolean;
        queryTimeout: number;
    };
    dumpHistory: DumpHistoryEntry[];
};
