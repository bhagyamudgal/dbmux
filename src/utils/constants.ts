import { homedir } from "os";
import { join } from "path";

export const CONFIG_DIR = join(homedir(), ".dbmux");
