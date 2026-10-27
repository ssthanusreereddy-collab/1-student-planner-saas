const STORAGE_KEY = "smartStudentPlannerTasks";
const form = document.querySelector("#taskForm");
const titleInput = document.querySelector("#taskTitle");
const subjectInput = document.querySelector("#taskSubject");
const dateInput = document.querySelector("#taskDate");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function updateStats() {
  document.querySelector("#totalTasks").textContent = tasks.length;
  document.querySelector("#completedTasks").textContent = tasks.filter(task => task.completed).length;
  document.querySelector("#pendingTasks").textContent = tasks.filter(task => !task.completed).length;
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  emptyState.classList.toggle("hidden", visibleTasks.length > 0);
  emptyState.textContent = tasks.length === 0
    ? "No tasks yet. Add your first study task above."
    : "No tasks in this filter.";

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} complete`);
    checkbox.addEventListener("change", () => {
      tasks = tasks.map(entry => entry.id === task.id ? { ...entry, completed: checkbox.checked } : entry);
      saveTasks();
      renderTasks();
    });

    const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "task-name";
    name.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `${task.subject} · Due ${formatDate(task.dueDate)}`;
    info.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const status = document.createElement("span");
    status.className = "task-meta";
    status.textContent = task.completed ? "Completed" : "Pending";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => {
      tasks = tasks.filter(entry => entry.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(status, remove);
    item.append(checkbox, info, actions);
    taskList.append(item);
  });

  updateStats();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const dueDate = dateInput.value;
  if (!title || !subject || !dueDate) return;

  tasks.push({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    subject,
    dueDate,
    completed: false
  });
  saveTasks();
  form.reset();
  titleInput.focus();
  renderTasks();
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    renderTasks();
  });
});

renderTasks();
