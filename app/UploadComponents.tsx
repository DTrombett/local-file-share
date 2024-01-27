"use client";
import ms from "ms";
import { memo, useState } from "react";
import formatBytes from "../lib/formatBytes";

const UploadComponents = () => {
	const [file, setFile] = useState<File>();
	const [upload, setUpload] = useState<{
		progress: number;
		total: number;
	}>();
	const [error, setError] = useState<string>();
	const [duration, setDuration] = useState<number>();
	const [speed, setSpeed] = useState<number>();
	const uploadFile = () => {
		if (upload) return;
		if (!file) {
			alert("Devi prima scegliere il file da condividere!");
			return;
		}
		setUpload({
			progress: 0,
			total: file.size,
		});
		setSpeed(undefined);
		setDuration(undefined);
		setError(undefined);
		const { value: password } = document.getElementById(
			"password"
		) as HTMLInputElement;
		const xhr = new XMLHttpRequest();
		let lastLoaded = 0,
			oldLoaded = 0;
		const interval = setInterval(() => {
			setSpeed(lastLoaded - oldLoaded);
			oldLoaded = lastLoaded;
		}, 1000);
		const startUploadTime = Date.now();
		const url = new URL(`${location.origin}/api/files/${file.name}`);

		if (password) url.searchParams.set("password", password);
		xhr.open("POST", url);
		xhr.upload.addEventListener("progress", ({ loaded, total }) => {
			setUpload({
				progress: loaded,
				total,
			});
			lastLoaded = loaded;
		});
		xhr.addEventListener("load", () => {
			clearInterval(interval);
			switch (xhr.status) {
				case 200:
					setDuration(Date.now() - startUploadTime);
					break;
				case 500:
					setError("Il file non può essere caricato al momento");
					break;
				case 409:
					setError("Esiste già un file con questo nome");
					break;
				case 400:
					setError("Si è verificato un errore durante il caricamento dei dati");
					break;
				default:
			}
		});
		xhr.send(file);
	};

	return (
		<>
			<div className="mt-8 ml-8">
				<label
					className="rounded px-5 py-3 cursor-pointer transition bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:bg-opacity-80 dark:hover:bg-opacity-80"
					htmlFor="file"
				>
					Choose file
				</label>
				<input
					type="file"
					accept="*/*"
					id="file"
					className="hidden"
					onChange={(e) => {
						const f = e.target.files?.[0];

						if (f && f.size > 1e10)
							alert("Non puoi condividere file più grandi di 10GB!");
						else {
							setFile(f);
							setUpload(undefined);
						}
					}}
				/>
				<div className="ml-4 mr-8 mb-4 inline-block align-middle relative top-2 break-all">
					{file ? `${file.name} (${formatBytes(file.size)})` : ""}
				</div>
			</div>
			<div className="my-4 ml-8 mr-4 h-4">
				<label className="align-middle" htmlFor="password">
					Password (optional):
				</label>
				<input
					id="password"
					className="text-lg pl-2 align-middle ml-2 bg-zinc-200 dark:bg-zinc-800 text-inherit rounded"
					type="text"
				/>
			</div>
			<button
				className="py-3 px-5 rounded transition duration-500 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:bg-opacity-80 dark:hover:bg-opacity-80 text-inherit border-none mx-auto my-8 enabled:hover:scale-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-200 dark:disabled:bg-zinc-800"
				onClick={uploadFile}
				disabled={!file}
			>
				Invia file
			</button>
			{upload && (
				<div className="mb-4 mx-auto w-5/6 text-center">
					<span>
						{error ??
							(upload.progress === upload.total
								? `Caricamento completato in ${ms(
										duration ?? 1000
								  )} (${formatBytes(
										(upload.total * 1000) / (duration ?? 1000)
								  )}/s)`
								: `Caricando ${formatBytes(
										upload.progress,
										false
								  )}/${formatBytes(upload.total, false)} (${Math.round(
										(upload.progress / upload.total) * 100
								  )}%) - ${formatBytes(speed ?? upload.progress, false)}/s`)}
					</span>
					<div className="bg-zinc-300 dark:bg-zinc-700 bg-opacity-80 dark:bg-opacity-80 rounded-md transition-all duration-500 w-full mt-2">
						<div
							className={`bg-cyan-500 h-3 rounded-md transition-all ${
								error !== undefined
									? "w-full bg-red-500"
									: upload.progress === upload.total
									? "bg-green-500"
									: ""
							}`}
							style={{
								width: error! || `${(upload.progress / upload.total) * 100}%`,
							}}
						></div>
					</div>
				</div>
			)}
		</>
	);
};

export default memo(UploadComponents);
