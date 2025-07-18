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

  function showStatus(message, duration = 5000) {
    const statusDiv = document.getElementById("statusMessage");
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.classList.add("show");
    setTimeout(() => statusDiv.classList.remove("show"), duration);
  }

  async function handlePageFlow() {
    const savedPurpose = localStorage.getItem("savelockPurpose");
    const savedAmount = localStorage.getItem("savelockTargetAmount");
    const savedFreq = localStorage.getItem("savelockFrequency");

    if (savedPurpose && savedAmount && savedFreq) {
      homepageWrapper.style.display = "none";
      targetSavingsPage.style.display = "none";
      targetFormPage.style.display = "none";
      dashboard.style.display = "block";
    } else {
      homepageWrapper.style.display = "none";
      targetSavingsPage.style.display = "block";
    }
  }

  connectBtn.addEventListener("click", async () => {
    try {
      if (!window.ethereum) return alert("Please use a browser with an Ethereum wallet like MetaMask.");
      provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId: currentChainId } = await provider.getNetwork();

      if (currentChainId !== chainId) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + chainId.toString(16) }] });
          showStatus("Network changed successfully. Click Connect Wallet now");
          return;
        } catch (err) {
          if (err.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x" + chainId.toString(16),
                chainName: "Arbitrum Sepolia",
                rpcUrls: [rpcUrl],
                nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.arbiscan.io"]
              }]
            });
            showStatus("Network added successfully. Click Connect Wallet now");
            return;
          } else {
            alert("Please switch to the Arbitrum Sepolia network.");
            return;
          }
        }
      }

      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      contract = new ethers.Contract(contractAddress, abi, signer);

      const rawUnlockTime = await contract.getUnlockTime();
      unlockTimestamp = Number(rawUnlockTime);
      startCountdown();
      updateProgressBar();
      await loadUserData();

      handlePageFlow();
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      alert("Wallet connection failed: " + (err.message || "Unknown error"));
    }
  });

  document.querySelectorAll(".startSavingBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const purpose = btn.dataset.purpose;
      localStorage.setItem("savelockPurpose", purpose);
      targetSavingsPage.style.display = "none";
      selectedPurposeHeading.textContent = `Set Your ${purpose} Plan`;
      targetFormPage.style.display = "block";
    });
  });

  targetForm.addEventListener("submit", e => {
    e.preventDefault();
    const amount = document.getElementById("targetAmount").value;
    const frequency = document.getElementById("savingFrequency").value;
    const purpose = localStorage.getItem("savelockPurpose");

    if (!amount || !frequency || !purpose) return alert("Please complete the form.");

    localStorage.setItem("savelockTargetAmount", amount);
    localStorage.setItem("savelockFrequency", frequency);

    targetFormPage.style.display = "none";
    dashboard.style.display = "block";

    updateProgressBar();
    loadUserData();
  });

  function updateProgressBar(currentSaved = 0) {
    const target = parseFloat(localStorage.getItem("savelockTargetAmount")) || 0;
    const purpose = localStorage.getItem("savelockPurpose") || "Savings";
    if (!target || !purpose) return;
    const percentage = ((currentSaved / target) * 100).toFixed(1);
    progressTitleEl.textContent = `${purpose} Savings Progress`;
    progressTextEl.textContent = `${percentage}% of your goal saved`;
    progressFillEl.style.width = `${percentage}%`;
    savingsProgressSection.style.display = "block";
  }

  async function loadUserData() {
    try {
      const deposits = await contract.getDeposits(userAddress);
      const total = await contract.getTotalDeposited(userAddress);
      totalDepositedEl.textContent = `${ethers.utils.formatEther(total)} ETH`;

      historyTableBody.innerHTML = '';
      deposits.forEach((d, i) => {
        const isUnlocked = Date.now() / 1000 >= unlockTimestamp;
        const status = d.claimed ? '✅ Claimed' : (isUnlocked ? '🔓 Claimable' : '🔒 Locked');
        const row = document.createElement('tr');
        row.innerHTML = `<td>${ethers.utils.formatEther(d.amount)} ETH</td><td>${new Date(Number(d.timestamp) * 1000).toLocaleString()}</td><td>${status}</td>`;
        historyTableBody.appendChild(row);
      });

      updateProgressBar(Number(ethers.utils.formatEther(total)));

    } catch (err) {
      console.error("❌ Error loading deposits:", err);
    }

    try {
      const contractStartTime = await contract.getStartTime();
      startDateEl.textContent = new Date(Number(contractStartTime) * 1000).toLocaleString();
    } catch { startDateEl.textContent = "N/A"; }

    try {
      const totalUsers = await contract.getUserCount();
      totalUsersEl.textContent = totalUsers.toString();
    } catch { totalUsersEl.textContent = "N/A"; }

    try {
      const vaultBal = await provider.getBalance(contractAddress);
      vaultBalanceEl.textContent = `${ethers.utils.formatEther(vaultBal)} ETH`;
    } catch { vaultBalanceEl.textContent = "N/A"; }
  }

  function startCountdown() {
    if (!unlockTimestamp) {
      timerEl.textContent = "Invalid unlock time.";
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = unlockTimestamp * 1000 - now;
      if (diff <= 0) {
        timerEl.textContent = "Unlocked!";
        clearInterval(interval);
        depositForm.style.display = "none";
        depositHeading.textContent = "Savelock Period has Ended";
        afterUnlockText.style.display = "block";
        inlineClaimWrapper.style.display = "block";
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
      }
    }, 1000);
  }

  depositForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (Date.now() >= unlockTimestamp * 1000) return alert("Savelock period has ended.");

    const amount = parseFloat(depositAmount.value);
    if (isNaN(amount) || amount <= 0) return alert("Enter valid amount");

    try {
      showStatus("Depositing...");
      const tx = await contract.deposit({ value: ethers.utils.parseEther(amount.toString()) });
      await tx.wait();
      showStatus("Deposit successful", 3000);
      depositAmount.value = '';
      await loadUserData();
    } catch (err) {
      console.error("❌ Deposit failed:", err);
      showStatus("Deposit failed", 3000);
    }
  });

  inlineClaimBtn.addEventListener("click", async () => {
    try {
      const deposits = await contract.getDeposits(userAddress);
      let claimedAny = false;
      for (let i = 0; i < deposits.length; i++) {
        if (!deposits[i].claimed) {
          showStatus(`Claiming deposit ${i + 1}...`);
          const tx = await contract.claim(i);
          await tx.wait();
          claimedAny = true;
        }
      }
      if (claimedAny) {
        showStatus("All eligible deposits claimed", 3000);
      } else {
        showStatus("No unclaimed deposits", 3000);
      }
      await loadUserData();
    } catch (err) {
      console.error("❌ Claim failed:", err);
      showStatus("Claim failed", 3000);
    }
  });
});
