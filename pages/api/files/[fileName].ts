import type { Fields, Files } from "formidable";
import { IncomingForm } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Stats } from "node:fs";
import { createReadStream } from "node:fs";
import { stat, unlink, writeFile } from "node:fs/promises";
import type { OutgoingHttpHeaders } from "node:http";
import { join } from "node:path";
import { cwd } from "node:process";
import getFilesData from "../../../lib/getFilesData";
import parseIp from "../../../lib/parseIp";
import type { ClientFileData, FileData } from "../../../types";

/**
 * A queue to wait for an action to be completed before continuing
 */
class Queue {
	/**
	 * The promises in the queue
	 */
	promises: { resolve: () => void; promise: Promise<void> }[] = [];

	/**
	 * Waits for last promise to resolve and queues a new one.
	 */
	wait() {
		let resolve!: () => void;
		const next = this.promises.at(-1)?.promise ?? Promise.resolve();
		const promise = new Promise<void>((res) => {
			resolve = res;
		});

		this.promises.push({ resolve, promise });
		return next;
	}

	/**
	 * Removes the last promise from the queue.
	 */
	next() {
		this.promises.shift()?.resolve();
	}
}

const queue = new Queue();

export const config = {
	api: {
		bodyParser: false,
		responseLimit: 1e9,
	},
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const { fileName } = req.query as { fileName: string };
	const ip = parseIp(req.socket.remoteAddress);
	let file: FileData | undefined,
		files: FileData[],
		newFiles: FileData[],
		stats: Stats | void;

	switch (req.method) {
		case "GET":
			file = (await getFilesData(ip)).find(({ name }) => name === fileName);

			if (!file) {
				res.status(404).end();
				return;
			}
			const path = join(cwd(), ".files/uploads", file.name);
			stats = await stat(path).catch((err) => {
				console.error(err);
			});

			if (!stats) {
				res.status(500).end();
				return;
			}
			const headers: OutgoingHttpHeaders = {
				"Content-Type": file.type,
				"Content-Length": stats.size,
				"Last-Modified": stats.mtime.toUTCString(),
			};

			if (req.query.download === "true")
				headers["Content-Disposition"] = `attachment; filename="${file.name}"`;
			res.writeHead(200, headers);
			createReadStream(path).pipe(res);
			break;
		case "DELETE":
			await queue.wait();
			files = await getFilesData();
			newFiles = files.filter(
				({ name, owner }) => name !== fileName || (owner !== ip && ip !== 1)
			);

			if (newFiles.length === files.length) {
				res.status(404).end();
				queue.next();
				return;
			}
			const results = await Promise.all([
				writeFile(join(cwd(), ".files/files.json"), JSON.stringify(newFiles)),
				unlink(join(cwd(), ".files/uploads", fileName)),
			]).catch((err) => {
				console.error(err);
			});

			if (!results) {
				res.status(500).end();
				queue.next();
				return;
			}
			res.status(204).end();
			queue.next();
			break;
		case "POST":
			await queue.wait();
			stats = await stat(join(cwd(), ".files/uploads")).catch((err) => {
				console.error(err);
			});

			if (!stats) {
				res.status(500).end();
				req.destroy();
				queue.next();
				return;
			}
			if (stats.size > 1e10) {
				res.status(403).send({ error: "Uploads folder has reached 10GB size" });
				req.destroy();
				queue.next();
				return;
			}
			files = await getFilesData();
			if (files.some(({ name }) => name === fileName)) {
				res.status(409).send({ error: "File already exists" });
				req.destroy();
				queue.next();
				return;
			}
			const form = new IncomingForm({
				keepExtensions: true,
				maxFiles: 1,
				maxFields: 1,
				maxFileSize: 1e9,
				uploadDir: join(cwd(), ".files/uploads"),
				filename: () => fileName,
			});
			const formData = await new Promise<[Fields, Files]>((resolve, reject) => {
				form.parse(req, (err, ...args) => {
					if (err as Error | null) {
						reject(err);
						return;
					}
					resolve(args);
				});
			}).catch((err) => {
				console.error(err);
			});

			if (!formData) {
				res.status(400).send({ error: "Couldn't parse form data" });
				req.destroy();
				queue.next();
				return;
			}
			const [{ data }, { file1 }] = formData;

			if (typeof data !== "string") {
				res
					.status(400)
					.send({ error: "Param 'data' should be a stringified JSON" });
				req.destroy();
				queue.next();
				return;
			}
			if (typeof file1 !== "object" || !("size" in file1)) {
				res.status(400).send({ error: "Param 'file1' should be a file" });
				req.destroy();
				queue.next();
				return;
			}
			let clientFileData: ClientFileData;

			try {
				clientFileData = JSON.parse(data);
				if (typeof clientFileData !== "object")
					throw new TypeError("Data should be an object");
			} catch (error) {
				console.error(error);
				res.status(400).send({ error: "Couldn't parse data" });
				req.destroy();
				queue.next();
				return;
			}
			const fileData: FileData = {
				date: file1.mtime?.getTime() ?? Date.now(),
				name: fileName,
				owner: ip,
				size: file1.size,
				type: file1.mimetype ?? "application/octet-stream",
				ips: clientFileData.ips,
			};

			files.push(fileData);
			const failed = await writeFile(
				join(cwd(), ".files/files.json"),
				JSON.stringify(files)
			).catch((err) => {
				console.error(err);
				return true;
			});

			if (failed === true) {
				res.status(500).end();
				req.destroy();
				queue.next();
				return;
			}
			res.status(200).send(fileData);
			queue.next();
			break;
		default:
			break;
	}
};

export default handler;
