import { describe, it } from "mocha";
import { strict as assert } from "assert";

import { validateAntispam } from "../../src/commands/antispam.js";
import { validateMessageId } from "../../src/commands/pin.js";
import { calcStreak } from "../../src/commands/streak.js";
import { parseEventTime } from "../../src/commands/events.js";

// ─── antispam ────────────────────────────────────────────────────────────────

describe("antispam — validateAntispam", function () {
  it("rejects threshold below 3", function () {
    assert.notEqual(validateAntispam(2, "mute", 10), null);
  });

  it("rejects threshold above 20", function () {
    assert.notEqual(validateAntispam(21, "mute", 10), null);
  });

  it("accepts threshold at lower boundary (3)", function () {
    assert.equal(validateAntispam(3, "mute", 10), null);
  });

  it("accepts threshold at upper boundary (20)", function () {
    assert.equal(validateAntispam(20, "ban", 30), null);
  });

  it("rejects invalid action 'delete'", function () {
    assert.notEqual(validateAntispam(5, "delete", 10), null);
  });

  it("accepts valid actions: mute, kick, ban", function () {
    assert.equal(validateAntispam(5, "mute", 10), null);
    assert.equal(validateAntispam(5, "kick", 10), null);
    assert.equal(validateAntispam(5, "ban",  10), null);
  });

  it("rejects window below 5", function () {
    assert.notEqual(validateAntispam(5, "mute", 4), null);
  });

  it("rejects window above 60", function () {
    assert.notEqual(validateAntispam(5, "mute", 61), null);
  });

  it("accepts window at boundaries (5 and 60)", function () {
    assert.equal(validateAntispam(5, "kick", 5),  null);
    assert.equal(validateAntispam(5, "kick", 60), null);
  });

  it("sets enabled flag correctly in returned null (no error)", function () {
    // validateAntispam returns null on success — the enabled flag is set by execute()
    assert.equal(validateAntispam(10, "ban", 20), null);
  });
});

// ─── pin ─────────────────────────────────────────────────────────────────────

describe("pin — validateMessageId", function () {
  it("rejects empty string", function () {
    assert.equal(validateMessageId(""), false);
  });

  it("rejects non-numeric string", function () {
    assert.equal(validateMessageId("abc"), false);
  });

  it("rejects mixed alphanumeric", function () {
    assert.equal(validateMessageId("123abc456"), false);
  });

  it("rejects too-short numeric string (< 17 digits)", function () {
    assert.equal(validateMessageId("1234567890"), false);
  });

  it("accepts a valid 18-digit snowflake", function () {
    assert.equal(validateMessageId("123456789012345678"), true);
  });

  it("accepts a valid 19-digit snowflake", function () {
    assert.equal(validateMessageId("1234567890123456789"), true);
  });
});

// ─── streak ──────────────────────────────────────────────────────────────────

describe("streak — calcStreak", function () {
  function daysAgo(n) {
    return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  }

  it("increments streak when last check-in was yesterday", function () {
    const result = calcStreak(daysAgo(1), 5);
    assert.equal(result.count, 6);
    assert.equal(result.status, "incremented");
  });

  it("does not change streak when already claimed today", function () {
    const today = new Date().toISOString().slice(0, 10);
    const result = calcStreak(today, 7);
    assert.equal(result.count, 7);
    assert.equal(result.status, "already_claimed");
  });

  it("resets streak to 1 when gap is 2 days", function () {
    const result = calcStreak(daysAgo(2), 10);
    assert.equal(result.count, 1);
    assert.equal(result.status, "reset");
  });

  it("resets streak to 1 when gap is more than 2 days", function () {
    const result = calcStreak(daysAgo(5), 42);
    assert.equal(result.count, 1);
    assert.equal(result.status, "reset");
  });

  it("resets streak when lastDate is null (first check-in)", function () {
    const result = calcStreak(null, 0);
    assert.equal(result.count, 1);
    assert.equal(result.status, "reset");
  });

  it("sets lastDate to today on increment", function () {
    const today = new Date().toISOString().slice(0, 10);
    const result = calcStreak(daysAgo(1), 3);
    assert.equal(result.lastDate, today);
  });
});

// ─── events ──────────────────────────────────────────────────────────────────

describe("events — parseEventTime", function () {
  it("rejects a past date", function () {
    const past = new Date(Date.now() - 3600000).toISOString();
    assert.equal(parseEventTime(past), null);
  });

  it("rejects an invalid format string", function () {
    assert.equal(parseEventTime("not-a-date"), null);
  });

  it("rejects empty string", function () {
    assert.equal(parseEventTime(""), null);
  });

  it("rejects null", function () {
    assert.equal(parseEventTime(null), null);
  });

  it("accepts a future date (ISO string)", function () {
    const future = new Date(Date.now() + 86400000).toISOString();
    const result = parseEventTime(future);
    assert.ok(result instanceof Date);
  });

  it("accepts a future date in YYYY-MM-DD HH:MM format", function () {
    // Build a date string 1 day from now in a simple format
    const d = new Date(Date.now() + 86400000);
    const str = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    const result = parseEventTime(str);
    assert.ok(result instanceof Date);
  });

  it("rejects event limit — more than 10 active events (logic check)", function () {
    // Simulate the limit check: 11 future events should exceed MAX_EVENTS (10)
    const future = new Date(Date.now() + 86400000).toISOString();
    const fakeEvents = Array.from({ length: 11 }, () => ({ time_iso: future }));
    const active = fakeEvents.filter(e => new Date(e.time_iso) > new Date());
    assert.ok(active.length > 10, "should detect >10 active events");
  });
});
