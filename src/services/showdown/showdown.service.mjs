import Puppeteer from "puppeteer";
import { PuppeteerService } from "../puppeteer/puppeteer.service.mjs";

export class ShowdownService {
  /** @type { PuppeteerService } */
  pupService;
  browser;
  page;

  constructor(puppeteerService) {
    console.log("### SHOWDOWN SERVICE STARTED");

    this.pupService = puppeteerService;
  }

  async startShowdownService() {
    const height = 1080;
    const width = 1920;

    const browser = await Puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        `--window-size=${width},${height}`,
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: { width, height },
    });

    this.browser = browser;
    this.page = await browser.newPage();

    await this.page.goto(process.env.SHOWDOWN_URL, {
      waitUntil: "networkidle2",
    });

    return this.page;
  }

  async startTeamBuilder() {
    console.log("### YOU HAVE 50 SECONDS TO CREATE YOUR TEAM");

    await this.pupService.waitForTimeout(50000);

    await this.pupService.saveSession(this.page, process.env.SESSION_DATA_FILE);
    await this.browser.close();
  }
}
