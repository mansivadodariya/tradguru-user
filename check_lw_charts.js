const lw = require('lightweight-charts');
console.log("lightweight-charts exports:", Object.keys(lw));
if (lw.createChart) {
    console.log("createChart is present.");
}
