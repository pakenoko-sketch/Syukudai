
const STORAGE_KEY = "homeworkManagerData";

let tasks = [];
let selected = new Set();

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      lastResetDate: todayKey()
    }));
  } catch (e) {
    console.warn("保存できませんでした", e);
  }
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      tasks = Array.isArray(data.tasks) ? data.tasks : [];
      if (data.lastResetDate !== todayKey()) {
        tasks.forEach(t => t.done = false);
      }
    }
  } catch (e) {
    console.warn("読み込みエラー", e);
  }
}

function updateDate() {
  const d = new Date();
  document.getElementById("today").textContent =
    `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function updateButton() {
  const button = document.getElementById("completeButton");
  button.disabled = false;

  if (selected.size === 0) {
    button.textContent = "宿題を選択してください";
    button.style.background = "#9aabb8";
  } else {
    button.textContent = `選択した宿題を完了（${selected.size}件）`;
    button.style.background = "#22a77b";
  }
}

function render() {
  const remaining = tasks.filter(t => !t.done);
  const finished = tasks.filter(t => t.done);

  document.getElementById("remainingCount").textContent = remaining.length;
  document.getElementById("completedCount").textContent = finished.length;
  document.getElementById("progressText").textContent =
    `${finished.length} / ${tasks.length} 完了`;
  document.getElementById("taskCount").textContent =
    remaining.length + "件";

  document.getElementById("progressBar").style.width =
    (tasks.length ? finished.length / tasks.length * 100 : 0) + "%";

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (remaining.length === 0) {
    list.textContent = "🎉 残っている宿題はありません！";
  }

  remaining.forEach(task => {
    const row = document.createElement("div");
    row.className = "task";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = selected.has(task.id);

    check.addEventListener("change", () => {
      if (check.checked) selected.add(task.id);
      else selected.delete(task.id);
      updateButton();
    });

    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;

    name.addEventListener("click", () => {
      if (selected.has(task.id)) selected.delete(task.id);
      else selected.add(task.id);
      render();
    });

    const del = document.createElement("button");
    del.className = "delete-button";
    del.textContent = "削除";

    del.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      selected.delete(task.id);
      saveData();
      render();
    });

    row.append(check, name, del);
    list.appendChild(row);
  });

  const finishedList = document.getElementById("finishedList");
  finishedList.innerHTML = "";

  if (finished.length === 0) {
    finishedList.textContent = "まだ完了した宿題はありません。";
  }

  finished.forEach(task => {
    const item = document.createElement("div");
    item.className = "finished-task";
    item.textContent = "✓ " + task.name;
    finishedList.appendChild(item);
  });

  updateButton();
}

function addTask() {
  const input = document.getElementById("taskInput");
  const name = input.value.trim();

  if (!name) {
    alert("宿題の名前を入力してください。");
    return;
  }

  tasks.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    name,
    done: false
  });

  input.value = "";
  saveData();
  render();
}

function completeTasks() {
  if (selected.size === 0) return;

  tasks.forEach(task => {
    if (selected.has(task.id)) task.done = true;
  });

  selected.clear();
  saveData();
  render();
}

function checkNewDay() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);

    if (data.lastResetDate !== todayKey()) {
      tasks.forEach(t => t.done = false);
      selected.clear();
      saveData();
      updateDate();
      render();
    }
  } catch (e) {
    console.warn("日付確認エラー", e);
  }
}

function init() {
  // 先にボタンの動作を登録
  document.getElementById("addButton")
    .addEventListener("click", addTask);

  document.getElementById("completeButton")
    .addEventListener("click", completeTasks);

  document.getElementById("taskInput")
    .addEventListener("keydown", e => {
      if (e.key === "Enter") addTask();
    });

  // その後でデータを読み込む
  loadData();
  updateDate();
  render();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkNewDay();
  });

  function scheduleMidnight() {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    setTimeout(() => {
      checkNewDay();
      scheduleMidnight();
    }, midnight - now);
  }

  scheduleMidnight();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
