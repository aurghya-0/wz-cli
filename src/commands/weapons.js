const { Command, flags } = require("@oclif/command");
const fs = require("fs");
const { cli } = require("cli-ux");
const Table = require("cli-table3");
const chalk = require("chalk");
const inquirer = require("inquirer");
const _ = require("lodash");
const { weaponsChoiceList } = require("../helpers/choiceListHelper");
const weaponNames = require("../helpers/weaponNameHelper");
const { pathString, loginHelper } = require("../helpers/helpers");

class WeaponsCommand extends Command {
  async run() {
    const { flags } = this.parse(WeaponsCommand);
    fs.readFile(pathString, `utf8`, async (err, data) => {
      if (err) {
        console.log("You are not logged in...");
      } else {
        await loginHelper(
          data,
          flags,
          pathString,
          weaponsChoiceList,
          async (res, choice) => {
            let { itemData: weaponsData } = res["lifetime"];
            cli.action.stop();
            let weaponsInverted = _.invert(weaponNames[choice]);
            let choices = Object.keys(weaponsInverted).map((c) => {
              return { name: c };
            });
            let inquire = await inquirer.prompt([
              {
                name: "weaponName",
                message: "Select a weapon => ",
                type: "list",
                choices,
              },
            ]);
            const { weaponName } = inquire;
            let weaponProperties =
              weaponsData[choice][weaponsInverted[weaponName]].properties;
            console.log(this.createTable(weaponProperties, weaponName));
          }
        );
      }
    });
  }

  createTable(weaponProperties, weaponName) {
    const { hits, kills, headshots, accuracy, shots } = weaponProperties;
    const table = new Table();
    table.push(
      [{ content: chalk.redBright(weaponName), colSpan: 2, hAlign: "center" }],
      [{ content: "Shots Fired" }, { content: shots }],
      [{ content: "Hits" }, { content: chalk.greenBright(hits) }],
      [{ content: "Kills" }, { content: chalk.redBright(kills) }],
      [
        { content: "Accuracy" },
        {
          content: `${
            accuracy < 0.2
              ? chalk.yellow((accuracy * 100).toFixed(2))
              : chalk.red((accuracy * 100).toFixed(2))
          }`,
        },
      ],
      [{ content: "Headshots" }, { content: headshots }]
    );
    return table.toString();
  }
}

WeaponsCommand.description = `Weapon usage details
...
Get details on every weapon data you have used...
`;

WeaponsCommand.flags = {
  help: flags.help({ char: "h", description: "Help for this command" }),
};

module.exports = WeaponsCommand;
