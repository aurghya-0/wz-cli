wz-cli
======

Warzone stats from the comfort of your console

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@aurghyadip/wz-cli.svg)](https://npmjs.org/package/wz-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@aurghyadip/wz-cli.svg)](https://npmjs.org/package/wz-cli)
[![License](https://img.shields.io/npm/l/@aurghyadip/wz-cli.svg)](https://github.com/aurghya-0/wz-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @aurghyadip/wz-cli
$ wz COMMAND
running command...
$ wz (-v|--version|version)
@aurghyadip/wz-cli/0.2.2 darwin-x64 node-v14.3.0
$ wz --help [COMMAND]
USAGE
  $ wz COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`wz help [COMMAND]`](#wz-help-command)
* [`wz stats`](#wz-stats)

## `wz help [COMMAND]`

display help for wz

```
USAGE
  $ wz help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.0.1/src/commands/help.ts)_

## `wz stats`

WarZone multiplayer stats

```
USAGE
  $ wz stats

OPTIONS
  -d, --delete  Deletes the config file
  -h, --help    show CLI help
  -w, --write   Write the data to a csv file
```

_See code: [src/commands/stats.js](https://github.com/aurghya-0/wz-cli/blob/v0.2.2/src/commands/stats.js)_
<!-- commandsstop -->
