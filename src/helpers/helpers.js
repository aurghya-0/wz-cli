const fs = require("fs");
const keytar = require("keytar");
const SERVICE_NAME = "wz-cli";

module.exports = {
  loginHelper: async (data, flags, path, callback) => {
    let config = JSON.parse(data);
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
      let password = await keytar.getPassword(SERVICE_NAME, config.username);
      await callback(config.username, password);
    } catch (e) {
      console.log(e);
    }
  },
};
