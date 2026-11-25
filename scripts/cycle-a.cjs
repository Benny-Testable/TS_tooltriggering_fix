// Planted circular require for madge (which scans js, mjs and cjs files).
const cycleB = require("./cycle-b.cjs");

module.exports = {
  name: "cycle-a",
  describe() {
    return module.exports.name + ">" + cycleB.name;
  },
};
