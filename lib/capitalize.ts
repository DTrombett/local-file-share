/**
 * Capitalize a string.
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
const capitalize = <T extends string>(str: T) =>
	(str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;

export default capitalize;
