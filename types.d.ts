export type DateOptions = { timestamp: number };
export type HomeOptions = {
	filesData: Files;
	ip: number;
};
export type ClientFileData = {
	ips?: number[];
};
export type FileData = ClientFileData & {
	date: number;
	name: string;
	size: number;
	type: string;
	owner: number;
};
export type Props<T> = {
	props: T;
};
export type Files = FileData[];
