/**
 * Parse an ip number from a remote address.
 * @param remoteAddress - The remote address to parse
 * @returns The parsed ip number
 */
const parseIp = (remoteAddress?: string) =>
	remoteAddress === "::1" ? 0 : Number(remoteAddress?.at(-1));

export default parseIp;
