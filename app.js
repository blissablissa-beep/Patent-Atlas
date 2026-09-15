"use strict";

const CONFIG = Object.freeze({
  indexUrl: "./data/index.json",
  serviceWorkerUrl: "./sw.js",
  baseLanguages: ["ja", "en"],
  defaultLanguage: "ja",
  storage: {
    language: "patent_atlas_language",
    favorites: "patent_atlas_favorites",
    notesPrefix: "patent_atlas_notes_"
  }
});

const UI_TEXT = {
  ja: {
    appSubtitle: "各国特許制度ガイド",
    install: "インストール",
    searchLabel: "国・制度・FAQを検索",
    searchPlaceholder: "国・制度・FAQを検索",
    regionLabel: "地域",
    regionAll: "すべて",
    regionRegional: "地域制度",
    regionAsia: "アジア",
    regionEurope: "欧州",
    regionNorthAmerica: "北米",
    regionLatinAmerica: "中南米",
    regionMiddleEast: "中東",
    regionAfrica: "アフリカ",
    regionOceania: "オセアニア",
    favoritesOnly: "お気に入りのみ",
    jurisdictions: "国・地域",
    noSearchResults: "条件に一致する国・地域がありません。",
    loading: "データを読み込んでいます…",
    loadErrorTitle: "データを読み込めませんでした",
    loadErrorBody:
      "通信状態またはデータファイルの配置を確認してください。",
    retry: "再読み込み",
    welcomeTitle: "国・地域を選択してください",
    welcomeBody:
      "出願、審査、登録後の維持、無効・権利行使まで、各法域の特許実務を確認できます。",
    featureBilingual: "日英表示",
    featureOffline: "オフライン対応",
    featureNotes: "端末内メモ",
    quickView: "クイックビュー",
    matterNotes: "案件・面談メモ",
    savedOnDevice: "この端末に保存",
    notesPlaceholder:
      "現地代理人への確認事項や案件メモを入力",
    notesSaved: "保存しました",
    sources: "出典・参考資料",
    noSources: "出典はまだ登録されていません。",
    updated: "更新",
    disclaimer:
      "本アプリは実務上の概要確認を目的とします。個別案件では、最新の公式資料および現地代理人の見解を確認してください。",
    addFavorite: "お気に入りに追加",
    removeFavorite: "お気に入りから削除",
    openJurisdictions: "国・地域一覧を開く",
    closeJurisdictions: "国・地域一覧を閉じる",
    country: "国別制度",
    regionalSystem: "地域制度",
    statusDraft: "調査中",
    statusReview: "要確認",
    statusReviewed: "確認済み",
    unknownStatus: "状態未設定",
    notAvailable: "情報なし",
    sourceLanguage: "言語",
    sourceAccessed: "確認日",
    sourceUpdated: "資料更新日",
    invalidRecord:
      "国別データの形式が正しくありません。",
    recordNotFound:
      "指定された国・地域は登録されていません。",
    recordLoadFailed:
      "国別データを読み込めませんでした。"
  },

  en: {
    appSubtitle: "Patent systems by jurisdiction",
    install: "Install",
    searchLabel:
      "Search jurisdictions, rules and FAQs",
    searchPlaceholder:
      "Search jurisdictions, rules and FAQs",
    regionLabel: "Region",
    regionAll: "All",
    regionRegional: "Regional systems",
    regionAsia: "Asia",
    regionEurope: "Europe",
    regionNorthAmerica: "North America",
    regionLatinAmerica: "Latin America",
    regionMiddleEast: "Middle East",
    regionAfrica: "Africa",
    regionOceania: "Oceania",
    favoritesOnly: "Favorites only",
    jurisdictions: "Jurisdictions",
    noSearchResults:
      "No jurisdictions match the selected filters.",
    loading: "Loading data…",
    loadErrorTitle: "Unable to load data",
    loadErrorBody:
      "Check the connection and the location of the data files.",
    retry: "Reload",
    welcomeTitle: "Select a jurisdiction",
    welcomeBody:
      "Review patent practice from filing and examination through maintenance, invalidity and enforcement.",
    featureBilingual: "Japanese and English",
    featureOffline: "Offline ready",
    featureNotes: "On-device notes",
    quickView: "Quick view",
    matterNotes: "Matter and meeting notes",
    savedOnDevice: "Saved on this device",
    notesPlaceholder:
      "Add matter notes or questions for local counsel",
    notesSaved: "Saved",
    sources: "Sources and references",
    noSources: "No sources have been added yet.",
    updated: "Updated",
    disclaimer:
      "This app provides a practical overview only. For individual matters, verify the latest official materials and consult local counsel.",
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
    openJurisdictions: "Open jurisdiction list",
    closeJurisdictions: "Close jurisdiction list",
    country: "National system",
    regionalSystem: "Regional system",
    statusDraft: "Research in progress",
    statusReview: "Review required",
    statusReviewed: "Reviewed",
    unknownStatus: "Status not set",
    notAvailable: "Not available",
    sourceLanguage: "Language",
    sourceAccessed: "Accessed",
    sourceUpdated: "Updated",
    invalidRecord:
      "The jurisdiction data has an invalid format.",
    recordNotFound:
      "The requested jurisdiction is not registered.",
    recordLoadFailed:
      "Unable to load the jurisdiction data."
  }
};

const LANGUAGE_NAMES = {
  ja: {
    ja: "日本語",
    en: "Japanese"
  },
  en: {
    ja: "英語",
    en: "English"
  },
  de: {
    ja: "ドイツ語",
    en: "Deutsch"
  },
  it: {
    ja: "イタリア語",
    en: "Italiano"
  },
  fr: {
    ja: "フランス語",
    en: "Français"
  },
  es: {
    ja: "スペイン語",
    en: "Español"
  },
  pt: {
    ja: "ポルトガル語",
    en: "Português"
  },
  ko: {
    ja: "韓国語",
    en: "한국어"
  },
  zh: {
    ja: "中国語",
    en: "中文"
  }
};

const state = {
  index: null,
  entries: [],
  records: new Map(),
  selectedId: null,
  language: readStoredLanguage(),
  region: "all",
  query: "",
  favoritesOnly: false,
  favorites: readStoredSet(
    CONFIG.storage.favorites
  ),
  installPrompt: null,
  noteTimer: null,
  requestSerial: 0
};

const elements = {};

document.addEventListener(
  "DOMContentLoaded",
  initialize
);

async function initialize() {
  collectElements();
  bindEvents();
  applyInterfaceLanguage();
  updateLanguageButtons();
  registerServiceWorker();
  await loadIndex();
}

function collectElements() {
  const ids = [
    "sidebar-toggle",
    "sidebar",
    "sidebar-backdrop",
    "search-input",
    "search-clear",
    "region-filter",
    "favorites-only",
    "jurisdiction-count",
    "jurisdiction-list",
    "list-empty",
    "loading-view",
    "error-view",
    "error-message",
    "retry-button",
    "welcome-view",
    "detail-view",
    "detail-type",
    "detail-title",
    "detail-office",
    "favorite-button",
    "record-status",
    "record-updated",
    "quick-view-grid",
    "section-navigation",
    "detail-sections",
    "matter-notes",
    "notes-status",
    "source-list",
    "optional-language-buttons",
    "install-button",
    "jurisdiction-item-template",
    "fact-row-template"
  ];

  for (const id of ids) {
    const element = document.getElementById(id);

    if (!element) {
      throw new Error(
        `Required element not found: #${id}`
      );
    }

    elements[toCamelCase(id)] = element;
  }

  elements.languageButtons = Array.from(
    document.querySelectorAll(
      ".language-button[data-language]"
    )
  );
}

function bindEvents() {
  elements.searchInput.addEventListener(
    "input",
    handleSearchInput
  );

  elements.searchClear.addEventListener(
    "click",
    clearSearch
  );

  elements.regionFilter.addEventListener(
    "change",
    () => {
      state.region = elements.regionFilter.value;
      renderJurisdictionList();
    }
  );

  elements.favoritesOnly.addEventListener(
    "change",
    () => {
      state.favoritesOnly =
        elements.favoritesOnly.checked;

      renderJurisdictionList();
    }
  );

  for (const button of elements.languageButtons) {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.language);
    });
  }

  elements.optionalLanguageButtons.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-language]"
      );

      if (button) {
        setLanguage(button.dataset.language);
      }
    }
  );

  elements.retryButton.addEventListener(
    "click",
    loadIndex
  );

  elements.favoriteButton.addEventListener(
    "click",
    toggleSelectedFavorite
  );

  elements.matterNotes.addEventListener(
    "input",
    scheduleNoteSave
  );

  elements.sidebarToggle.addEventListener(
    "click",
    toggleSidebar
  );

  elements.sidebarBackdrop.addEventListener(
    "click",
    closeSidebar
  );

  elements.installButton.addEventListener(
    "click",
    installApp
  );

  window.addEventListener(
    "hashchange",
    handleRoute
  );

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closeSidebar();
    }
  });

  window.addEventListener(
    "beforeinstallprompt",
    event => {
      event.preventDefault();
      state.installPrompt = event;
      elements.installButton.hidden = false;
    }
  );

  window.addEventListener("appinstalled", () => {
    state.installPrompt = null;
    elements.installButton.hidden = true;
  });
}

async function loadIndex() {
  setView("loading");

  elements.errorMessage.textContent =
    t("loadErrorBody");

  try {
    const response = await fetch(
      CONFIG.indexUrl,
      {
        cache: "no-cache"
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    validateIndex(data);

    state.index = data;
    state.entries = data.jurisdictions.slice();

    document.documentElement.dataset.dataVersion =
      data.version || "";

    renderJurisdictionList();
    await handleRoute();
  } catch (error) {
    console.error(
      "Patent Atlas index load failed:",
      error
    );

    showError(
      `${t("loadErrorBody")} (${error.message})`
    );
  }
}

function validateIndex(data) {
  if (
    !data ||
    !Array.isArray(data.jurisdictions)
  ) {
    throw new TypeError(
      "data/index.json must contain a jurisdictions array"
    );
  }

  const ids = new Set();

  for (const entry of data.jurisdictions) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !entry.file
    ) {
      throw new TypeError(
        "Each index entry requires id and file"
      );
    }

    if (ids.has(entry.id)) {
      throw new TypeError(
        `Duplicate jurisdiction id: ${entry.id}`
      );
    }

    ids.add(entry.id);
  }
}

async function handleRoute() {
  if (!state.index) {
    return;
  }

  const selectedId = getIdFromHash();

  if (!selectedId) {
    state.selectedId = null;
    renderOptionalLanguageButtons(null);
    renderJurisdictionList();
    setView("welcome");
    closeSidebar();
    return;
  }

  const entry = getEntry(selectedId);

  if (!entry) {
    state.selectedId = null;
    renderJurisdictionList();
    showError(t("recordNotFound"));
    return;
  }

  await openJurisdiction(entry);
}

async function openJurisdiction(entry) {
  const requestId = ++state.requestSerial;

  state.selectedId = entry.id;

  renderJurisdictionList();
  setView("loading");
  closeSidebar();

  try {
    const record = await loadRecord(entry);

    if (requestId !== state.requestSerial) {
      return;
    }

    validateRecord(record, entry.id);
    state.records.set(entry.id, record);

    ensureAvailableLanguage(record);
    applyInterfaceLanguage();
    renderOptionalLanguageButtons(record);
    renderDetail(record);
    setView("detail");

    document.title =
      `${localize(record.names)} | Patent Atlas`;
  } catch (error) {
    if (requestId !== state.requestSerial) {
      return;
    }

    console.error(
      `Patent Atlas record load failed (${entry.id}):`,
      error
    );

    showError(
      `${t("recordLoadFailed")} (${error.message})`
    );
  }
}

async function loadRecord(entry) {
  if (state.records.has(entry.id)) {
    return state.records.get(entry.id);
  }

  const response = await fetch(
    resolveDataPath(entry.file),
    {
      cache: "no-cache"
    }
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

function validateRecord(record, expectedId) {
  if (!record || record.id !== expectedId) {
    throw new TypeError(t("invalidRecord"));
  }

  if (
    !record.names ||
    !Array.isArray(record.sections)
  ) {
    throw new TypeError(t("invalidRecord"));
  }
}

function renderJurisdictionList() {
  if (!state.index) {
    return;
  }

  const fragment =
    document.createDocumentFragment();

  const visibleEntries = state.entries
    .filter(matchesCurrentFilters)
    .sort(compareEntries);

  elements.jurisdictionList.replaceChildren();

  for (const entry of visibleEntries) {
    const item =
      elements.jurisdictionItemTemplate
        .content
        .cloneNode(true);

    const link = item.querySelector(
      ".jurisdiction-link"
    );

    const flag = item.querySelector(
      ".jurisdiction-flag"
    );

    const name = item.querySelector(
      ".jurisdiction-name"
    );

    const office = item.querySelector(
      ".jurisdiction-office"
    );

    const favorite = item.querySelector(
      ".jurisdiction-favorite"
    );

    link.href =
      `#/jurisdiction/${encodeURIComponent(entry.id)}`;

    link.dataset.jurisdictionId = entry.id;

    flag.textContent =
      entry.flag ||
      (entry.type === "regional" ? "◆" : "○");

    name.textContent =
      localize(entry.names);

    office.textContent =
      localize(entry.office);

    favorite.textContent =
      state.favorites.has(entry.id)
        ? "★"
        : "";

    if (entry.id === state.selectedId) {
      link.classList.add("is-active");

      link.setAttribute(
        "aria-current",
        "page"
      );
    }

    fragment.append(item);
  }

  elements.jurisdictionList.append(fragment);

  elements.jurisdictionCount.textContent =
    String(visibleEntries.length);

  elements.listEmpty.hidden =
    visibleEntries.length !== 0;
}

function matchesCurrentFilters(entry) {
  if (
    state.region !== "all" &&
    entry.region !== state.region
  ) {
    return false;
  }

  if (
    state.favoritesOnly &&
    !state.favorites.has(entry.id)
  ) {
    return false;
  }

  const query =
    normalizeSearchText(state.query);

  if (!query) {
    return true;
  }

  return buildSearchText(entry).includes(query);
}

function buildSearchText(entry) {
  const record =
    state.records.get(entry.id);

  const values = [
    entry.id,
    entry.type,
    entry.region,
    flattenText(entry.names),
    flattenText(entry.office),
    flattenText(entry.searchTerms)
  ];

  if (record) {
    values.push(
      flattenText(record.names),
      flattenText(record.office),
      flattenText(record.quickView),
      flattenText(record.sections)
    );
  }

  return normalizeSearchText(
    values.join(" ")
  );
}

function compareEntries(a, b) {
  const orderA = Number.isFinite(a.order)
    ? a.order
    : Number.MAX_SAFE_INTEGER;

  const orderB = Number.isFinite(b.order)
    ? b.order
    : Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return localize(a.names).localeCompare(
    localize(b.names),
    state.language
  );
}

function renderDetail(record) {
  elements.detailType.textContent =
    record.type === "regional"
      ? t("regionalSystem")
      : t("country");

  elements.detailTitle.textContent =
    localize(record.names);

  elements.detailOffice.textContent =
    localize(record.office);

  renderStatus(record.status);
  renderDate(
    elements.recordUpdated,
    record.updatedAt
  );

  renderFavoriteButton();
  renderQuickView(record.quickView || []);
  renderSections(record.sections || []);
  renderSources(record.sources || []);
  loadNotes(record.id);
}

function renderStatus(status = "draft") {
  const normalized = [
    "draft",
    "review",
    "reviewed"
  ].includes(status)
    ? status
    : "unknown";

  const labels = {
    draft: t("statusDraft"),
    review: t("statusReview"),
    reviewed: t("statusReviewed"),
    unknown: t("unknownStatus")
  };

  elements.recordStatus.className =
    `status-badge status-${normalized}`;

  elements.recordStatus.dataset.status =
    normalized;

  elements.recordStatus.textContent =
    labels[normalized];
}

function renderQuickView(items) {
  const fragment =
    document.createDocumentFragment();

  elements.quickViewGrid.replaceChildren();

  for (const fact of items) {
    if (!hasLocalizedContent(fact.value)) {
      continue;
    }

    const row =
      elements.factRowTemplate
        .content
        .cloneNode(true);

    const label =
      row.querySelector(".fact-label");

    const value =
      row.querySelector(".fact-value");

    label.textContent =
      localize(fact.label) ||
      fact.key ||
      "";

    renderContent(
      value,
      localizeRaw(fact.value)
    );

    fragment.append(row);
  }

  elements.quickViewGrid.append(fragment);
}

function renderSections(sections) {
  const sectionFragment =
    document.createDocumentFragment();

  const navigationFragment =
    document.createDocumentFragment();

  elements.detailSections.replaceChildren();
  elements.sectionNavigation.replaceChildren();

  for (
    const [index, sectionData]
    of sections.entries()
  ) {
    const sectionId = makeSectionId(
      sectionData.id ||
      `section-${index + 1}`
    );

    const title =
      localize(sectionData.title);

    const facts =
      Array.isArray(sectionData.facts)
        ? sectionData.facts
        : [];

    const visibleFacts =
      facts.filter(fact =>
        hasLocalizedContent(fact.value)
      );

    if (!title || visibleFacts.length === 0) {
      continue;
    }

    const navLink =
      document.createElement("a");

    navLink.href = `#${sectionId}`;
    navLink.textContent = title;

    navLink.addEventListener(
      "click",
      event => {
        event.preventDefault();

        document
          .getElementById(sectionId)
          ?.scrollIntoView({
            behavior: "smooth"
          });
      }
    );

    navigationFragment.append(navLink);

    const section =
      document.createElement("section");

    section.className = "record-section";
    section.id = sectionId;

    section.setAttribute(
      "aria-labelledby",
      `${sectionId}-heading`
    );

    const headingWrap =
      document.createElement("div");

    headingWrap.className =
      "section-heading";

    const heading =
      document.createElement("h2");

    heading.id =
      `${sectionId}-heading`;

    heading.textContent = title;

    headingWrap.append(heading);

    const list =
      document.createElement("dl");

    list.className = "facts-list";

    for (const fact of visibleFacts) {
      list.append(createFactRow(fact));
    }

    section.append(
      headingWrap,
      list
    );

    sectionFragment.append(section);
  }

  elements.sectionNavigation.append(
    navigationFragment
  );

  elements.detailSections.append(
    sectionFragment
  );

  elements.sectionNavigation.hidden =
    elements.sectionNavigation
      .childElementCount === 0;
}

function createFactRow(fact) {
  const row =
    elements.factRowTemplate
      .content
      .firstElementChild
      .cloneNode(true);

  const label =
    row.querySelector(".fact-label");

  const value =
    row.querySelector(".fact-value");

  label.textContent =
    localize(fact.label) ||
    fact.key ||
    "";

  renderContent(
    value,
    localizeRaw(fact.value)
  );

  const note =
    localizeRaw(fact.note);

  if (hasContent(note)) {
    value.append(
      createCallout(
        note,
        "fact-note"
      )
    );
  }

  const practicalNote =
    localizeRaw(fact.practicalNote);

  if (hasContent(practicalNote)) {
    value.append(
      createCallout(
        practicalNote,
        "practical-note"
      )
    );
  }

  const caution =
    localizeRaw(fact.caution);

  if (hasContent(caution)) {
    value.append(
      createCallout(
        caution,
        "caution-note"
      )
    );
  }

  const tags =
    localizeRaw(fact.tags);

  if (
    Array.isArray(tags) &&
    tags.length
  ) {
    value.append(
      createTagList(tags)
    );
  }

  return row;
}

function renderContent(container, content) {
  container.replaceChildren();

  if (!hasContent(content)) {
    container.textContent =
      t("notAvailable");

    return;
  }

  if (
    typeof content === "string" ||
    typeof content === "number" ||
    typeof content === "boolean"
  ) {
    appendParagraphs(
      container,
      String(content)
    );

    return;
  }

  if (Array.isArray(content)) {
    const list =
      document.createElement("ul");

    for (const item of content) {
      const li =
        document.createElement("li");

      renderContent(li, item);
      list.append(li);
    }

    container.append(list);
    return;
  }

  if (typeof content === "object") {
    if (hasContent(content.text)) {
      appendParagraphs(
        container,
        String(content.text)
      );
    }

    if (Array.isArray(content.paragraphs)) {
      for (
        const paragraph
        of content.paragraphs
      ) {
        const p =
          document.createElement("p");

        p.textContent =
          String(paragraph);

        container.append(p);
      }
    }

    if (Array.isArray(content.bullets)) {
      container.append(
        createTextList(
          content.bullets,
          false
        )
      );
    }

    if (Array.isArray(content.numbered)) {
      container.append(
        createTextList(
          content.numbered,
          true
        )
      );
    }

    if (hasContent(content.note)) {
      container.append(
        createCallout(
          content.note,
          "fact-note"
        )
      );
    }

    if (hasContent(content.caution)) {
      container.append(
        createCallout(
          content.caution,
          "caution-note"
        )
      );
    }

    if (!container.childNodes.length) {
      appendParagraphs(
        container,
        flattenText(content)
      );
    }
  }
}

function appendParagraphs(
  container,
  text
) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(value => value.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    container.textContent =
      paragraphs[0] || text;

    return;
  }

  for (const paragraph of paragraphs) {
    const p =
      document.createElement("p");

    p.textContent = paragraph;
    container.append(p);
  }
}

function createTextList(
  items,
  ordered
) {
  const list =
    document.createElement(
      ordered ? "ol" : "ul"
    );

  for (const item of items) {
    const li =
      document.createElement("li");

    renderContent(li, item);
    list.append(li);
  }

  return list;
}

function createCallout(
  content,
  className
) {
  const callout =
    document.createElement("div");

  callout.className = className;

  renderContent(
    callout,
    content
  );

  return callout;
}

function createTagList(tags) {
  const list =
    document.createElement("ul");

  list.className = "tag-list";

  for (const tag of tags) {
    const item =
      document.createElement("li");

    item.textContent = String(tag);
    list.append(item);
  }

  return list;
}

function renderSources(sources) {
  const fragment =
    document.createDocumentFragment();

  elements.sourceList.replaceChildren();

  if (!sources.length) {
    const item =
      document.createElement("li");

    item.textContent =
      t("noSources");

    fragment.append(item);
  }

  for (const source of sources) {
    const item =
      document.createElement("li");

    const title =
      localize(source.title) ||
      source.title ||
      source.url ||
      t("sources");

    if (isSafeWebUrl(source.url)) {
      const link =
        document.createElement("a");

      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = title;

      item.append(link);
    } else {
      const strong =
        document.createElement("strong");

      strong.textContent = title;
      item.append(strong);
    }

    const metaValues = [];

    const publisher =
      localize(source.publisher) ||
      source.publisher;

    if (publisher) {
      metaValues.push(
        String(publisher)
      );
    }

    if (source.language) {
      metaValues.push(
        `${t("sourceLanguage")}: ${source.language}`
      );
    }

    if (source.updatedAt) {
      metaValues.push(
        `${t("sourceUpdated")}: ${formatDate(source.updatedAt)}`
      );
    }

    if (source.accessedAt) {
      metaValues.push(
        `${t("sourceAccessed")}: ${formatDate(source.accessedAt)}`
      );
    }

    if (metaValues.length) {
      const meta =
        document.createElement("div");

      meta.className = "source-meta";

      for (const value of metaValues) {
        const span =
          document.createElement("span");

        span.textContent = value;
        meta.append(span);
      }

      item.append(meta);
    }

    fragment.append(item);
  }

  elements.sourceList.append(fragment);
}

function renderFavoriteButton() {
  if (!state.selectedId) {
    return;
  }

  const isFavorite =
    state.favorites.has(
      state.selectedId
    );

  elements.favoriteButton.setAttribute(
    "aria-pressed",
    String(isFavorite)
  );

  elements.favoriteButton.setAttribute(
    "aria-label",
    isFavorite
      ? t("removeFavorite")
      : t("addFavorite")
  );

  elements.favoriteButton
    .firstElementChild
    .textContent =
      isFavorite ? "★" : "☆";
}

function toggleSelectedFavorite() {
  if (!state.selectedId) {
    return;
  }

  if (
    state.favorites.has(
      state.selectedId
    )
  ) {
    state.favorites.delete(
      state.selectedId
    );
  } else {
    state.favorites.add(
      state.selectedId
    );
  }

  writeStoredSet(
    CONFIG.storage.favorites,
    state.favorites
  );

  renderFavoriteButton();
  renderJurisdictionList();
}

function handleSearchInput() {
  state.query =
    elements.searchInput.value;

  elements.searchClear.hidden =
    state.query.length === 0;

  renderJurisdictionList();
}

function clearSearch() {
  elements.searchInput.value = "";
  state.query = "";
  elements.searchClear.hidden = true;
  elements.searchInput.focus();

  renderJurisdictionList();
}

function setLanguage(language) {
  if (!language) {
    return;
  }

  state.language = language;

  safeStorageSet(
    CONFIG.storage.language,
    language
  );

  applyInterfaceLanguage();
  updateLanguageButtons();
  renderJurisdictionList();

  if (state.selectedId) {
    const record =
      state.records.get(
        state.selectedId
      );

    if (record) {
      renderOptionalLanguageButtons(
        record
      );

      renderDetail(record);

      document.title =
        `${localize(record.names)} | Patent Atlas`;
    }
  }
}

function ensureAvailableLanguage(record) {
  const available =
    Array.isArray(
      record.availableLanguages
    )
      ? record.availableLanguages
      : CONFIG.baseLanguages;

  if (!available.includes(state.language)) {
    state.language =
      available.includes("en")
        ? "en"
        : available[0] ||
          CONFIG.defaultLanguage;

    safeStorageSet(
      CONFIG.storage.language,
      state.language
    );
  }

  updateLanguageButtons();
}

function renderOptionalLanguageButtons(record) {
  elements.optionalLanguageButtons
    .replaceChildren();

  if (!record) {
    return;
  }

  const available =
    Array.isArray(
      record.availableLanguages
    )
      ? record.availableLanguages
      : CONFIG.baseLanguages;

  for (const language of available) {
    if (
      CONFIG.baseLanguages.includes(
        language
      )
    ) {
      continue;
    }

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "language-button";
    button.dataset.language = language;

    button.setAttribute(
      "aria-pressed",
      String(
        state.language === language
      )
    );

    button.textContent =
      LANGUAGE_NAMES[language]?.en ||
      language.toUpperCase();

    if (state.language === language) {
      button.classList.add("is-active");
    }

    elements.optionalLanguageButtons
      .append(button);
  }
}

function updateLanguageButtons() {
  const buttons =
    document.querySelectorAll(
      ".language-button[data-language]"
    );

  for (const button of buttons) {
    const active =
      button.dataset.language ===
      state.language;

    button.classList.toggle(
      "is-active",
      active
    );

    button.setAttribute(
      "aria-pressed",
      String(active)
    );
  }
}

function applyInterfaceLanguage() {
  const uiLanguage =
    UI_TEXT[state.language]
      ? state.language
      : "en";

  document.documentElement.lang =
    state.language;

  for (
    const element
    of document.querySelectorAll(
      "[data-i18n]"
    )
  ) {
    const key =
      element.dataset.i18n;

    if (UI_TEXT[uiLanguage][key]) {
      element.textContent =
        UI_TEXT[uiLanguage][key];
    }
  }

  for (
    const element
    of document.querySelectorAll(
      "[data-i18n-placeholder]"
    )
  ) {
    const key =
      element.dataset.i18nPlaceholder;

    if (UI_TEXT[uiLanguage][key]) {
      element.placeholder =
        UI_TEXT[uiLanguage][key];
    }
  }

  if (!state.selectedId) {
    document.title = "Patent Atlas";
  }

  updateSidebarButtonLabel();
}

function localize(
  value,
  language = state.language
) {
  const localized =
    localizeRaw(value, language);

  if (
    localized === null ||
    localized === undefined
  ) {
    return "";
  }

  if (
    typeof localized === "string" ||
    typeof localized === "number" ||
    typeof localized === "boolean"
  ) {
    return String(localized);
  }

  return flattenText(localized);
}

function localizeRaw(
  value,
  language = state.language
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    Array.isArray(value) ||
    typeof value !== "object"
  ) {
    return value;
  }

  const languageKeys =
    Object.keys(value).filter(
      key =>
        /^[a-z]{2}(?:-[A-Z]{2})?$/.test(
          key
        )
    );

  if (languageKeys.length === 0) {
    return value;
  }

  const candidates = unique([
    language,
    "en",
    "ja",
    ...languageKeys
  ]);

  for (const candidate of candidates) {
    if (
      hasContent(value[candidate])
    ) {
      return value[candidate];
    }
  }

  return null;
}

function hasLocalizedContent(value) {
  return hasContent(
    localizeRaw(value)
  );
}

function hasContent(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(hasContent);
  }

  if (typeof value === "object") {
    return Object
      .values(value)
      .some(hasContent);
  }

  return true;
}

function flattenText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(flattenText)
      .join(" ");
  }

  if (typeof value === "object") {
    return Object
      .values(value)
      .map(flattenText)
      .join(" ");
  }

  return "";
}

function normalizeSearchText(value) {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase(state.language)
    .replace(/\s+/g, " ")
    .trim();
}

function scheduleNoteSave() {
  window.clearTimeout(
    state.noteTimer
  );

  elements.notesStatus.textContent = "";

  state.noteTimer =
    window.setTimeout(
      saveNotes,
      450
    );
}

function saveNotes() {
  if (!state.selectedId) {
    return;
  }

  safeStorageSet(
    `${CONFIG.storage.notesPrefix}${state.selectedId}`,
    elements.matterNotes.value
  );

  elements.notesStatus.textContent =
    t("notesSaved");

  window.setTimeout(() => {
    elements.notesStatus.textContent = "";
  }, 1600);
}

function loadNotes(id) {
  window.clearTimeout(
    state.noteTimer
  );

  elements.matterNotes.value =
    safeStorageGet(
      `${CONFIG.storage.notesPrefix}${id}`
    ) || "";

  elements.notesStatus.textContent = "";
}

function toggleSidebar() {
  const shouldOpen =
    !document.body.classList.contains(
      "sidebar-open"
    );

  document.body.classList.toggle(
    "sidebar-open",
    shouldOpen
  );

  elements.sidebarBackdrop.hidden =
    !shouldOpen;

  elements.sidebarToggle.setAttribute(
    "aria-expanded",
    String(shouldOpen)
  );

  updateSidebarButtonLabel();
}

function closeSidebar() {
  document.body.classList.remove(
    "sidebar-open"
  );

  elements.sidebarBackdrop.hidden = true;

  elements.sidebarToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  updateSidebarButtonLabel();
}

function updateSidebarButtonLabel() {
  const open =
    document.body.classList.contains(
      "sidebar-open"
    );

  elements.sidebarToggle.setAttribute(
    "aria-label",
    open
      ? t("closeJurisdictions")
      : t("openJurisdictions")
  );
}

function setView(view) {
  elements.loadingView.hidden =
    view !== "loading";

  elements.errorView.hidden =
    view !== "error";

  elements.welcomeView.hidden =
    view !== "welcome";

  elements.detailView.hidden =
    view !== "detail";
}

function showError(message) {
  elements.errorMessage.textContent =
    message;

  setView("error");
}

function getIdFromHash() {
  const match =
    window.location.hash.match(
      /^#\/jurisdiction\/([^/?#]+)$/
    );

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function getEntry(id) {
  return (
    state.entries.find(
      entry => entry.id === id
    ) || null
  );
}

function resolveDataPath(path) {
  if (
    /^(?:https?:)?\/\//i.test(path) ||
    path.startsWith("./") ||
    path.startsWith("../")
  ) {
    return path;
  }

  return (
    `./data/${path.replace(/^\/+/, "")}`
  );
}

function makeSectionId(value) {
  return (
    `section-${String(value)}`
      .normalize("NFKC")
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "section-item"
  );
}

function renderDate(element, value) {
  element.dateTime = value || "";

  element.textContent =
    value
      ? formatDate(value)
      : t("notAvailable");
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const locale =
    state.language === "ja"
      ? "ja-JP"
      : "en-GB";

  return new Intl.DateTimeFormat(
    locale,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }
  ).format(date);
}

function isSafeWebUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(
      value,
      window.location.href
    );

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function t(key) {
  const language =
    UI_TEXT[state.language]
      ? state.language
      : "en";

  return (
    UI_TEXT[language][key] ||
    UI_TEXT.en[key] ||
    key
  );
}

function readStoredLanguage() {
  const stored =
    safeStorageGet(
      CONFIG.storage.language
    );

  return (
    stored ||
    CONFIG.defaultLanguage
  );
}

function readStoredSet(key) {
  try {
    const parsed = JSON.parse(
      safeStorageGet(key) || "[]"
    );

    return new Set(
      Array.isArray(parsed)
        ? parsed
        : []
    );
  } catch {
    return new Set();
  }
}

function writeStoredSet(key, value) {
  safeStorageSet(
    key,
    JSON.stringify(
      Array.from(value)
    )
  );
}

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(
      key,
      value
    );
  } catch (error) {
    console.warn(
      "Local storage is unavailable:",
      error
    );
  }
}

async function installApp() {
  if (!state.installPrompt) {
    return;
  }

  state.installPrompt.prompt();

  await state.installPrompt.userChoice;

  state.installPrompt = null;
  elements.installButton.hidden = true;
}

function registerServiceWorker() {
  if (
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register(
          CONFIG.serviceWorkerUrl
        )
        .catch(error => {
          console.warn(
            "Service worker registration failed:",
            error
          );
        });
    }
  );
}

function toCamelCase(value) {
  return value.replace(
    /-([a-z])/g,
    (_, letter) =>
      letter.toUpperCase()
  );
}

function unique(values) {
  return Array.from(
    new Set(
      values.filter(Boolean)
    )
  );
}
