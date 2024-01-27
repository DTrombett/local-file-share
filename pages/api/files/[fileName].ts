import type { NextApiRequest, NextApiResponse } from "next";
import { writeFile } from "node:fs/promises";
import type { OutgoingHttpHeaders } from "node:http";
import { join } from "node:path";
import { cwd } from "node:process";
import getFilesData from "../../../lib/getFilesData";
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
const storage = join(cwd(), ".files/files.json");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const { fileName, password } = req.query as {
		fileName: string;
		password?: string;
	};

	switch (req.method) {
		case "POST": {
			await queue.wait();
			let files = await getFilesData();

			if (files.some(({ name }) => name === fileName)) {
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

			if (type == null) {
				res.status(400).send({ error: "Invalid file type" });
				req.destroy();
				return;
			}
			const fileData: FileData = {
				date: Date.now(),
				name: fileName,
				size,
				type,
				password,
			};

			files.push(fileData);
			const failed = await writeFile(storage, JSON.stringify(files)).catch(
				(err) => {
					console.error(err);
					return true as const;
				}
			);

			queue.next();
			req.on("close", async () => {
				incomingRequests.splice(incomingRequests.indexOf(req), 1);
				await queue.wait();
				files = await getFilesData();

				await writeFile(
					storage,
					JSON.stringify(files.filter(({ name }) => name !== fileName))
				);
				queue.next();
			});
			if (failed) {
				res.status(500).end();
				req.destroy();
				return;
			}
			incomingRequests.push(req);
			break;
		}
		case "GET": {
			const files = await getFilesData();
			const file = files.find(({ name }) => name === fileName);

			if (!file) {
				res.status(404).end();
				return;
			}
			const iReq = incomingRequests.find((r) => r.query.fileName === fileName);

			if (!iReq) {
				await writeFile(
					storage,
					JSON.stringify(files.filter((el) => el !== file))
				);
				res.status(404).end();
				return;
			}
			if (file.password !== undefined && file.password !== password) {
				res.status(401).end();
				return;
			}
			const headers: OutgoingHttpHeaders = {
				"Content-Type": file.type,
				"Content-Length": file.size,
			};

			if (req.query.download === "true")
				headers["Content-Disposition"] = `attachment; filename="${file.name}"`;

			res.writeHead(200, headers);
			iReq.pipe(res);
			break;
		}
		default:
			break;
	}
};

export default handler;
