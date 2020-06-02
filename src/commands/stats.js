const { Command, flags } = require("@oclif/command");
const fs = require("fs");
const { pathString, loginHelper } = require("../helpers/helpers");
const { statsChoiceList } = require("../helpers/choiceListHelper");
const { cli } = require("cli-ux");
const Table = require("cli-table3");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const chalk = require("chalk");

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

    fs.readFile(pathString, `utf8`, async (err, data) => {
      if (err) {
        console.log(
          "You are not logged in, please login first using the login command..."
        );
      } else {
        await loginHelper(
          data,
          flags,
          pathString,
          statsChoiceList,
          async (data, game) => {
            cli.action.stop();
            if (game === "br") {
              const br = data.lifetime.mode["br"].properties;
              if (flags.write) {
                this.writeCsv(br, "br", data.username);
              }
              console.log(this.createTable(br, "BATTLE ROYALE"));
            } else if (game === "plunder") {
              const br_dmz = data["lifetime"].mode["br_dmz"].properties;
              if (flags.write) {
                this.writeCsv(br_dmz, "plunder", data.username);
              }
              console.log(this.createTable(br_dmz, "PLUNDER"));
            } else if (game === "weekly stats") {
              let weeklyData = data["weekly"].mode["br_all"].properties;
              console.log(this.createWeeklyTable(weeklyData));
              if (flags.write) {
                console.log(
                  chalk.red("Writing is only supported in BR and Plunder")
                );
              }
            }
          }
        );
      }
    });
  }

  createTable(gameData, gameType) {
    const table = new Table();
    const {
      topFive,
      timePlayed,
      kills,
      downs,
      topTen,
      deaths,
      kdRatio,
      scorePerMinute,
      wins,
    } = gameData;
    table.push(
      [
        {
          content: chalk.greenBright(gameType),
          colSpan: 2,
          hAlign: "center",
        },
      ],
      { Wins: wins },
      { "Top 10": topTen },
      { "Top 5": topFive },
      { Kills: kills },
      { Downs: downs },
      { Deaths: deaths },
      { "K-D Ratio": kdRatio.toFixed(2) },
      { "Scores per Minute": scorePerMinute.toFixed(2) },
      {
        "Time Played": `${(timePlayed / 3600).toFixed(2)} hours`,
      }
    );
    return table.toString();
  }

  writeCsv(data, gameType, battletag) {
    const csvWriter = createCsvWriter({
      pathString: `${__dirname}/${battletag}_${gameType}.csv"`,
      header: this.csvHeader,
      append: true,
    });
    data.timestamp = new Date().toISOString();
    csvWriter.writeRecords([data]).then((_) => {
      console.log("Written CSV file");
    });
  }

  createWeeklyTable(weeklyData) {
    const table = new Table();
    const {
      objectiveTeamWiped,
      kdRatio,
      deaths,
      killsPerGame,
      headshots,
      assists,
      timePlayed,
      headshotPercentage,
      objectiveLastStandKill,
      objectiveReviver,
      executions,
      matchesPlayed,
      gulagDeaths,
      gulagKills,
    } = weeklyData;
    table.push(
      [{ content: chalk.green("WEEKLY DATA"), colSpan: 2, hAlign: "center" }],
      { "Matches Played": matchesPlayed },
      { Headshots: headshots },
      { Executions: executions },
      {
        "Headshot Percentage": `${(headshotPercentage * 100).toFixed(2)}%`,
      },
      { "K-D Ratio": kdRatio.toFixed(2) },
      { "Average Kills per Game": killsPerGame.toFixed(0) },
      { Assists: assists },
      { Deaths: deaths },
      { "Gulag Kills": gulagKills },
      { "Gulag Deaths": gulagDeaths },
      { "Teams Wiped": objectiveTeamWiped },
      { "Last Stand Kills": objectiveLastStandKill },
      { "Revived Teammates": `${objectiveReviver} times` },
      { "Time Played": `${(timePlayed / 3600).toFixed(2)} hours` }
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
  help: flags.help({ char: "h" }),
};
module.exports = StatsCommand;
