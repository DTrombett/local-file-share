export type DateOptions = { timestamp: number };
export type HomeOptions = {
	filesData: Files;
	ip: number;
};
export type FileData = {
	date: number;
	name: string;
	ips?: number[];
	size: number;
	type: string;
};
export type Props<T> = {
	props: T;
};
export type Files = FileData[];
