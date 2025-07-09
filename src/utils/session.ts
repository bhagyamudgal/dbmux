import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CONFIG_DIR } from "./constants.js";

const SESSION_FILE = join(CONFIG_DIR, "session.json");

type Session = {
    activeConnection?: string;
};

export function setActiveConnection(name: string): void {
    const session: Session = { activeConnection: name };
    writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), "utf-8");
}

export function getActiveConnection(): string | null {
    if (!existsSync(SESSION_FILE)) {
        return null;
    }
    try {
        const content = readFileSync(SESSION_FILE, "utf-8");
        const session = JSON.parse(content) as Session;
        return session.activeConnection || null;
    } catch {
        return null;
    }
}

export function clearActiveConnection(): void {
    if (existsSync(SESSION_FILE)) {
        writeFileSync(SESSION_FILE, "{}", "utf-8");
    }
}
