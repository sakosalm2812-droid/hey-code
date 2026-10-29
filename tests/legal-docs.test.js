import { test } from "node:test";
import assert from "node:assert/strict";

import {
  privacySections,
  termsSections,
  cookiesSections,
  dpaSections,
  legalUpdatedAt,
} from "../src/lib/legalDocs.js";

const toObject = (sections) => Object.fromEntries(sections);

test("legal docs are dated and cover the launch-gap topics", () => {
  assert.ok(legalUpdatedAt, "legalUpdatedAt must be set");

  const privacy = toObject(privacySections);
  assert.ok(privacy["At a glance"], "privacy has an at-a-glance summary");
  assert.ok(privacy["Data export and deletion"], "privacy describes self-serve export/deletion");
  assert.ok(privacy["Children and age"], "privacy covers children and age");
  assert.match(privacy["Children and age"], /13/, "children section mentions the 13 threshold");
  assert.match(privacy["Data export and deletion"], /Export my data/, "privacy links export to the settings action");
  assert.match(privacy["Data export and deletion"], /Delete account/, "privacy links deletion to the settings action");
  assert.match(privacy["Data export and deletion"], /permanent/, "privacy warns deletion is permanent");
  assert.match(privacy["Cookies and local storage"], /no tracking|tracking cookies|does not use advertising/i, "privacy truthfully scopes cookies");
  assert.match(privacy["International transfers"], /SCC|Standard Contractual Clauses/i, "privacy covers transfers");

  const terms = toObject(termsSections);
  assert.ok(terms["Eligibility"], "terms has an eligibility section");
  assert.match(terms["Eligibility"], /13/, "terms sets the 13+ eligibility");
  assert.match(terms["Data export and deletion"], /Delete your account|Settings \u2192 Account & data/, "terms mirrors self-serve controls");

  const cookies = toObject(cookiesSections);
  assert.match(cookies["What HEY uses"], /does not set advertising, tracking or analytics cookies/i, "cookies doc makes the no-tracking statement");
  assert.match(cookies["What HEY uses"], /local storage|localStorage/i, "cookies doc discloses local storage");

  const dpa = toObject(dpaSections);
  assert.ok(dpa["Roles and responsibilities"], "dpa covers roles");
  assert.match(dpa["International transfers"], /2021\/914|Standard Contractual Clauses/i, "dpa covers SCC transfers");
  assert.ok(dpa["Data-subject rights"], "dpa covers data-subject rights");
  assert.match(dpa["Not legal advice"], /legal advice/i, "dpa carries the disclaimer");
});

test("every section body is a non-empty string or array of strings", () => {
  for (const sections of [privacySections, termsSections, cookiesSections, dpaSections]) {
    for (const [heading, body] of sections) {
      assert.ok(heading.trim(), "sections have headings");
      assert.ok(body, `section ${heading} has a body`);
      if (Array.isArray(body)) {
        assert.ok(body.length > 0, `bulleted section ${heading} is not empty`);
        for (const line of body) assert.equal(typeof line, "string");
      } else {
        assert.equal(typeof body, "string");
      }
    }
  }
});