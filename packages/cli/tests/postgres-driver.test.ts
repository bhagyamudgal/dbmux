import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { FakePool, poolLog, setValidationQuery, resetPoolLog } = vi.hoisted(
    () => {
        const poolLog: string[] = [];
        let runValidationQuery: () => Promise<void> = async () => {};

        class TrackedPool {
            on(event: string) {
                poolLog.push(`on:${event}`);
            }

            async connect() {
                poolLog.push("acquire");
                return {
                    query: async () => {
                        await runValidationQuery();
                        return { rows: [], rowCount: 0, fields: [] };
                    },
                    release: () => poolLog.push("release"),
                };
            }

            async end() {
                poolLog.push("end");
            }
        }

        return {
            FakePool: TrackedPool,
            poolLog,
            setValidationQuery: (next: () => Promise<void>) => {
                runValidationQuery = next;
            },
            resetPoolLog: () => {
                poolLog.length = 0;
                runValidationQuery = async () => {};
            },
        };
    }
);

vi.mock("pg", () => ({ Pool: FakePool, Client: class {} }));

const DUMMY_CONNECTION = {
    type: "postgresql" as const,
    host: "dummy-host.invalid",
    port: 5432,
    user: "dummy_user",
    password: "dummy_password",
    database: "app_db",
    ssl: false,
};

let PostgresDriver: typeof import("../src/db-drivers/postgres-driver").PostgresDriver;

beforeAll(async () => {
    // see connection-cleanup.test.ts: tests/setup.ts pre-loads this graph.
    vi.resetModules();
    ({ PostgresDriver } = await import("../src/db-drivers/postgres-driver"));
});

describe("PostgresDriver.connect", () => {
    beforeEach(() => {
        resetPoolLog();
    });

    it("releases the client after a successful validation query", async () => {
        const driver = new PostgresDriver();

        await driver.connect(DUMMY_CONNECTION);

        expect(poolLog).toEqual(["on:error", "acquire", "release"]);
    });

    it("listens for pool errors, which are otherwise uncaught exceptions", async () => {
        const driver = new PostgresDriver();

        await driver.connect(DUMMY_CONNECTION);

        expect(poolLog[0]).toBe("on:error");
    });

    it("releases the client when the validation query fails", async () => {
        setValidationQuery(async () => {
            throw new Error(
                "terminating connection due to administrator command"
            );
        });
        const driver = new PostgresDriver();

        await expect(driver.connect(DUMMY_CONNECTION)).rejects.toThrow(
            "terminating connection due to administrator command"
        );

        expect(poolLog).toEqual(["on:error", "acquire", "release"]);
    });

    it("ends the pool on disconnect", async () => {
        const driver = new PostgresDriver();
        await driver.connect(DUMMY_CONNECTION);

        await driver.disconnect();

        expect(poolLog).toEqual(["on:error", "acquire", "release", "end"]);
    });
});
