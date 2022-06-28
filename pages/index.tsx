import ms from "ms";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { Component } from "react";
import FilePreview from "../components/FilePreview";
import formatBytes from "../lib/formatBytes";
import getFilesData from "../lib/getFilesData";
import parseIp from "../lib/parseIp";
import styles from "../styles/utils.module.css";
import type { ClientFileData, Files, HomeOptions, Props } from "../types";

const description =
		"Condividi file all'interno della stessa connessione in modo sicuro, privato e veloce",
	title = "Local File Share";

class Home extends Component {
	state: {
		file?: File;
		files: Files;
		upload?: {
			progress: number;
			total: number;
		};
		error?: string;
		speed?: number;
		wrongIps: boolean;
		duration?: number;
	};

	ip: number;

	startUploadTime?: number;

	constructor(props: HomeOptions) {
		super(props);

		this.state = {
			files: props.filesData,
			wrongIps: false,
		};
		this.ip = props.ip;
		if (typeof document !== "undefined") {
			document.addEventListener("drop", (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.handleFile(e.dataTransfer?.files[0]);
			});
			document.addEventListener("dragover", (e) => {
				e.preventDefault();
			});
		}
	}

	setState(state: Partial<Home["state"]>) {
		super.setState(state);
	}

	handleFile(file?: File) {
		if (file && file.size > 1e10)
			alert("Non puoi condividere file più grandi di 10GB!");
		else this.setState({ file, upload: undefined });
	}

	validateIps(value: string) {
		value = value.trim();
		this.setState({
			wrongIps: value.length
				? value.split(/\s*,\s*/).some((input) => !/^\d+$/.test(input))
				: false,
		});
	}

	uploadFile() {
		const { file, files, upload, wrongIps } = this.state;

		if (upload) return;
		if (!file) {
			alert("Devi prima scegliere dei file!");
			return;
		}
		if (files.some((f) => f.name === file.name)) {
			alert("Esiste già un file con questo nome!");
			return;
		}
		if (wrongIps) {
			alert(
				"I codici dispositivo sono una lista di numeri dispositivo separati da virgola! Se non sai cosa sono puoi lasciare vuoto questo campo."
			);
			return;
		}
		this.setState({
			upload: {
				progress: 0,
				total: file.size,
			},
			speed: undefined,
			duration: undefined,
			error: undefined,
		});
		const { value: ips } = document.getElementById("ips") as HTMLInputElement;
		const formData = new FormData();
		const xhr = new XMLHttpRequest();
		const data: ClientFileData = {};
		let lastLoaded = 0,
			oldLoaded = 0;
		const interval = setInterval(() => {
			this.setState({
				speed: lastLoaded - oldLoaded,
			});
			oldLoaded = lastLoaded;
		}, 1000);

		this.startUploadTime = Date.now();
		if (ips) data.ips = ips.split(/\s*,\s*/).map((i) => Number(i));
		formData.append("file1", file);
		formData.append("data", JSON.stringify(data));
		xhr.open("POST", `/api/files/${file.name}`);
		xhr.upload.addEventListener("progress", ({ loaded, total }) => {
			this.setState({
				upload: {
					progress: loaded,
					total,
				},
			});
			lastLoaded = loaded;
		});
		xhr.addEventListener("load", () => {
			clearInterval(interval);
			switch (xhr.status) {
				case 200:
					this.setState({
						files: [...files, JSON.parse(xhr.responseText)],
						duration: Date.now() - this.startUploadTime!,
					});
					break;
				case 500:
					this.setState({
						error: "Il file non può essere caricato al momento",
					});
					break;
				case 403:
					this.setState({
						error: "Il totale dei file caricati supera i 10GB",
					});
					break;
				case 409:
					this.setState({
						error: "Esiste già un file con questo nome",
					});
					break;
				case 400:
					this.setState({
						error: "Si è verificato un errore durante il caricamento dei dati",
					});
					break;
				default:
			}
			this.startUploadTime = undefined;
		});
		xhr.send(formData);
	}

	render() {
		const { file, files, upload, wrongIps, speed, duration, error } =
			this.state;

		return (
			<>
				<div className={styles.container}>
					<Head>
						<meta name="description" content={description} />
						<meta name="og:title" content={title} />
						<meta name="og:description" content={description} />
						<meta name="twitter:card" content="summary" />
						<meta name="twitter:description" content={description} />
						<meta name="twitter:title" content={title} />
						<title>{title}</title>
					</Head>
					<main>
						<header className={styles.header}>
							<h1 className={styles.heading2Xl}>{title}</h1>
						</header>
						<div className={`${styles.headingMd} ${styles.description}`}>
							<p>
								Condividi facilmente file con altri dispositivi connessi alla
								stessa rete in modo sicuro, privato e veloce.
							</p>
						</div>
						<div className={`${styles.optionsDiv} ${styles.centered} buttons`}>
							<div className={`${styles.optionElement}`}>
								<label
									className={`button ${styles.fileInput}`}
									htmlFor="fileInput"
								>
									Scegli file...
								</label>
								<input
									type="file"
									accept="*/*"
									id="fileInput"
									className={styles.input}
									onChange={(e) => {
										this.handleFile(e.target.files?.[0]);
									}}
								/>
								<div className={`${styles.fileName}`}>
									{file ? `${file.name} (${formatBytes(file.size)})` : ""}
								</div>
							</div>
							<div className={`${styles.optionElement} ${styles.ipsDiv}`}>
								<label className={`${styles.ipsText}`} htmlFor="ips">
									Codici dispositivo (facoltativo, il tuo è{" "}
									{<strong>{this.ip}</strong>}):
								</label>
								<input
									id="ips"
									className={`${styles.ips} ${wrongIps ? styles.wrongIps : ""}`}
									onChange={(e) => {
										this.validateIps(e.target.value);
									}}
								/>
							</div>
							<button
								className={`button ${styles.upload} ${styles.optionElement}`}
								onClick={() => {
									this.uploadFile();
								}}
							>
								Carica file
							</button>
							{upload && (
								<div className={`${styles.progress}`}>
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
												  )}%) - ${formatBytes(
														speed ?? upload.progress,
														false
												  )}/s`)}
									</span>
									<div className={`${styles.progressBar}`}>
										<div
											className={`${styles.progressBarFill} ${
												error !== undefined
													? styles.uploadError
													: upload.progress === upload.total
													? styles.uploadComplete
													: ""
											}`}
											style={{
												width: `${(upload.progress / upload.total) * 100}%`,
											}}
										></div>
									</div>
								</div>
							)}
						</div>
						<section className={`${styles.headingMd} ${styles.padding1px}`}>
							<h2 className={styles.headingLg}>Files</h2>
							{files.length ? (
								<ul className={styles.list}>
									{files.map((fileData, i) => (
										<FilePreview
											fileData={fileData}
											files={files}
											i={i}
											ip={this.ip}
											onClick={() => {
												if (
													!confirm(
														`Sei sicuro di voler eliminare "${fileData.name}"?`
													)
												)
													return;
												this.setState({
													files: files.filter((f) => f.name !== fileData.name),
												});
												fetch(`/api/files/${fileData.name}`, {
													method: "DELETE",
												}).catch(() => {
													// Ignore
												});
											}}
											key={fileData.name}
										/>
									))}
								</ul>
							) : (
								"Nessun file disponibile"
							)}
						</section>
					</main>
				</div>
				<footer className="footer">
					<i>
						Da un idea di D Trombett. Progetto realizzato in JavaScript e{" "}
						{<a href="https://www.typescriptlang.org/">TypeScript</a>} grazie a{" "}
						{<a href="https://reactjs.org/">React</a>} e{" "}
						{<a href="https://nextjs.org/">Next.js</a>}
					</i>
				</footer>
			</>
		);
	}
}

export const getServerSideProps: GetServerSideProps = async ({
	req,
}): Promise<Props<HomeOptions>> => {
	const ip = parseIp(req.socket.remoteAddress);

	return {
		props: {
			filesData: await getFilesData(ip),
			ip,
		},
	};
};

export default Home;
