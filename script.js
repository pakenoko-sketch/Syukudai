const STORAGE_KEY = "homeworkManagerData";

let tasks = [];
let selected = new Set();

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      const data = JSON.parse(saved);
      tasks = Array.isArray(data.tasks) ? data.tasks : [];

      if (data.lastResetDate !== getTodayKey()) {
        tasks.forEach(task => task.done = false);
      }
    } catch {
      tasks = [];
    }
  }

  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tasks: tasks,
    lastResetDate: getTodayKey()
  }));
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

  const percent = tasks.length === 0
    ? 0
    : finished.length / tasks.length * 100;

  document.getElementById("progressBar").style.width =
    percent + "%";

  document.getElementById("taskCount").textContent =
    remaining.length + "件";

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (remaining.length === 0) {
    list.innerHTML =
      '<div class="empty">🎉 残っている宿題はありません！</div>';
  }

  remaining.forEach(task => {
    const row = document.createElement("div");
    row.className = "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected.has(task.id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selected.add(task.id);
      } else {
        selected.delete(task.id);
      }
    });

    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "削除";

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      selected.delete(task.id);
      saveData();
      render();
    });

    row.append(checkbox, name, deleteButton);
    list.appendChild(row);
  });

  const finishedList = document.getElementById("finishedList");
  finishedList.innerHTML = "";

  if (finished.length === 0) {
    finishedList.innerHTML =
      '<div class="empty">まだ完了した宿題はありません。</div>';
  }

  finished.forEach(task => {
    const item = document.createElement("div");
    item.className = "finished-task";
    item.textContent = "✓ " + task.name;
    finishedList.appendChild(item);
  });

  document.getElementById("completeButton").disabled =
    selected.size === 0;
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
    name: name,
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
    if (event.key === "Enter") addTask();
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

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkNewDay();
  }
});

loadData();
updateDate();
render();
scheduleMidnightCheck();
