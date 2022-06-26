import { faDownload, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import formatBytes from "../lib/formatBytes";
import type { FileOptions } from "../types";
import DateComponent from "./DateComponent";
import styles from "./FilePreview.module.css";

const FilePreview = ({
	fileData: { date, name, size, owner },
	i,
	ip,
	files,
	onClick,
}: FileOptions) => (
	<li className={styles.listItem}>
		<a href={`/api/files/${name}`}>
			{name} ({formatBytes(size)})
		</a>
		<span className={`${styles.actionButtons}`}>
			{(owner === ip || ip === 1) && (
				<button
					className={`button ${styles.actionButton}`}
					onClick={(...args) => {
						onClick(...args);
					}}
				>
					<FontAwesomeIcon icon={faTrashCan} />
				</button>
			)}
			<a
				className={`button ${styles.actionButton}`}
				href={`/api/files/${name}?download=true`}
			>
				<FontAwesomeIcon icon={faDownload} />
			</a>
		</span>
		<br />
		<small className={styles.lightText}>
			<DateComponent timestamp={date} />
		</small>
		{i !== files.length - 1 && <hr />}
	</li>
);

export default FilePreview;
