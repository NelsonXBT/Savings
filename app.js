/* === Frequently Asked Questions Toggle === */

document.addEventListener("DOMContentLoaded", () => {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
});

/* === Main dApp Logic === */

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM ready");

  let provider, signer, contract, userAddress, unlockTimestamp;
  const contractAddress = "0xF020f362CDe86004d94C832596415E082A77e203";
  const rpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
  const chainId = 421614;

  const abi = [
    { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "claim", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getDeposits", "outputs": [{ "components": [ { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "bool", "name": "claimed", "type": "bool" } ], "internalType": "struct TimeLockVault.Deposit[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getUnlockTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getTotalDeposited", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getUserCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
  ];

  const connectBtn = document.getElementById("connectBtn");
  const homepageWrapper = document.getElementById("homepageWrapper");
  const targetSavingsPage = document.getElementById("targetSavingsPage");
  const targetFormPage = document.getElementById("targetFormPage");
  const targetForm = document.getElementById("targetForm");
  const dashboard = document.getElementById("dashboard");
  const depositForm = document.getElementById("depositForm");
  const depositAmount = document.getElementById("depositAmount");
  const historyTableBody = document.querySelector('#historyTable tbody');
  const totalDepositedEl = document.getElementById('totalDeposited');
  const timerEl = document.getElementById('timer');
  const depositHeading = document.getElementById('depositTitle');
  const afterUnlockText = document.getElementById('claimNote');
  const inlineClaimWrapper = document.getElementById('claimOnlyBtnWrapper');
  const inlineClaimBtn = document.getElementById('claimOnlyBtn');
  const startDateEl = document.getElementById('startDate');
  const totalUsersEl = document.getElementById('totalUsers');
  const vaultBalanceEl = document.getElementById('vaultBalance');
  const progressTitleEl = document.getElementById("progressTitle");
  const progressTextEl = document.getElementById("progressText");
  const progressFillEl = document.getElementById("progressFill");
  const savingsProgressSection = document.getElementById("savingsProgressSection");
  const selectedPurposeHeading = document.getElementById("selectedPurposeHeading");
  const savingsReminderEl = document.getElementById("savingsReminder");

  function showStatus(message, duration = 5000) {
    const statusDiv = document.getElementById("statusMessage");
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.classList.add("show");
    setTimeout(() => statusDiv.classList.remove("show"), duration);
  }

  function resetPlan() {
    localStorage.removeItem("savelockPurpose");
    localStorage.removeItem("savelockTargetAmount");
    localStorage.removeItem("savelockFrequency");
    location.reload();
  }

  function showReminder() {
    const freq = localStorage.getItem("savelockFrequency");
    if (!freq) return;

    let reminder = "You haven’t saved for this period.";
    if (freq === "daily") reminder = "⏰ You haven’t saved today.";
    if (freq === "weekly") reminder = "📅 You haven’t saved this week.";
    if (freq === "monthly") reminder = "📆 You haven’t saved this month.";

    savingsReminderEl.textContent = reminder;
    savingsReminderEl.style.display = "block";
  }

  function updateProgressBar(currentSaved = 0) {
    const target = parseFloat(localStorage.getItem("savelockTargetAmount")) || 0;
    const purpose = localStorage.getItem("savelockPurpose") || "Savings";
    if (!target || !purpose) return;
    const percentage = ((currentSaved / target) * 100).toFixed(1);
    progressTitleEl.textContent = `${purpose} Savings Progress`;
    progressTextEl.textContent = `${percentage}% of your goal saved`;
    progressFillEl.style.width = `${percentage}%`;
    savingsProgressSection.style.display = "block";
    showReminder();
  }

  // Add Reset button to dashboard UI
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset Plan";
  resetBtn.style.marginTop = "1rem";
  resetBtn.onclick = resetPlan;
  dashboard.appendChild(resetBtn);

  // (Multiple saving goals support would require deeper structural UI changes)
  // For now, support one goal at a time with the ability to reset and restart

  // ...rest of app logic remains unchanged
});
