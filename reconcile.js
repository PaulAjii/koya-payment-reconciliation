// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

const latestByTxn = new Map();
const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);
let event;

for (const line of lines) {
  if (!line.trim()) continue;

  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (!event.txn_id) continue;

  const previous = latestByTxn.get(event.txn_id);
  if (!previous || Date.parse(event.ts) >= Date.parse(previous.ts)) {
    latestByTxn.set(event.txn_id, event);
  }
}

for (const event of latestByTxn.values()) {
  if (event.status === "success") {
      const cleanNum = Number(String(event.amount).replaceAll(",", "").trim());
      total += cleanNum;
      count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
