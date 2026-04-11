/*script.js*/

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

    const data = {
      en: document.getElementById("en").value,
      jp: document.getElementById("jp").value,
      image: window.currentImage || null
    };

    localStorage.setItem(date, JSON.stringify(data));

    showToast("自動保存");
  }, 500); // 0.5秒後に保存
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