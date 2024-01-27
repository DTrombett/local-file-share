export type DateOptions = { timestamp: number };
export type FileData = {
	date: number;
	name: string;
	size: number;
	type: string;
	password?: string;
};
export type Files = FileData[];
export type FileOptions = {
	fileData: FileData;
	last: boolean;
};
