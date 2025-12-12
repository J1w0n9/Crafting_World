import Alchemy from "../islands/Alchemy.tsx";
import DiscordButton from "../islands/DiscordButton.tsx";
import { Head } from "$fresh/runtime.ts";

export default function AlchemyPage() {
  return (
    <>
      <Head>
        <title>Crafting World</title>
      </Head>
      <div class="flex flex-col items-center justify-center min-h-screen">
        <Alchemy />
        <DiscordButton />
      </div>
    </>
  );
}
