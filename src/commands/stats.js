const { Command, flags } = require("@oclif/command");
const fs = require("fs");
const keytar = require("keytar");
const inquirer = require("inquirer");
const { cli } = require("cli-ux");
const Table = require("cli-table3");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const chalk = require("chalk");
const API = require("call-of-duty-api")({
  platform: "battle",
  ratelimit: { maxRequests: 2, perMilliseconds: 1000, maxRPS: 2 },
});

const SERVICE_NAME = "wz-cli";

class StatsCommand extends Command {
  csvHeader = [
    { id: "timestamp", title: "TimeStamp" },
    { id: "wins", title: "Wins" },
    { id: "kills", title: "Kills" },
    { id: "downs", title: "Downs" },
    { id: "deaths", title: "deaths" },
    { id: "kdRatio", title: "KDRatio" },
  ];
  async run() {
    const { flags } = this.parse(StatsCommand);
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
        await this.processData(config.username, account.password);
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
        try {
          let password = await keytar.getPassword(
            SERVICE_NAME,
            config.username
          );
          await this.processData(config.username, password);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  async processData(username, password) {
    let response = await inquirer.prompt([
      {
        name: "battletag",
        message: "BattleTag of the user your want to know the stats of: ",
        type: "input",
      },
      {
        name: "game",
        message: "Plunder or Normal BR? ",
        type: "list",
        choices: [{ name: "br" }, { name: "plunder" }],
      },
    ]);
    let battletag = response.battletag;
    let game = response.game;
    cli.action.start("Loading data...");
    try {
      // LOGIN INTO API
      API.login(username, password).then((_) => {
        API.MWwz(battletag)
          .then((data) => {
            cli.action.stop();
            if (game === "br") {
              // FETCH BR DATA
              const br = data.lifetime.mode["br"].properties;

              // CHECK IF WRITE IS TRUE
              if (flags.write) {
                this.writeCsv(br, "br", battletag);
              }

              // SHOW THE DATA
              this.log(this.createTable(br, "BATTLE ROYALE"));
            } else if (game === "plunder") {
              // FETCH PLUNDER DATA
              const br_dmz = data.lifetime.mode["br_dmz"].properties;

              // CHECK IF WRITE IS TRUE
              if (flags.write) {
                this.writeCsv(br_dmz, "plunder", battletag);
              }

              // SHOW THE DATA
              this.log(this.createTable(br_dmz, "PLUNDER"));
            }
          })
          .catch((err) => {
            keytar
              .deletePassword(SERVICE_NAME, username)
              .then((t) => console.log(t))
              .catch((e) => console.log(e));
            console.log(err);
          });
      });
    } catch (e) {
      console.log(e);
    }
  }

  createTable(score, gameType) {
    const table = new Table();
    table.push(
      [
        {
          content: chalk.greenBright(gameType),
          colSpan: 2,
          hAlign: "center",
        },
      ],
      { Wins: score.wins },
      { "Top 10": score.topTen },
      { "Top 5": score.topFive },
      { Kills: score.kills },
      { Downs: score.downs },
      { Deaths: score.deaths },
      { "K-D Ratio": score.kdRatio.toFixed(2) },
      { "Scores per Minute": score.scorePerMinute.toFixed(2) },
      {
        "Time Played": `${(score.timePlayed / 3600).toFixed(2)} hours`,
      }
    );
    return table.toString();
  }

  writeCsv(data, gameType, battletag) {
    const csvWriter = createCsvWriter({
      path: `${__dirname}/${battletag}_${gameType}.csv"`,
      header: this.csvHeader,
      append: true,
    });
    data.timestamp = new Date().toISOString();
    csvWriter.writeRecords([data]).then((_) => {
      this.log("Written CSV file");
    });
  }
}

StatsCommand.description = `WarZone multiplayer stats`;

StatsCommand.flags = {
  version: flags.version({ char: "v" }),
  help: flags.help({ char: "h" }),
  write: flags.boolean({
    char: "w",
    description: "Write the data to a csv file",
  }),
  delete: flags.boolean({ char: "d", description: "Deletes the config file" }),
};
module.exports = StatsCommand;
