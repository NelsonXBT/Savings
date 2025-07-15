/* === Frequently Asked Questions === */

document.addEventListener("DOMContentLoaded", () => {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
});



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
  const targetSavingsPage = document.getElementById("targetSavingsPage");
  const targetFormPage = document.getElementById("targetFormPage");
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
  const savingsProgressSection = document.getElementById('savingsProgressSection');
  const progressTitle = document.getElementById('progressTitle');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const savingsReminder = document.getElementById('savingsReminder');

  // === Start Saving Buttons (Target Selection) ===
  document.querySelectorAll('.startSavingBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedPurpose = btn.dataset.purpose;
      localStorage.setItem("savelock-purpose", selectedPurpose);
      document.getElementById("selectedPurposeHeading").textContent = `Set Your ${selectedPurpose} Plan`;
      targetSavingsPage.style.display = "none";
      targetFormPage.style.display = "block";
    });
  });

  // === Handle Target Savings Form ===
  document.getElementById("targetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const targetAmount = document.getElementById("targetAmount").value;
    const frequency = document.getElementById("savingFrequency").value;

    if (!targetAmount || !frequency) {
      alert("Please fill in all fields");
      return;
    }

    localStorage.setItem("savelock-targetAmount", targetAmount);
    localStorage.setItem("savelock-frequency", frequency);

    targetFormPage.style.display = "none";
    dashboard.style.display = "block";

    updateDashboardFromStorage();
  });

  function updateDashboardFromStorage() {
    const purpose = localStorage.getItem("savelock-purpose") || "Savings";
    const targetAmount = parseFloat(localStorage.getItem("savelock-targetAmount")) || 0;
    const frequency = localStorage.getItem("savelock-frequency") || "monthly";

    // Update title
    progressTitle.textContent = `Your ${purpose} Savings Progress`;

    // Show reminder
    const lastSaved = localStorage.getItem("savelock-lastSaved");
    let reminder = `You haven’t saved ${frequency === "daily" ? "today" : frequency === "weekly" ? "this week" : "this month"}.`;
    savingsReminder.textContent = reminder;

    savingsProgressSection.style.display = "block";
  }

  function showStatus(message, duration = 5000) {
    const statusDiv = document.getElementById("statusMessage");
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.classList.add("show");
    setTimeout(() => {
      statusDiv.classList.remove("show");
    }, duration);
  }

  connectBtn.addEventListener("click", async () => {
    try {
      if (!window.ethereum) {
        alert("Please use a browser with an Ethereum wallet like MetaMask.");
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
          showStatus("Network changed successfully. Click Connect Wallet now", 5000);
          return;
        } catch (switchError) {
          if (switchError.code === 4902) {
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
            showStatus("Network added successfully. Click Connect Wallet now", 5000);
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

      homepageWrapper.style.display = "none";
      targetSavingsPage.style.display = "block";

    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      alert("Wallet connection failed: " + (err.message || "Unknown error"));
    }
  });
});
