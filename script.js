
const STORAGE_KEY = "homeworkManagerData";

let tasks = [];
let selected = new Set();

function getTodayKey() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tasks,
    lastResetDate: getTodayKey()
  }));
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);
      tasks = Array.isArray(data.tasks) ? data.tasks : [];

      if (data.lastResetDate !== getTodayKey()) {
        tasks.forEach(task => task.done = false);
      }
    }
  } catch (error) {
    tasks = [];
  }

  saveData();
}

function updateDate() {
  const d = new Date();

  document.getElementById("today").textContent =
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function render() {
  const remaining = tasks.filter(t => !t.done);
  const finished = tasks.filter(t => t.done);

  document.getElementById("remainingCount").textContent =
    remaining.length;

  document.getElementById("completedCount").textContent =
    finished.length;

  document.getElementById("progressText").textContent =
    `${finished.length} / ${tasks.length} 完了`;

  document.getElementById("progressBar").style.width =
    (tasks.length ? finished.length / tasks.length * 100 : 0) + "%";

  document.getElementById("taskCount").textContent =
    remaining.length + "件";

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (remaining.length === 0) {
    list.textContent = "🎉 残っている宿題はありません！";
  }

  remaining.forEach(task => {
    const row = document.createElement("div");
    row.className = "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected.has(task.id);

    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();

      if (selected.has(task.id)) {
        selected.delete(task.id);
      } else {
        selected.add(task.id);
      }

      render();
    });

    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;

    const del = document.createElement("button");
    del.className = "delete-button";
    del.textContent = "削除";

    del.addEventListener("click", (event) => {
      event.stopPropagation();

      tasks = tasks.filter(t => t.id !== task.id);
      selected.delete(task.id);

      saveData();
      render();
    });

    row.append(checkbox, name, del);

    row.addEventListener("click", () => {
      if (selected.has(task.id)) {
        selected.delete(task.id);
      } else {
        selected.add(task.id);
      }

      render();
    });

    list.appendChild(row);
  });

  const finishedList = document.getElementById("finishedList");
  finishedList.innerHTML = "";

  if (finished.length === 0) {
    finishedList.textContent =
      "まだ完了した宿題はありません。";
  }

  finished.forEach(task => {
    const item = document.createElement("div");
    item.className = "finished-task";
    item.textContent = "✓ " + task.name;
    finishedList.appendChild(item);
  });

  updateCompleteButton();
}

function updateCompleteButton() {
  const button = document.getElementById("completeButton");

  button.disabled = false;

  if (selected.size === 0) {
    button.style.background = "#9aabb8";
    button.textContent = "宿題を選択してください";
  } else {
    button.style.background = "#22a77b";
    button.textContent =
      `選択した宿題を完了（${selected.size}件）`;
  }
}

function addTask() {
  const input = document.getElementById("taskInput");
  const name = input.value.trim();

  if (!name) {
    alert("宿題の名前を入力してください。");
    return;
  }

  tasks.push({
    id: Date.now().toString() +
      Math.random().toString(16).slice(2),
    name,
    done: false
  });

  input.value = "";

  saveData();
  render();
}

document.getElementById("addButton")
  .addEventListener("click", addTask);

document.getElementById("taskInput")
  .addEventListener("keydown", event => {
    if (event.key === "Enter") {
      addTask();
    }
  });

document.getElementById("completeButton")
  .addEventListener("click", () => {
    if (selected.size === 0) return;

    tasks.forEach(task => {
      if (selected.has(task.id)) {
        task.done = true;
      }
    });

    selected.clear();

    saveData();
    render();
  });

function checkNewDay() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  const data = JSON.parse(saved);

  if (data.lastResetDate !== getTodayKey()) {
    tasks.forEach(task => task.done = false);

    selected.clear();

    saveData();
    updateDate();
    render();
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkNewDay();
  }
});

function scheduleMidnightCheck() {
  const now = new Date();

  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  setTimeout(() => {
    checkNewDay();
    scheduleMidnightCheck();
  }, midnight - now);
}

loadData();
updateDate();
render();
scheduleMidnightCheck();
