import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import formatBytes from "../lib/formatBytes";
import type { FileOptions } from "../types";
import DateComponent from "./DateComponent";

const FilePreview = ({ fileData: { date, name, size }, last }: FileOptions) => (
	<li className="break-all flex justify-between">
		<div className="flex flex-col">
			<a href={`/api/files/${name}`}>
				{name} ({formatBytes(size)})
			</a>
			<small className="opacity-50">
				<DateComponent timestamp={date} />
			</small>
		</div>
		<a
			className="w-10 h-10 p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:bg-opacity-80 dark:hover:bg-opacity-80"
			href={`/api/files/${name}?download=true`}
		>
			<FontAwesomeIcon icon={faDownload} />
		</a>
		{!last && <hr />}
	</li>
);

export default FilePreview;
