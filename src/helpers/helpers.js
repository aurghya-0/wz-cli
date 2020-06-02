const fs = require("fs");
const kt = require("keytar");
const inquirer = require("inquirer");
const { cli } = require("cli-ux");
const API = require("call-of-duty-api")({
  platform: "battle",
  ratelimit: { maxRequests: 2, perMilliseconds: 1000, maxRPS: 2 },
});
const SERVICE_NAME = "wz-cli";

module.exports = {
  pathString: `${process.cwd()}/wzconfig.json`,

  loginHelper: async (configData, flags, path, choiceList, callback) => {
    let config = JSON.parse(configData);
    if (flags.delete) {
      try {
        await fs.unlinkSync(path);
        await kt.deletePassword(SERVICE_NAME, config.username);
        this.log("config deleted");
        return;
      } catch (e) {
        console.log(e);
      }
    }
    try {
      let password = await kt.getPassword(SERVICE_NAME, config.username);
      let response = await inquirer.prompt([
        {
          name: "battletag",
          message: "BattleTag of the user your want to know the stats of: ",
          type: "input",
        },
        {
          name: "choice",
          message: "What do you want to know? ",
          type: "list",
          choices: choiceList,
        },
      ]);
      const { battletag, choice } = response;
      cli.action.start("Loading...");
      await API.login(config.username, password);
      let data = await API.MWwz(battletag);
      await callback(data, choice);
    } catch (e) {
      console.log(e);
    }
  },
};
