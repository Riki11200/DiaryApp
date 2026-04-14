/*script.js*/

let lastTranslatedJP = "";

// 日付取得
function getDate() {
  const params = new URLSearchParams(window.location.search);
  return params.get("date");
}

// 日付取得
function getDate() {
  const params = new URLSearchParams(window.location.search);
  return params.get("date");
}

// index → edit
function goToDate(date) {
  window.location.href = "edit.html?date=" + date;
}

// 戻る
function goBack() {
  window.location.href = "index.html";
}

// 読み込み
function load() {
  const date = getDate();
  document.getElementById("date").textContent = date;

  document.getElementById("en").addEventListener("input", autoSave);
  document.getElementById("jp").addEventListener("input", autoSave);

  const data = JSON.parse(localStorage.getItem(date));

  if (data) {
    document.getElementById("en").value = data.en;
    document.getElementById("jp").value = data.jp;

    lastTranslatedJP = data.lastTranslatedJP || "";
  }

  document
    .getElementById("imageInput")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = function (event) {
        const base64 = event.target.result;

        document.getElementById("preview").src = base64;

        window.currentImage = base64;
      };

      reader.readAsDataURL(file);
    });
  if (data.image) {
    document.getElementById("preview").src = data.image;
    window.currentImage = data.image;
  }
}

function getEvents() {
  const events = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const data = JSON.parse(localStorage.getItem(key));

    if (!data) continue;

    // 🔥 中身空ならスキップ
    if (!data.en && !data.jp && !data.image) continue;

    events.push({
      title: "",
      start: key,
      extendedProps: {
        image: data.image || null,
        text: "✔",
      },
    });
  }

  return events;
}

function deleteData() {
  const date = getDate();

  const ok = confirm(`${date} のデータを削除しますか？`);

  if (!ok) return;

  localStorage.removeItem(date);

  showToast("削除しました");

  // 戻る
  setTimeout(() => {
    goBack();
  }, 500);
}

function showCalendar() {
  document.getElementById("calendarView").style.display = "block";
  document.getElementById("cardView").style.display = "none";

  if (calendar) calendar.render();
}

function showCards() {
  document.getElementById("calendarView").style.display = "none";
  document.getElementById("cardView").style.display = "block";

  renderCards();
}

function renderCards() {
  const container = document.getElementById("cardView");
  container.innerHTML = "";

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const data = JSON.parse(localStorage.getItem(key));

    if (!data) continue;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div>${key}</div>
      <div>✔ ${data.en ? "日記あり" : ""}</div>
      ${data.image ? `<img src="${data.image}" style="width:100%;height:120px;object-fit:cover;">` : ""}
    `;

    container.appendChild(card);
  }
}

let saveTimer;

function autoSave() {
  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    const date = getDate();

    const en = document.getElementById("en").value.trim();
    const jp = document.getElementById("jp").value.trim();
    const image = window.currentImage || null;
    const existing = JSON.parse(localStorage.getItem(date) || "{}");

    // 🔥 全部空なら削除
    if (!en && !jp && !image) {
      localStorage.removeItem(date);
      showToast("データ削除");
      return;
    }

    const data = {
      en,
      jp,
      image: image || existing.image || null,
      updatedAt: Date.now(),
      lastTranslatedJP,
    };

    localStorage.setItem(date, JSON.stringify(data));

    //showToast("自動保存");
  }, 500);
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.style.opacity = 1;

  setTimeout(() => {
    toast.style.opacity = 0;
  }, 800);
}

function save() {
  autoSave();
  showToast("保存しました");
}

function exportData() {
  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);

    try {
      data[key] = JSON.parse(value);
    } catch (e) {
      // JSONじゃないゴミデータがあれば無視
      continue;
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `diary_backup_${getToday()}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  showToast("エクスポートしました");
}

// 今日の日付（ファイル名用）
function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function importData() {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];

  if (!file) {
    showToast("ファイルが選択されていません");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      let count = 0;

      for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;

        const local = JSON.parse(localStorage.getItem(key));
        const incoming = data[key];

        const localTime = local?.updatedAt || 0;
        const incomingTime = incoming.updatedAt || 0;

        if (!local) {
          // 新規
          localStorage.setItem(key, JSON.stringify(incoming));
          count++;
        } else if (incomingTime > localTime) {
          // 新しい
          localStorage.setItem(key, JSON.stringify(incoming));
          count++;
        } else {
          // 古い or 同時 → 確認
          const ok = confirm(`${key}は上書きしますか？`);

          if (ok) {
            localStorage.setItem(key, JSON.stringify(incoming));
            count++;
          }
        }
      }

      fileInput.value = "";

      showToast(`インポート完了 (${count}件)`);

      if (typeof calendar !== "undefined") {
        calendar.removeAllEvents();
        calendar.addEventSource(getEvents());
        calendar.refetchEvents();
      }

      if (typeof renderCards === "function") {
        renderCards();
      }
    } catch (e) {
      console.error(e);
      showToast("インポート失敗（JSON形式エラー）");
    }
  };

  reader.readAsText(file);
}

async function callDeepL(text) {
  const response = await fetch("https://deepldiary.riki11-20.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  console.log("Worker response:", data);

  if (!response.ok) {
    throw new Error(data.error || "APIエラー");
  }

  return data.translations[0].text;
}

async function translateText() {
  const jp = document.getElementById("jp").value;
  const enElem = document.getElementById("en");

  if (!jp) {
    showToast("日本語が空です");
    return;
  }

  // 差分
  const newPart = jp.slice(lastTranslatedJP.length);

  if (!newPart.trim()) {
    showToast("新しい部分がありません");
    return;
  }

  try {
    showToast("翻訳中...");

    const translated = await callDeepL(newPart);

    const currentEn = enElem.value;

    const newText = currentEn ? currentEn + "\n\n" + translated : translated;

    enElem.value = newText;

    // 更新
    lastTranslatedJP = jp;

    autoSave();

    showToast("翻訳完了");
  } catch (error) {
    console.error(error);
    showToast("翻訳失敗" + error.message);
  }
}
