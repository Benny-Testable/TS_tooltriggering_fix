// Second half of the planted circular require.
const cycleA = require("./cycle-a.cjs");

module.exports = {
  name: "cycle-b",
  describe() {
    return module.exports.name + "<" + cycleA.name;
  },
};
