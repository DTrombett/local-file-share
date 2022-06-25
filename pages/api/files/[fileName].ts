import type { NextApiRequest, NextApiResponse } from "next";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { OutgoingHttpHeaders } from "node:http";
import { join } from "node:path";
import { cwd } from "node:process";
import getFilesData from "../../../lib/getFilesData";
import parseIp from "../../../lib/parseIp";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const file = (await getFilesData(parseIp(req.socket.remoteAddress))).find(
		({ name }) => name === req.query.fileName
	);

	if (!file) {
		res.status(404).end();
		return;
	}
	const path = join(cwd(), ".files/uploads", file.name);
	const stats = await stat(path);
	const headers: OutgoingHttpHeaders = {
		"Content-Type": file.type,
		"Content-Length": stats.size,
		"Last-Modified": stats.mtime.toUTCString(),
	};

	if (req.query.download === "true")
		headers["Content-Disposition"] = `attachment; filename="${file.name}"`;
	res.writeHead(200, headers);
	createReadStream(path).pipe(res);
};

export default handler;
