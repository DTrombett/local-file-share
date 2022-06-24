import "@fortawesome/fontawesome-free/css/all.min.css";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import DateComponent from "../components/DateComponent";
import formatBytes from "../lib/formatBytes";
import getFilesData from "../lib/getFilesData";
import parseIp from "../lib/parseIp";
import styles from "../styles/utils.module.css";
import type { HomeOptions, Props } from "../types";

const description =
		"Condividi file all'interno della stessa connessione in modo sicuro, privato e veloce",
	title = "Local File Share";

const Home = ({ filesData, ip }: HomeOptions) => {
	const [fileString, setFileString] = useState<string>("");
	const [wrongIps, setWrongIps] = useState<boolean>(false);

	const handleFiles = (fileList?: FileList | null) => {
		if (!fileList) return;
		const files = Array.from(fileList);

		if (files.length)
			if (files.some((file) => file.size > 1_073_741_824 /* 1GB */))
				alert("Non puoi condividere file più grandi di 1GB!");
			else
				setFileString(
					files
						.map((file) => `${file.name} (${formatBytes(file.size)})`)
						.join(", ")
				);
	};

	if (typeof document !== "undefined") {
		document.addEventListener("drop", (e) => {
			e.preventDefault();
			e.stopPropagation();
			handleFiles(e.dataTransfer?.files);
		});
		document.addEventListener("dragover", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
	}
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
								multiple
								accept="*/*"
								id="fileInput"
								className={styles.input}
								onChange={(e) => {
									handleFiles(e.target.files);
								}}
							/>
							<div className={`${styles.fileName}`}>{fileString}</div>
						</div>
						<div className={`${styles.optionElement} ${styles.ipsDiv}`}>
							<label className={`${styles.ipsText}`} htmlFor="ips">
								Codici dispositivo (facoltativo, il tuo è{" "}
								{<strong>{ip}</strong>}):
							</label>
							<input
								id="ips"
								className={`${styles.ips} ${wrongIps ? styles.wrongIps : ""}`}
								onChange={(e) => {
									const value = e.target.value.trim();
									setWrongIps(
										value.length
											? value
													.split(/\s*,\s*/)
													.some((input) => !/^\d+$/.test(input))
											: false
									);
								}}
							/>
						</div>
						<button
							className={`button ${styles.upload} ${styles.optionElement}`}
							onClick={() => {
								if (!fileString) {
									alert("Devi prima scegliere dei file!");
									return;
								}
								if (wrongIps) {
									alert(
										"I codici dispositivo sono una lista di numeri dispositivo separati da virgola! Se non sai cosa sono puoi lasciare vuoto questo campo."
									);
									return;
								}
							}}
						>
							Carica file
						</button>
					</div>
					<section className={`${styles.headingMd} ${styles.padding1px}`}>
						<h2 className={styles.headingLg}>Files</h2>
						<ul className={styles.list}>
							{filesData.map(({ date, name, size }) => (
								<li className={styles.listItem} key={name}>
									<Link href={`/api/file?name=${encodeURIComponent(name)}`}>
										<a>
											{name} ({formatBytes(size)})
										</a>
									</Link>
									<br />
									<small className={styles.lightText}>
										<DateComponent timestamp={date} />
									</small>
								</li>
							))}
						</ul>
					</section>
				</main>
			</div>
			<footer className="footer">
				<i>
					Da un idea di D Trombett. Progetto realizzato in JavaScript e
					TypeScript grazie a Next.js
				</i>
			</footer>
		</>
	);
};

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
