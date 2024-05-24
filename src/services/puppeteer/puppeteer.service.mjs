export class PuppeteerService {
  page;

  constructor(page) {
    console.log("### PUPPETEER SERVICE STARTED");
    this.page = page;
  }

  async waitForTimeout(timeout) {
    await this.screenshot();

    await new Promise((r) => setTimeout(r, timeout));

    await this.screenshot();
  }

  async screenshot() {
    await this.page.screenshot({ path: "screenshot.png" });
  }

  async clickUsingCss(selector) {
    await this.screenshot();

    const button = await this.page.waitForSelector(selector);
    await button.click();

    await this.screenshot();
  }

  async typeUsingCss(selector, text) {
    await this.screenshot();

    const input = await this.page.waitForSelector(selector);
    await input.type(text);

    await this.screenshot();
  }

  async clickOnXpathButton(selector) {
    await this.screenshot();

    let success = false;

    while (!success) {
      try {
        await this.page.evaluate((text) => {
          /** @type { any } */
          const button = document.evaluate(
            `//button[text()="${text}"]`,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          button.click();
        }, selector);

        success = true;
      } catch {}
    }

    await this.screenshot();
  }
}
