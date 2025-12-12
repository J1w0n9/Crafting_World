import { h } from "preact";

export default function DiscordButton() {
  return (
    <a
      href="https://discord.gg/fGYPzUCWry"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join our Discord server"
    >
      <img src="/discord_logo.png" alt="Join Discord" class="w-32 h-32 object-contain" />
    </a>
  );
}
