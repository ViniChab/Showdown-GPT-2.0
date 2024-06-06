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

const showdownPage = await showdownService.startShowdownService();
await chatGptService.startGptService();
const battleService = new BattleService(
  showdownPage,
  chatGptService,
  puppeteerService
);

if (isTeamBuilder) {
  await showdownService.startTeamBuilder();
  process.exit(0);
}

await puppeteerService.restoreSession(showdownPage, "showdownSessionData.json");
showdownPage.reload({ timeout: 0 });
await puppeteerService.waitForTimeout(5000);

await battleService.waitForBattle();
await battleService.startBattle();
