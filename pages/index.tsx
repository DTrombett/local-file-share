import ms from "ms";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { Component } from "react";
import FilePreview from "../components/FilePreview";
import formatBytes from "../lib/formatBytes";
import getFilesData from "../lib/getFilesData";
import parseIp from "../lib/parseIp";
import styles from "../styles/utils.module.css";
import type { Files, HomeOptions, Props } from "../types";

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
		wrongIp: boolean;
		duration?: number;
	};

	ip: number;

	startUploadTime?: number;

	constructor(props: HomeOptions) {
		super(props);

		this.state = {
			files: props.filesData,
			wrongIp: true,
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

	validateIp(value: string) {
		this.setState({
			wrongIp: value === "0" || !/^\d+$/.test(value),
		});
	}

	uploadFile() {
		const { file, upload, wrongIp } = this.state;

		if (upload) return;
		if (!file) {
			alert("Devi prima scegliere il file da condividere!");
			return;
		}
		if (wrongIp) {
			alert("Devi specificare un valido dispositivo a cui inviare il file!");
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
		const { value: ip } = document.getElementById("ip") as HTMLInputElement;
		const xhr = new XMLHttpRequest();
		let lastLoaded = 0,
			oldLoaded = 0;
		const interval = setInterval(() => {
			this.setState({
				speed: lastLoaded - oldLoaded,
			});
			oldLoaded = lastLoaded;
		}, 1000);

		this.startUploadTime = Date.now();
		xhr.open("POST", `/api/files/${file.name}?ip=${ip}`);
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
						duration: Date.now() - this.startUploadTime!,
					});
					break;
				case 500:
					this.setState({
						error: "Il file non può essere caricato al momento",
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
		xhr.send(file);
	}

	render() {
		const { file, files, upload, wrongIp, speed, duration, error } = this.state;

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
								<label className={`${styles.ipsText}`} htmlFor="ip">
									N° dispositivo (il tuo è {<strong>{this.ip}</strong>}):
								</label>
								<input
									id="ip"
									className={`${styles.ips} ${wrongIp ? styles.wrongIp : ""}`}
									onChange={(e) => {
										this.validateIp(e.target.value);
									}}
									type="number"
								/>
							</div>
							<button
								className={`button ${styles.upload} ${styles.optionElement}`}
								onClick={() => {
									this.uploadFile();
								}}
							>
								Invia file
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
							<h2 className={styles.headingLg}>File condivisi con te</h2>
							{files.length ? (
								<ul className={styles.list}>
									{files.map((fileData, i) => (
										<FilePreview
											fileData={fileData}
											key={fileData.name}
											last={i === files.length - 1}
										/>
									))}
								</ul>
							) : (
								"Nessun file presente"
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
