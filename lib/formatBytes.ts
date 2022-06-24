const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

/**
 * Formats a number of bytes into a human readable string.
 * @param bytes - The number of bytes to format
 * @returns The formatted bytes
 */
const formatBytes = (bytes: number) => {
	const i = Math.floor(Math.log(bytes) / Math.log(1024));

	return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

export default formatBytes;
