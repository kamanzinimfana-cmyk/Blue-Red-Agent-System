const runBtn = document.getElementById("run");
const stopBtn = document.getElementById("stop");
const taskInput = document.getElementById("task");
const statusDiv = document.getElementById("status");
const logsDiv = document.getElementById("logs");

const tabs = document.querySelectorAll(".tab-btn");
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
  };
});

function addLog(msg, type = "info") {
  const log = document.createElement("div");
  log.className = `log-${type}`;
  log.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logsDiv.prepend(log);
}

runBtn.onclick = () => {
  const task = taskInput.value.trim();
  if (!task) return;

  const settings = {
    aiMode: document.querySelector('input[name="ai-mode"]:checked')?.value || "auto",
    speedMode: document.querySelector('input[name="speed-mode"]:checked')?.value || "fast",
    stealthEnabled: document.getElementById('stealth-mode')?.checked
  };

  statusDiv.innerText = "Running";
  statusDiv.style.color = "#3b82f6";
  addLog(`Starting task: ${task}`, "system");

  chrome.runtime.sendMessage({
    type: "START_TASK",
    task,
    settings
  });
};

stopBtn.onclick = () => {
  statusDiv.innerText = "Idle";
  statusDiv.style.color = "#94a3b8";
  addLog("Task stopped", "system");

  chrome.runtime.sendMessage({
    type: "STOP_TASK"
  });
};
