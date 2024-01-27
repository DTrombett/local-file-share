import type { Metadata } from "next";
import "tailwindcss/tailwind.css";
import "./global.css";

const description =
	"Share files at high speed, securely and without compression with devices connected to the same network";

export const metadata: Metadata = {
	applicationName: "Local Share",
	authors: [{ name: "D Trombett", url: "https://github.com/DTrombett" }],
	creator: "D Trombett",
	description,
	generator: "Next.js",
	icons: "/favicon.ico",
	keywords: ["react", "nextjs", "file-sharing", "wifi", "wireless"],
	// TODO: manifest
	openGraph: {
		type: "website",
		countryName: "Italy",
		description,
		locale: "it",
		siteName: "Local Share",
		title: "Local Share",
	},
	title: "Local Share",
	twitter: {
		card: "summary_large_image",
		description,
		images: "/preview.png",
		creator: "@dtrombett",
		title: "File Share",
	},
	metadataBase: new URL("http://localhost:3000"),
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
	<html lang="en">
		<body className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white text-xl font-sans min-h-screen flex flex-col justify-between">
			{children}
			<footer className="footer text-center bg-zinc-400 dark:bg-zinc-600 text-lg">
				<i>
					Da un idea di D Trombett. Progetto realizzato in JavaScript e{" "}
					<a href="https://www.typescriptlang.org/">TypeScript</a> grazie a{" "}
					<a href="https://reactjs.org/">React</a> e{" "}
					<a href="https://nextjs.org/">Next.js</a>
				</i>
			</footer>
		</body>
	</html>
);

export default RootLayout;
