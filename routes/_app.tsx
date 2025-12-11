import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/crafting%20World.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <Component />
    </>
  );
}
