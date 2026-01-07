import {
    Archive,
    History,
    RotateCcw,
    FolderOpen,
    Database,
    Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Feature = {
    icon: LucideIcon;
    title: string;
    description: string;
};

export const FEATURES: Feature[] = [
    {
        icon: Archive,
        title: "One-Command Backups",
        description:
            "Just run dbmux dump create. Smart defaults handle format, compression, and naming automatically.",
    },
    {
        icon: History,
        title: "Automatic History",
        description:
            "Every backup tracked with timestamp, size, and status. Never lose track of your dumps again.",
    },
    {
        icon: RotateCcw,
        title: "Instant Restore",
        description:
            "Run dbmux restore run and pick from history or specify a file. Create target database automatically.",
    },
    {
        icon: FolderOpen,
        title: "Managed Dump Files",
        description:
            "All dumps organized in ~/.dbmux/dumps/. List, delete, and manage everything from the CLI.",
    },
    {
        icon: Database,
        title: "Multi-Connection",
        description:
            "Save multiple database connections. Switch between dev, staging, and prod instantly.",
    },
    {
        icon: Terminal,
        title: "Query When Needed",
        description:
            "Run SQL queries too. Output as table, JSON, or CSV format for easy integration.",
    },
];

export type Step = {
    number: number;
    title: string;
    description: string;
    command: string;
};

export const STEPS: Step[] = [
    {
        number: 1,
        title: "Connect",
        description: "Save once, use forever",
        command: "dbmux connect",
    },
    {
        number: 2,
        title: "Create Backup",
        description: "One command, smart defaults",
        command: "dbmux dump create",
    },
    {
        number: 3,
        title: "View History",
        description: "See all your backups",
        command: "dbmux history list",
    },
    {
        number: 4,
        title: "Restore Anytime",
        description: "Pick from history, done",
        command: "dbmux restore run",
    },
];

export const INSTALL_COMMANDS = {
    curl: "curl -fsSL https://raw.githubusercontent.com/bhagyamudgal/dbmux/main/install.sh | bash",
    npm: "npm install -g dbmux",
    bun: "bun add -g dbmux",
};
