document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM ready");

  let provider, signer, contract, userAddress, unlockTimestamp;
  const contractAddress = "0xF020f362CDe86004d94C832596415E082A77e203";
  const rpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
  const chainId = 421614;

  const abi = [
    {
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
      "name": "claim",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
      "name": "getDeposits",
      "outputs": [{
        "components": [
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "bool", "name": "claimed", "type": "bool" }
        ],
        "internalType": "struct TimeLockVault.Deposit[]",
        "name": "",
        "type": "tuple[]"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getUnlockTime",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
      "name": "getTotalDeposited",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getStartTime",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getUserCount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const connectBtn = document.getElementById("connectBtn");
  const homepageWrapper = document.getElementById("homepageWrapper");
  const dashboard = document.getElementById("dashboard");
  const depositForm = document.getElementById("depositForm");
  const depositAmount = document.getElementById("depositAmount");
  const savingsPurposeSelect = document.getElementById("savingsPurpose");

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

  const purposeProgressTitle = document.getElementById("purposeProgressTitle");
  const purposeProgressBar = document.getElementById("purposeProgressBar");
  const currentSavedEl = document.getElementById("currentSaved");
  const targetAmountEl = document.getElementById("targetAmount");

  const PURPOSE_KEY = "savelock_purpose_data";

  function showStatus(message, duration = 5000) {
    const statusDiv = document.getElementById("statusMessage");
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.classList.add("show");
    setTimeout(() => {
      statusDiv.classList.remove("show");
    }, duration);
  }

  function updateProgressDisplay(data) {
    const { purpose, saved, target } = data;
    purposeProgressTitle.textContent = `${purpose} Savings Progress`;
    currentSavedEl.textContent = saved.toFixed(4);
    targetAmountEl.textContent = target.toFixed(4);
    purposeProgressBar.value = Math.min((saved / target) * 100, 100);
  }

  function loadPurposeProgress() {
    const raw = localStorage.getItem(PURPOSE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      updateProgressDisplay(parsed);
    } catch (err) {
      console.error("❌ Failed to load progress:", err);
    }
  }

  connectBtn.addEventListener("click", async () => {
    try {
      if (!window.ethereum) {
        alert("Please use a browser with MetaMask or WalletConnect.");
        return;
      }

      provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId: currentChainId } = await provider.getNetwork();

      if (currentChainId !== chainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + chainId.toString(16) }]
          });
        } catch (err) {
          alert("Please switch to the Arbitrum Sepolia network.");
          return;
        }
      }

      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      contract = new ethers.Contract(contractAddress, abi, signer);

      homepageWrapper.style.display = "none";
      dashboard.style.display = "block";

      const rawUnlockTime = await contract.getUnlockTime();
      unlockTimestamp = Number(rawUnlockTime);
      startCountdown();
      await loadUserData();
      loadPurposeProgress();
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      alert("Connection failed");
    }
  });

  function startCountdown() {
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
        row.innerHTML = `
          <td>${ethers.utils.formatEther(d.amount)} ETH</td>
          <td>${new Date(Number(d.timestamp) * 1000).toLocaleString()}</td>
          <td>${status}</td>`;
        historyTableBody.appendChild(row);
      });

      const contractStartTime = await contract.getStartTime();
      startDateEl.textContent = new Date(Number(contractStartTime) * 1000).toLocaleString();

      const totalUsers = await contract.getUserCount();
      totalUsersEl.textContent = totalUsers.toString();

      const vaultBal = await provider.getBalance(contractAddress);
      vaultBalanceEl.textContent = `${ethers.utils.formatEther(vaultBal)} ETH`;
    } catch (err) {
      console.error("❌ Error loading user data:", err);
    }
  }

  depositForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (Date.now() >= unlockTimestamp * 1000) {
      alert("Savelock period has ended.");
      return;
    }

    const amount = parseFloat(depositAmount.value);
    const purpose = savingsPurposeSelect.value;

    if (!purpose) {
      alert("Please select what you're saving for.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }

    try {
      showStatus("Depositing...");
      const tx = await contract.deposit({ value: ethers.utils.parseEther(amount.toString()) });
      await tx.wait();
      showStatus("Deposit successful", 3000);

      const savedData = JSON.parse(localStorage.getItem(PURPOSE_KEY)) || {
        purpose,
        saved: 0,
        target: amount * 12 // Assume target is 12 months of this deposit
      };

      const updated = {
        purpose,
        saved: savedData.saved + amount,
        target: savedData.target
      };

      localStorage.setItem(PURPOSE_KEY, JSON.stringify(updated));
      updateProgressDisplay(updated);

      depositAmount.value = '';
      savingsPurposeSelect.value = '';
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

  // FAQ toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
});
