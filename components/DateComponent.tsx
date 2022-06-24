import capitalize from "../lib/capitalize";
import type { DateOptions } from "../types";

/**
 * Format a date string to a human readable format.
 */
const DateComponent = ({ timestamp }: DateOptions) => {
	const date = new Date(timestamp);

	return (
		<time dateTime={date.toISOString()}>
			{date.getDate()}{" "}
			{capitalize(date.toLocaleString("default", { month: "long" }))}{" "}
			{date.getFullYear()}
		</time>
	);
};

export default DateComponent;
