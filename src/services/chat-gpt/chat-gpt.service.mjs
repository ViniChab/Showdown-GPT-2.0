import { connect } from "puppeteer-real-browser";
import { PuppeteerService } from "../puppeteer/puppeteer.service.mjs";

export class ChatGptService {
  /** @type { PuppeteerService } */
  pupService;
  browser;
  page;

  constructor() {
    console.log("### CHAT GPT SERVICE STARTED");
  }

  async startGptService() {
    const { browser, page } = await connect({
      headless: "auto",
      fingerprint: false,
      turnstile: true,
    });

    this.browser = browser;
    this.page = page;

    this.pupService = new PuppeteerService(this.page);

    await this.page.goto(process.env.CHATGPT_URL, {
      waitUntil: "networkidle2",
    });

    await this.doChatGptLogin();
    await this.goToGptPlayer();

    await this.page.screenshot({ path: "screenshot.png" });
  }

  async doChatGptLogin() {
    await this.pupService.clickUsingCss('button[data-testid="login-button"]');

    await this.pupService.typeUsingCss(
      "#email-input",
      process.env.CHATGPT_EMAIL
    );

    await this.pupService.clickOnXpathButton("Continue");

    await this.pupService.typeUsingCss(
      "#password",
      process.env.CHATGPT_PASSWORD
    );

    await this.pupService.waitForTimeout(1000);

    await this.pupService.clickOnXpathButton("Continue");

    await this.page.waitForSelector('[type="file"]');
  }

  async goToGptPlayer() {
    await this.page.goto(process.env.CHATGPT_PLAYER_URL);
    await this.pupService.waitForTimeout(3000);
  }

  async sendMessage(message) {
    await this.pupService.typeUsingCss("#prompt-textarea", message);
    await this.pupService.clickUsingCss(
      'button[data-testid="fruitjuice-send-button"]'
    );

    await this.getGptResponse();
  }

  async getGptResponse() {
    await this.pupService.waitForTimeout(7000);

    const response = await this.page.evaluate(() => {
      /** @type { any } */
      const responseElement = Array.from(
        document.querySelectorAll('[data-message-author-role="assistant"]')
      ).pop();

      return responseElement.innerText;
    });

    await this.pupService.screenshot();
    console.log("\n### GPT RESPONSE:", response);

    return response;
  }
}
