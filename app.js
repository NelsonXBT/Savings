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

  async function handlePageFlow() {
    const savedPurpose = localStorage.getItem("savelockPurpose");
    const savedAmount = localStorage.getItem("savelockTargetAmount");
    const savedFreq = localStorage.getItem("savelockFrequency");

    if (savedPurpose && savedAmount && savedFreq) {
      homepageWrapper.style.display = "none";
      targetSavingsPage.style.display = "none";
      targetFormPage.style.display = "none";
      dashboard.style.display = "block";
      updateProgressBar();
      await loadUserData();
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

      await handlePageFlow();
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      alert("Wallet connection failed: " + (err.message || "Unknown error"));
    }
  });

  // Rest of logic remains untouched...
});
