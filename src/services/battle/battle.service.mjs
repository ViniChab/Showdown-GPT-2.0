export class BattleService {
  page;

  constructor(page) {
    this.page = page;
    console.log("### BATTLE SERVICE STARTED");
  }

  async startBattle() {}

  async waitForBattle() {
    console.log("### WAITING FOR BATTLE");

    await this.page.waitForSelector(".innerbattle");
  }
}
