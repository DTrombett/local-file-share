import getFilesData from "../lib/getFilesData";
import FilesList from "./FilesList";
import UploadComponents from "./UploadComponents";

export const dynamic = "force-dynamic";

const Home = async () => {
	const files = await getFilesData();

	return (
		<>
			<div className="px-4 max-w-xl mb-8 mx-auto">
				<main>
					<header className="flex flex-col items-center">
						<h1 className="text-4xl leading-tight font-extrabold my-4">
							Local File Share
						</h1>
					</header>
					<div className="text-xl leading-normal text-center">
						<p>
							Condividi facilmente file con altri dispositivi connessi alla
							stessa rete in modo sicuro, privato e veloce.
						</p>
					</div>
					<div className="mt-4 border border-dashed rounded-3xl flex flex-col items-start buttons">
						<UploadComponents />
					</div>
					<section className="text-xl leading-normal pt-px">
						<h2 className="text-2xl my-4">File condivisi con te</h2>
						<FilesList files={files} />
					</section>
				</main>
			</div>
		</>
	);
};

export default Home;
