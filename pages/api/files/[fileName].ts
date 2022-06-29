import type { NextApiRequest, NextApiResponse } from "next";
import { writeFile } from "node:fs/promises";
import type { OutgoingHttpHeaders } from "node:http";
import { join } from "node:path";
import { cwd } from "node:process";
import getFilesData from "../../../lib/getFilesData";
import parseIp from "../../../lib/parseIp";
import type { FileData } from "../../../types";

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

export const config = {
	api: {
		bodyParser: false,
		responseLimit: 1e10,
	},
};

const queue = new Queue();
const incomingRequests: NextApiRequest[] = [];

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const { fileName } = req.query as { fileName: string };
	const ip = parseIp(req.socket.remoteAddress);
	let file: FileData | undefined, files: FileData[];

	switch (req.method) {
		case "GET":
			file = (await getFilesData(ip)).find(({ name }) => name === fileName);

			if (!file) {
				res.status(404).end();
				return;
			}
			const headers: OutgoingHttpHeaders = {
				"Content-Type": file.type,
				"Content-Length": file.size,
			};

			if (req.query.download === "true")
				headers["Content-Disposition"] = `attachment; filename="${file.name}"`;
			const iReq = incomingRequests.find(
				(r) => r.query.fileName === fileName && Number(r.query.ip) === ip
			);

			if (!iReq) {
				res.status(404).end();
				return;
			}
			res.writeHead(200, headers);
			iReq.socket.resume();
			iReq.pipe(res);
			iReq.on("end", async () => {
				incomingRequests.splice(incomingRequests.indexOf(iReq), 1);
				await queue.wait();
				files = await getFilesData();
				await writeFile(
					join(cwd(), ".files/files.json"),
					JSON.stringify(
						files.filter(
							({ ip: targetIp, name }) => ip !== targetIp || name !== fileName
						)
					)
				);
				queue.next();
			});
			break;
		case "POST":
			await queue.wait();
			files = await getFilesData();
			const targetIp = Number(req.query.ip);

			if (isNaN(targetIp) || targetIp < 1 || targetIp > 255) {
				res.status(400).send({ error: "Invalid IP" });
				req.destroy();
				return;
			}
			if (
				files.some(
					({ name, ip: fileIp }) => name === fileName && targetIp === fileIp
				)
			) {
				res.status(409).send({ error: "File already exists" });
				req.destroy();
				queue.next();
				return;
			}
			const size = Number(req.headers["content-length"]);

			if (isNaN(size) || size < 0) {
				res.status(400).send({ error: "Invalid file size" });
				req.destroy();
				return;
			}
			const type = req.headers["content-type"];

			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			if (!type) {
				res.status(400).send({ error: "Invalid file type" });
				req.destroy();
				return;
			}
			const fileData: FileData = {
				date: Date.now(),
				name: fileName,
				size,
				type,
				ip: targetIp,
			};

			files.push(fileData);
			const failed: true | void = await writeFile(
				join(cwd(), ".files/files.json"),
				JSON.stringify(files)
			)
				.catch((err) => {
					console.error(err);
					return true as const;
				})
				.finally(() => {
					queue.next();
				});

			if (failed) {
				res.status(500).end();
				req.destroy();
				return;
			}
			incomingRequests.push(req);
			req.socket.pause();
			break;
		default:
			break;
	}
};

export default handler;
