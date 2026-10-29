const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({
  URL,
  window: {},
  document: { querySelectorAll: () => [] }
});
for (const file of ["scripts/app-utils.js", "scripts/videos.js"]) {
  vm.runInContext(readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}
const utils = context.window.BOILED_UTILS;
const media = {
  id: "fixture",
  embedUrl: "https://public.example/embed/fr",
  sourceUrl: "https://public.example/fr",
  sources: {
    FR: [
      { sourceId: "public", embedUrl: "https://public.example/embed/fr" },
      { sourceId: "premium", access: "premium", sourceUrl: "https://premium.example/film" }
    ],
    EN: { sourceUrl: "" }
  }
};

test("sélection premium : aucun lecteur public hérité", () => {
  const selected = utils.getPlaybackSource(media, "fr", "premium");
  assert.equal(selected.access, "premium");
  assert.equal(selected.sourceUrl, "https://premium.example/film");
  assert.equal(selected.embedUrl, "");
  assert.equal(selected.videoUrl, "");
  assert.equal(selected.id, media.id);
});

test("langue absente ou source vide : aucun repli vers une autre langue", () => {
  for (const language of ["EN", "JP"]) {
    const selected = utils.getPlaybackSource(media, language);
    assert.equal(selected.embedUrl, "");
    assert.equal(selected.sourceUrl, "");
  }
});

test("identifiant inconnu : première source de la langue choisie", () => {
  assert.equal(utils.getPlaybackSource(media, "FR", "unknown").sourceId, "public");
});

test("tableau de sources : plusieurs hébergeurs pour une même langue", () => {
  const item = { sources: [
    { language: "FR", sourceId: "one", sourceUrl: "https://one.example/film" },
    { language: "fr", sourceId: "two", sourceUrl: "https://two.example/film" },
    { language: "EN", sourceUrl: "https://english.example/film" }
  ] };
  assert.equal(utils.getSourceOptions(item, "FR").length, 2);
  assert.equal(utils.getPlaybackSource(item, "FR", "two").sourceUrl, "https://two.example/film");
});

test("une alternative disponible suffit pour sa langue", () => {
  const available = { sources: { FR: [{ sourceUrl: "" }, { sourceUrl: "https://one.example/film" }] } };
  assert.equal(utils.hasPlayableSource(available), true);
  assert.equal(utils.hasMissingPlayableSource(available), false);
  assert.equal(utils.hasMissingPlayableSource({ sources: { FR: [{ sourceUrl: "" }] } }), true);
});

test("le catalogue refuse les liens blob, les protocoles actifs et les identifiants dans les URL", () => {
  for (const url of ["blob:https://example.com/session", "javascript:alert(1)", "data:video/mp4,test", "https://user:secret@example.com/film", "not-a-url"]) {
    assert.equal(utils.getSafeSourceUrl(url), "");
    assert.equal(utils.hasPlayableSource({ videoUrl: url }), false);
  }
});

test("les sources French Stream utilisent les domaines actuels", () => {
  assert.deepEqual(
    Array.from(context.window.BOILED_UTILS.sourceDirectory, (source) => source.url),
    ["https://french-stream.net/", "https://fs26.lol/", "https://fs27.lol/"]
  );
});

test("les anciens films et épisodes conservent leurs sources valides", () => {
  const catalogue = [...context.window.BOILED_VIDEOS, ...context.window.BOILED_EPISODES];
  assert.ok(catalogue.length > 100);
  const ids = new Set();
  for (const item of catalogue) {
    assert.equal(ids.has(item.id), false, `id dupliqué : ${item.id}`);
    ids.add(item.id);
    const languages = utils.getVideoLanguages(item);
    for (const language of languages.length ? languages : [""]) {
      const sourceIds = new Set();
      for (const option of utils.getSourceOptions(item, language)) {
        assert.equal(sourceIds.has(option.sourceId), false, `${item.id} ${language} : sourceId dupliqué`);
        sourceIds.add(option.sourceId);
        const resolved = utils.getPlaybackSource(item, language, option.sourceId);
        for (const field of ["embedUrl", "videoUrl"]) {
          assert.equal(resolved[field], utils.getSafeSourceUrl(option[field]), `${item.id} ${language} ${field}`);
        }
      }
    }
  }
  const nobody = catalogue.find((item) => item.id === "nobody-2021");
  assert.equal(nobody.access, undefined);
  assert.equal(utils.getSourceOptions(nobody, "FR").length, 1);
  assert.equal(utils.getPlaybackSource(nobody, "FR").access, "public");
  assert.equal(utils.getPlaybackSource(nobody, "FR").embedUrl, "https://vidzy.lol/embed-nesqwbdro8kt.html");
  assert.equal(utils.hasMissingPlayableSource(nobody), false);
  assert.equal(catalogue.find((item) => item.id === "nobody-2").sourceName, "Universal Pictures");
});
