import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import type { Files } from "../types";

const filesJson = join(cwd(), ".files/files.json");

/**
 * Get the data of all the files.
 * @returns An array of files data
 */
const getFilesData = async (ip = 0): Promise<Files> => {
	const files = JSON.parse(await readFile(filesJson, "utf8")) as Files;

	return ip ? files.filter(({ ip: targetIp }) => ip === targetIp) : files;
};

export default getFilesData;
