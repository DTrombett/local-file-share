import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import type { Files } from "../types";

const filesJson = join(cwd(), ".files/files.json");

/**
 * Get the data of all the files.
 * @returns An array of files data
 */
const getFilesData = async (ip: number): Promise<Files> =>
	(JSON.parse(await readFile(filesJson, "utf8")) as Files).filter(
		({ ips }) => ips?.includes(ip) ?? true
	);

export default getFilesData;
