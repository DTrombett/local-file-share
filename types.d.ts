export type DateOptions = { timestamp: number };
export type HomeOptions = {
	filesData: Files;
	ip: number;
};
export type ClientFileData = {
	ip: number;
};
export type FileData = ClientFileData & {
	date: number;
	name: string;
	size: number;
	type: string;
};
export type Props<T> = {
	props: T;
};
export type Files = FileData[];
export type FileOptions = {
	fileData: FileData;
	last: boolean;
};
