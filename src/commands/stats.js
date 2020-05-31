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
        message: "What do you want to know? ",
        type: "list",
        choices: [
          { name: "br" },
          { name: "plunder" },
          { name: "weekly stats" },
        ],
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
            } else if (game === "weekly stats") {
              let weeklyData = data.weekly.mode["br_all"].properties;
              this.log(this.createWeeklyTable(weeklyData));
              if (flags.write) {
                this.log(
                  chalk.red("Writing is only supported in BR and Plunder")
                );
              }
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

  createWeeklyTable(weeklyData) {
    const table = new Table();
    // properties: {
    //   kills: 104,
    //     headshots: 17,
    //     headshotPercentage: 0.16346153846153846,
    //     kdRatio: 1.6774193548387097,
    //     killsPerGame: 3.586206896551724,
    //     assists: 0,
    //     deaths: 62,
    //     gulagKills: 14,
    //     gulagDeaths: 12,
    //     objectiveTeamWiped: 21,
    //     objectiveLastStandKill: 59,
    //     objectiveReviver: 20,
    //     timePlayed: 70712,
    //     matchesPlayed: 29,
    //     executions: 1,
    // }
    table.push(
      [{ content: chalk.green("WEEKLY DATA"), colSpan: 2, hAlign: "center" }],
      { "Matches Played": weeklyData.matchesPlayed },
      { Headshots: weeklyData.headshots },
      { Executions: weeklyData.executions },
      {
        "Headshot Percentage": `${(weeklyData.headshotPercentage * 100).toFixed(
          2
        )}%`,
      },
      { "K-D Ratio": weeklyData.kdRatio.toFixed(2) },
      { "Average Kills per Game": weeklyData.killsPerGame.toFixed(0) },
      { Assists: weeklyData.assists },
      { Deaths: weeklyData.deaths },
      { "Gulag Kills": weeklyData.gulagKills },
      { "Gulag Deaths": weeklyData.gulagDeaths },
      { "Teams Wiped": weeklyData.objectiveTeamWiped },
      { "Last Stand Kills": weeklyData.objectiveLastStandKill },
      { "Revived Teammates": `${weeklyData.objectiveReviver} times` },
      { "Time Played": `${(weeklyData.timePlayed / 3600).toFixed(2)} hours` }
    );

    return table.toString();
  }
}

StatsCommand.description = `WarZone multiplayer stats`;

StatsCommand.flags = {
  write: flags.boolean({
    char: "w",
    description: "Write the data to a csv file",
  }),
  delete: flags.boolean({ char: "d", description: "Deletes the config file" }),
  help: flags.help({ char: "h" }),
};
module.exports = StatsCommand;
