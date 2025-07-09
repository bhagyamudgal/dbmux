import { afterAll, afterEach, vi } from "vitest";
import { closeConnection } from "../src/utils/database";

afterEach(async () => {
    await closeConnection();
});

afterAll(() => {
    vi.clearAllMocks();
});
