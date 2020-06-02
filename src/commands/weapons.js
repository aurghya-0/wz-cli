const {Command, flags} = require('@oclif/command')

class WeaponsCommand extends Command {
  async run() {
    const {flags} = this.parse(WeaponsCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from /Users/aurghyadip/NodeProjects/@aurghyadip/wz-cli/src/commands/weapons.js`)
  }
}

WeaponsCommand.description = `Describe the command here
...
Extra documentation goes here
`

WeaponsCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = WeaponsCommand
