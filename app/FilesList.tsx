import { memo } from "react";
import type { Files } from "../types";
import FilePreview from "./FilePreview";

const FilesList = async ({ files }: { files: Files }) =>
	files.length ? (
		<ul className="list-none p-0 m-0">
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
	);

export default memo(FilesList);
