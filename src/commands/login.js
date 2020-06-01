const { Command, flags } = require("@oclif/command");
const fs = require("fs");
const keytar = require("keytar");
const inquirer = require("inquirer");

const SERVICE_NAME = "wz-cli";
class LoginCommand extends Command {
  async run() {
    const { flags } = this.parse(LoginCommand);
    let config = undefined;
    const path = `${process.cwd()}/wzconfig.json`;

    fs.readFile(path, `utf8`, async (err, data) => {
      if (err) {
        let account = await inquirer.prompt([
          {
            name: "username",
            message: "Activision username? ",
            type: "input",
          },
          {
            name: "password",
            message: "Activision password? ",
            type: "password",
          },
        ]);
        config = {
          username: account.username,
        };
        await keytar.setPassword(
          SERVICE_NAME,
          config.username,
          account.password
        );
        this.log("You are now logged in...");
        let json = JSON.stringify(config);
        fs.writeFile(path, json, `utf8`, (error, _) => {
          if (error) {
            console.log(error);
          }
        });
      } else {
        config = JSON.parse(data);
        if (flags.delete) {
          try {
            await fs.unlinkSync(path);
            await keytar.deletePassword(SERVICE_NAME, config.username);
            this.log("config deleted");
            return;
          } catch (e) {
            console.log(e);
          }
        }
        this.log(
          "You are already logged in, to login with a new account run this command with --delete flag"
        );
      }
    });
  }
}

LoginCommand.description = `Log-in to your activision account or delete account data`;

LoginCommand.flags = {
  delete: flags.boolean({ char: "d", description: "Deletes the config file" }),
};

module.exports = LoginCommand;
