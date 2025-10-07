import {
	compareCharByChar,
	compareFull,
	formatCharForDisplay,
	normalizeText,
	findFirstDifference,
} from "./text-utils.js";

const STORAGE_KEY = "guowen-memorizer-texts";

const elements = {
	titleInput: document.querySelector("#titleInput"),
	contentInput: document.querySelector("#contentInput"),
	saveButton: document.querySelector("#saveButton"),
	clearButton: document.querySelector("#clearButton"),
	savedList: document.querySelector("#savedTexts"),
	exportButton: document.querySelector("#exportButton"),
	importButton: document.querySelector("#importButton"),
	importFile: document.querySelector("#importFile"),
	practiceSelect: document.querySelector("#practiceSelect"),
	modeRadios: document.querySelectorAll("input[name='mode']"),
	ignorePunctuation: document.querySelector("#ignorePunctuation"),
	practiceInput: document.querySelector("#practiceInput"),
	compareButton: document.querySelector("#compareButton"),
	resetButton: document.querySelector("#resetButton"),
	result: document.querySelector("#result"),
	resultCharTemplate: document.querySelector("#resultCharTemplate"),
  hamburger: document.querySelector("#hamburger"),
  mobileNav: document.querySelector("#mobileNav"),
  backdrop: document.querySelector("#backdrop"),
  sectionManage: document.querySelector("#section-manage"),
  sectionPractice: document.querySelector("#section-practice"),
};

const state = {
	texts: [],
	editingId: null,
};

const createId = () => {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `text-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

init();

function init() {
	state.texts = loadTexts();
	// Render only what exists on this page
	if (elements.savedList) renderSavedTexts();
	if (elements.practiceSelect) {
		renderPracticeSelect();
		// If navigated with a query param ?practice=<id>, preselect it
		const params = new URLSearchParams(location.search);
		const preselectId = params.get("practice");
		if (preselectId && state.texts.some((t) => t.id === preselectId)) {
			elements.practiceSelect.value = preselectId;
			if (isCharMode()) {
				updateLiveCharStatusIfNeeded();
			} else if (elements.result) {
				renderEmptyResult();
			}
			updateCompareButtonState();
		}
	}
	if (elements.result) renderEmptyResult();
	bindEvents();
	if (elements.compareButton) updateCompareButtonState();
}

function bindEvents() {
	if (elements.saveButton) elements.saveButton.addEventListener("click", handleSaveText);
	if (elements.clearButton) elements.clearButton.addEventListener("click", resetEditorForm);
	// Export / Import
	if (elements.exportButton) elements.exportButton.addEventListener("click", handleExport);
	if (elements.importButton && elements.importFile) {
		elements.importButton.addEventListener("click", () => elements.importFile.click());
		elements.importFile.addEventListener("change", handleImport);
	}
	if (elements.compareButton) elements.compareButton.addEventListener("click", handleCompare);
	if (elements.resetButton) elements.resetButton.addEventListener("click", () => {
		if (elements.practiceInput) elements.practiceInput.value = "";
		if (elements.result) renderEmptyResult();
		if (elements.compareButton) updateCompareButtonState();
	});

	if (elements.practiceSelect) elements.practiceSelect.addEventListener("change", () => {
		if (isCharMode()) {
			updateLiveCharStatusIfNeeded();
		} else if (elements.result) {
			renderEmptyResult();
		}
		if (elements.compareButton) updateCompareButtonState();
	});

	if (elements.savedList) elements.savedList.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-action]");
		if (!button) return;
		const li = button.closest("li[data-id]");
		if (!li) return;

		const { action } = button.dataset;
		const id = li.dataset.id;

		if (action === "practice") {
			if (elements.practiceSelect) {
				elements.practiceSelect.value = id;
				if (isCharMode()) {
					updateLiveCharStatusIfNeeded();
				} else if (elements.result) {
					renderEmptyResult();
				}
				if (elements.compareButton) updateCompareButtonState();
			} else {
				// On manage page, jump to practice page with preselected id
				location.href = `practice.html?practice=${encodeURIComponent(id)}`;
			}
		}

		if (action === "edit") {
			loadTextIntoEditor(id);
		}

		if (action === "delete") {
			deleteText(id);
		}
	});

	// Real-time compare when in char mode
	if (elements.practiceInput) {
		elements.practiceInput.addEventListener("input", () => {
			if (isCharMode()) {
				updateLiveCharStatusIfNeeded();
			}
		});
	}

	// React to mode change and punctuation toggle
	if (elements.modeRadios && elements.modeRadios.length) {
		elements.modeRadios.forEach((radio) => {
			radio.addEventListener("change", () => {
				if (isCharMode()) {
					updateLiveCharStatusIfNeeded();
				} else if (elements.result) {
					renderEmptyResult();
				}
				if (elements.compareButton) updateCompareButtonState();
			});
		});
	}

	if (elements.ignorePunctuation) {
		elements.ignorePunctuation.addEventListener("change", () => {
			if (isCharMode()) {
				updateLiveCharStatusIfNeeded();
			}
		});
	}

		// Hamburger / mobile nav
		if (elements.hamburger) {
			elements.hamburger.addEventListener("click", toggleDrawer);
		}
		if (elements.backdrop) {
			elements.backdrop.addEventListener("click", closeDrawer);
		}
		if (elements.mobileNav) {
			elements.mobileNav.addEventListener("click", (e) => {
				const btn = e.target.closest(".nav-link");
				if (!btn) return;
				const href = btn.getAttribute("data-href");
				const targetSel = btn.getAttribute("data-target");
				if (href) {
					location.href = href;
				} else if (targetSel) {
					switchMobileView(targetSel);
				}
				closeDrawer();
			});
		}

			window.addEventListener("resize", handleResponsiveSwitching);
			handleResponsiveSwitching();
}

function handleSaveText() {
	const title = elements.titleInput.value.trim();
	const content = elements.contentInput.value.trim();

	if (!title) {
		alert("請填寫課文標題");
		return;
	}
	if (!content) {
		alert("請填寫課文內容");
		return;
	}

	const timestamp = new Date().toISOString();
		const id = state.editingId ?? createId();

	const existingIndex = state.texts.findIndex((item) => item.id === id);
	const record = {
		id,
		title,
		content,
		createdAt: existingIndex === -1 ? timestamp : state.texts[existingIndex].createdAt,
		updatedAt: timestamp,
	};

	if (existingIndex === -1) {
		state.texts.push(record);
	} else {
		state.texts.splice(existingIndex, 1, record);
	}

	persistTexts();
	renderSavedTexts();
	renderPracticeSelect(id);
	resetEditorForm({ keepTitle: false });
	state.editingId = null;
	elements.saveButton.textContent = "儲存課文";
	alert(existingIndex === -1 ? "課文已儲存" : "課文已更新");
}

function resetEditorForm({ keepTitle = false } = {}) {
	if (!keepTitle) {
		elements.titleInput.value = "";
	}
	elements.contentInput.value = "";
	state.editingId = null;
	elements.saveButton.textContent = "儲存課文";
}

function loadTextIntoEditor(id) {
	const text = state.texts.find((item) => item.id === id);
	if (!text) return;
	state.editingId = id;
	elements.titleInput.value = text.title;
	elements.contentInput.value = text.content;
	elements.saveButton.textContent = "更新課文";
	window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteText(id) {
	if (!confirm("確定要刪除這篇課文嗎？")) return;
	state.texts = state.texts.filter((item) => item.id !== id);
	persistTexts();
	renderSavedTexts();
	renderPracticeSelect();
	if (state.editingId === id) {
		resetEditorForm();
	}
	if (elements.result) renderEmptyResult();
}

function loadTexts() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed;
	} catch (error) {
		console.error("Failed to load texts", error);
		return [];
	}
}

function persistTexts() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state.texts));
}

function handleExport() {
	try {
		if (!state.texts || state.texts.length === 0) {
			alert("目前沒有可匯出的課文。");
			return;
		}
		const data = JSON.stringify({
			version: 1,
			exportedAt: new Date().toISOString(),
			items: state.texts,
		}, null, 2);
		const blob = new Blob([data], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `guowen-texts-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		setTimeout(() => alert("已匯出 JSON 檔案。"), 0);
	} catch (e) {
		alert("匯出失敗，請稍後再試。");
		console.error(e);
	}
}

async function handleImport(e) {
	const file = e.target.files && e.target.files[0];
	if (!file) return;
	try {
		const text = await file.text();
		const parsed = JSON.parse(text);
		if (!parsed || !Array.isArray(parsed.items)) {
			alert("檔案格式不正確。");
			return;
		}
		// Merge by id; if same id exists, keep the newer updatedAt
		const map = new Map(state.texts.map((t) => [t.id, t]));
		for (const incoming of parsed.items) {
			if (!incoming || !incoming.id || !incoming.title) continue;
			const existing = map.get(incoming.id);
			if (!existing) {
				map.set(incoming.id, incoming);
			} else {
				const exTime = Date.parse(existing.updatedAt || existing.createdAt || 0) || 0;
				const inTime = Date.parse(incoming.updatedAt || incoming.createdAt || 0) || 0;
				map.set(incoming.id, inTime >= exTime ? incoming : existing);
			}
		}
		state.texts = Array.from(map.values());
		persistTexts();
		if (elements.savedList) renderSavedTexts();
		if (elements.practiceSelect) renderPracticeSelect();
		alert("匯入完成。");
	} catch (err) {
		console.error(err);
		alert("匯入失敗，請確認檔案格式。");
	} finally {
		e.target.value = ""; // reset for next import
	}
}

function renderSavedTexts() {
	elements.savedList.innerHTML = "";
	if (state.texts.length === 0) {
		elements.savedList.innerHTML = '<li class="hint">目前尚未儲存課文</li>';
		return;
	}

	const fragment = document.createDocumentFragment();
	state.texts
		.slice()
		.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
		.forEach((item) => {
			const li = document.createElement("li");
			li.className = "saved-item";
			li.dataset.id = item.id;

			const info = document.createElement("div");
			info.className = "saved-item__info";
			const title = document.createElement("span");
			title.className = "saved-item__title";
			title.textContent = item.title;

			const meta = document.createElement("span");
			meta.className = "saved-item__meta";
			meta.textContent = new Date(item.updatedAt).toLocaleString();

			info.append(title, meta);

			const actions = document.createElement("div");
			actions.className = "actions";

			const practiceBtn = document.createElement("button");
			practiceBtn.textContent = "練習";
			practiceBtn.dataset.action = "practice";
			practiceBtn.className = "primary";

			const editBtn = document.createElement("button");
			editBtn.textContent = "編輯";
			editBtn.dataset.action = "edit";

			const deleteBtn = document.createElement("button");
			deleteBtn.textContent = "刪除";
			deleteBtn.dataset.action = "delete";
			deleteBtn.className = "ghost";

			actions.append(practiceBtn, editBtn, deleteBtn);
			li.append(info, actions);
			fragment.appendChild(li);
		});

	elements.savedList.appendChild(fragment);
}

function renderPracticeSelect(selectedId) {
	const select = elements.practiceSelect;
	select.innerHTML = "";

	const placeholderOption = document.createElement("option");
	placeholderOption.value = "";
	placeholderOption.textContent = state.texts.length === 0 ? "請先儲存課文" : "選擇課文開始練習";
	select.appendChild(placeholderOption);

	state.texts
		.slice()
		.sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"))
		.forEach((item) => {
			const option = document.createElement("option");
			option.value = item.id;
			option.textContent = item.title;
			select.appendChild(option);
		});

	if (selectedId && state.texts.some((item) => item.id === selectedId)) {
		select.value = selectedId;
	} else {
		select.value = "";
	}

	const hasTexts = state.texts.length > 0;
	elements.practiceInput.disabled = !hasTexts;
	elements.resetButton.disabled = !hasTexts;
	updateCompareButtonState();
}

function handleCompare() {
	const selectedId = elements.practiceSelect.value;
	if (!selectedId) {
		alert("請先選擇要練習的課文");
		return;
	}

	const targetText = state.texts.find((item) => item.id === selectedId);
	if (!targetText) {
		alert("找不到選擇的課文");
		return;
	}

	const attemptText = elements.practiceInput.value;
	if (!attemptText.trim()) {
		alert("請輸入你的背誦內容");
		return;
	}

	const mode = [...elements.modeRadios].find((radio) => radio.checked)?.value ?? "char";
	const ignorePunctuation = elements.ignorePunctuation.checked;

	if (mode === "char") {
		// In realtime mode, the button is disabled; safeguard here anyway.
		renderLiveCharStatus(targetText.content, attemptText, { ignorePunctuation });
	} else {
		renderFullComparison(targetText.content, attemptText, { ignorePunctuation });
	}
}

function renderEmptyResult() {
	elements.result.className = "result result--empty";
	elements.result.textContent = "還沒有比對結果，輸入內容並開始練習吧！";
}

function isCharMode() {
	return ([...elements.modeRadios].find((r) => r.checked)?.value ?? "char") === "char";
}

function updateCompareButtonState() {
	if (!elements.compareButton) return;
	const hasTexts = state.texts.length > 0;
	const selected = elements.practiceSelect ? elements.practiceSelect.value : "";
	const inChar = isCharMode();
	if (inChar) {
		elements.compareButton.style.display = "none";
	} else {
		elements.compareButton.style.display = "";
		elements.compareButton.disabled = !hasTexts || !selected;
	}
}

function updateLiveCharStatusIfNeeded() {
	if (!elements.practiceSelect || !elements.result) return;
	const selectedId = elements.practiceSelect.value;
	const targetText = state.texts.find((item) => item.id === selectedId);
	if (!targetText) {
		if (elements.result) renderEmptyResult();
		return;
	}
	const attemptText = elements.practiceInput ? elements.practiceInput.value : "";
	renderLiveCharStatus(targetText.content, attemptText, { ignorePunctuation: elements.ignorePunctuation.checked });
}

// 即時逐字比對（前綴正確性）
function renderLiveCharStatus(reference, attempt, { ignorePunctuation }) {
	const refNorm = normalizeText(reference, { ignorePunctuation, collapseWhitespace: false });
	const attNorm = normalizeText(attempt, { ignorePunctuation, collapseWhitespace: false });

	const fragment = document.createDocumentFragment();

	if (!attNorm) {
		const hint = document.createElement("div");
		hint.className = "badge";
		hint.textContent = "請開始輸入，系統會即時檢查";
		fragment.appendChild(hint);
		elements.result.className = "result";
		elements.result.innerHTML = "";
		elements.result.appendChild(fragment);
		return;
	}

	// Check prefix correctness
	const refPrefix = refNorm.slice(0, attNorm.length);
	if (refPrefix === attNorm) {
		const ok = document.createElement("div");
		ok.className = "badge badge--success";
		ok.textContent = `目前正確（${attNorm.length}/${refNorm.length}）`;

		fragment.append(ok);
	} else {
		const diffIndex = findFirstDifference(refPrefix, attNorm);

		const bad = document.createElement("div");
		bad.className = "badge badge--error";
		bad.textContent = `第 ${diffIndex + 1} 個字不同`;

		fragment.append(bad);
	}

	// If typed beyond reference fully and still prefix matched till end, it's extra
	if (attNorm.length > refNorm.length && refNorm === attNorm.slice(0, refNorm.length)) {
		const extraBadge = document.createElement("div");
		extraBadge.className = "badge";
		extraBadge.textContent = `已超出全文（多出 ${attNorm.length - refNorm.length} 字）`;
		fragment.append(extraBadge);
	}

	elements.result.className = "result";
	elements.result.innerHTML = "";
	elements.result.appendChild(fragment);
}

function renderCharComparison(reference, attempt, options) {
	const { results, summary } = compareCharByChar(reference, attempt, options);
	const container = document.createElement("div");
	container.className = "char-result-list";

	const stats = document.createElement("div");
	stats.className = "stats";
	stats.innerHTML = `
		<span class="badge badge--success">正確 ${summary.matches}/${summary.total}</span>
		<span class="badge badge--error">錯誤 ${summary.mismatches}</span>
		<span class="badge">缺漏 ${summary.missing}</span>
		<span class="badge">多出 ${summary.extra}</span>
	`;

	const fragment = document.createDocumentFragment();
	results.forEach((item) => {
		const node = elements.resultCharTemplate.content.cloneNode(true);
		const charNode = node.querySelector(".char-result__char");
		const statusNode = node.querySelector(".char-result__status");

		charNode.textContent = formatCharForDisplay(item.referenceChar);

		const statusText = {
			match: "正確",
			mismatch: `錯誤 → ${formatCharForDisplay(item.attemptChar)}`,
			missing: "缺漏",
			extra: `多出 → ${formatCharForDisplay(item.attemptChar)}`,
		}[item.status];

		statusNode.textContent = statusText;
		statusNode.className = `char-result__status status-${item.status}`;
		fragment.appendChild(node);
	});

	container.appendChild(stats);
	container.appendChild(fragment);

	elements.result.className = "result";
	elements.result.innerHTML = "";
	elements.result.appendChild(container);
}

function renderFullComparison(reference, attempt, options) {
	const { referenceNormalized, attemptNormalized, isPerfect, differences } = compareFull(reference, attempt, options);

	const fragment = document.createDocumentFragment();

	const summary = document.createElement("div");
	summary.className = "badge " + (isPerfect ? "badge--success" : "badge--error");
	summary.textContent = isPerfect ? "完全正確" : "仍有差異";

	const detail = document.createElement("div");
	detail.className = "full-result";
	detail.innerHTML = `
		<p><strong>原文：</strong>${escapeHtml(referenceNormalized) || "（空）"}</p>
		<p><strong>我的背誦：</strong>${escapeHtml(attemptNormalized) || "（空）"}</p>
	`;

	fragment.append(summary, detail);

	if (!isPerfect) {
		const diffList = document.createElement("ul");
		diffList.className = "diff-list";
		differences.forEach((diff) => {
			const li = document.createElement("li");
			li.textContent = diff;
			diffList.appendChild(li);
		});

		if (differences.length > 0) {
			const diffTitle = document.createElement("p");
			diffTitle.innerHTML = "<strong>差異提示：</strong>";
			fragment.append(diffTitle, diffList);
		}
	}

	elements.result.className = "result";
	elements.result.innerHTML = "";
	elements.result.appendChild(fragment);
}

function escapeHtml(value) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// ===== Mobile navigation helpers =====
function isMobile() {
	return window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
}

function toggleDrawer() {
	const open = elements.mobileNav.classList.toggle("open");
	elements.hamburger.setAttribute("aria-expanded", String(open));
	elements.mobileNav.setAttribute("aria-hidden", String(!open));
	if (elements.backdrop) elements.backdrop.hidden = !open;
}

function closeDrawer() {
	elements.mobileNav.classList.remove("open");
	elements.hamburger.setAttribute("aria-expanded", "false");
	elements.mobileNav.setAttribute("aria-hidden", "true");
	if (elements.backdrop) elements.backdrop.hidden = true;
}

function switchMobileView(selector) {
	if (!isMobile()) return;
	const view = document.querySelector(selector);
	if (!view) return;
	[elements.sectionManage, elements.sectionPractice].forEach((sec) => {
		if (!sec) return;
		sec.classList.toggle("active", sec === view);
	});
}

function handleResponsiveSwitching() {
	// Across all sizes: default to practice view active
	if (elements.sectionManage && elements.sectionPractice) {
		if (!elements.sectionManage.classList.contains("active") && !elements.sectionPractice.classList.contains("active")) {
			switchMobileView("#section-practice");
		}
	}
	closeDrawer();
}
