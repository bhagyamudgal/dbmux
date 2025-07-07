import { Client, Pool } from "pg";
import type {
    ColumnInfo,
    ConnectionConfig,
    DatabaseInfo,
    QueryResult,
    TableDetail,
} from "../types/database.js";
import type { DatabaseDriver } from "./database-driver.js";

export class PostgresDriver implements DatabaseDriver {
    private pool: Pool | null = null;

    async connect(config: ConnectionConfig): Promise<void> {
        if (this.pool) {
            await this.pool.end();
        }

        this.pool = new Pool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        const client = await this.pool.connect();
        await client.query("SELECT 1");
        client.release();
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }

    async testConnection(config: ConnectionConfig): Promise<boolean> {
        let testClient: Client | null = null;
        try {
            testClient = new Client({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                database: config.database,
                ssl: config.ssl ? { rejectUnauthorized: false } : false,
                connectionTimeoutMillis: 5000,
            });
            await testClient.connect();
            await testClient.query("SELECT 1");
            return true;
        } catch {
            return false;
        } finally {
            if (testClient) {
                await testClient.end();
            }
        }
    }

    async executeQuery(sql: string): Promise<QueryResult> {
        if (!this.pool) {
            throw new Error("No database connection.");
        }

        const startTime = Date.now();
        const result = await this.pool.query(sql);
        const executionTime = Date.now() - startTime;

        return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            fields: result.fields?.map((field) => field.name) || [],
            executionTime,
        };
    }

    async getDatabases(): Promise<DatabaseInfo[]> {
        const result = await this.executeQuery(`
            SELECT 
                d.datname as name,
                r.rolname as owner,
                pg_encoding_to_char(d.encoding) as encoding,
                pg_size_pretty(pg_database_size(d.datname)) as size,
                COALESCE(t.table_count, 0) as tables
            FROM pg_database d
            JOIN pg_roles r ON d.datdba = r.oid
            LEFT JOIN (
                SELECT 
                    table_catalog,
                    COUNT(*) as table_count
                FROM information_schema.tables 
                WHERE table_type = 'BASE TABLE'
                AND table_schema NOT IN ('information_schema', 'pg_catalog')
                GROUP BY table_catalog
            ) t ON d.datname = t.table_catalog
            WHERE d.datistemplate = false 
            AND d.datname != 'postgres'
            ORDER BY d.datname
        `);

        return result.rows.map((row) => ({
            name: row.name as string,
            owner: row.owner as string,
            encoding: row.encoding as string,
            size: row.size as string,
            tables: parseInt(row.tables as string, 10) || 0,
        }));
    }

    async getTables(schema = "public"): Promise<string[]> {
        const result = await this.executeQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '${schema}'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        return result.rows.map((row) => row.table_name as string);
    }

    async getTableInfo(
        tableName: string,
        schema = "public"
    ): Promise<TableDetail> {
        const columnsResult = await this.executeQuery(`
            SELECT 
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
            FROM information_schema.columns c
            LEFT JOIN (
                SELECT ku.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage ku
                    ON tc.constraint_name = ku.constraint_name
                    AND tc.table_schema = ku.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND tc.table_name = '${tableName}'
                    AND tc.table_schema = '${schema}'
            ) pk ON c.column_name = pk.column_name
            WHERE c.table_name = '${tableName}'
            AND c.table_schema = '${schema}'
            ORDER BY c.ordinal_position
        `);

        const countResult = await this.executeQuery(
            `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
        );

        const columns: ColumnInfo[] = columnsResult.rows.map((row) => ({
            name: row.column_name as string,
            type: row.data_type as string,
            nullable: (row.is_nullable as string) === "YES",
            defaultValue: row.column_default as string | null,
            isPrimaryKey: row.is_primary_key as boolean,
            isForeignKey: false,
        }));

        return {
            columns,
            rowCount: parseInt(countResult.rows[0]?.count as string, 10) || 0,
        };
    }
}
