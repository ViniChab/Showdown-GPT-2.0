import { BattleService } from "./src/services/battle/battle.service.mjs";
import { ChatGptService } from "./src/services/chat-gpt/chat-gpt.service.mjs";
import { PuppeteerService } from "./src/services/puppeteer/puppeteer.service.mjs";
import { ShowdownService } from "./src/services/showdown/showdown.service.mjs";
import dotenv from "dotenv";

dotenv.config();

const puppeteerService = new PuppeteerService();
const chatGptService = new ChatGptService(puppeteerService);
const showdownService = new ShowdownService(puppeteerService);

const args = process.argv.slice(2);
const isTeamBuilder = args.includes("--teambuilder");

// await chatGptService.startGptService();
const showdownPage = await showdownService.startShowdownService();
const battleService = new BattleService(showdownPage);

if (isTeamBuilder) {
  await showdownService.startTeamBuilder();
  process.exit(0);
}

await battleService.waitForBattle();
await battleService.startBattle();
