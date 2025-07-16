// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SavelockUpgradeable
 * @notice ETH savings contract with multiple fixed lock durations, per-user tracking,
 *         claim history, deposit logs, and full analytics. No looping on deposit or claim.
 */
contract SaveLockVault {
    address public owner;
    uint256 public totalUsers;
    uint256 public totalDeposited;
    uint256 public totalClaimedAmount;
    uint256 public totalClaims;

    // Fixed durations in seconds (30d, 90d, 180d, 1y, 3y, 5y)
    uint256[] public durations = [
        30 days,
        90 days,
        180 days,
        365 days,
        3 * 365 days,
        5 * 365 days
    ];

    struct DepositEvent {
        uint256 amount;
        uint256 timestamp;
    }

    struct ClaimEvent {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => bool) public hasEverDeposited;
    mapping(address => mapping(uint256 => uint256)) public userLockedAmount;
    mapping(address => mapping(uint256 => uint256)) public lockStartTime;
    mapping(address => mapping(uint256 => bool)) public hasClaimed;
    mapping(address => mapping(uint256 => DepositEvent[])) public userDepositHistory;
    mapping(address => mapping(uint256 => ClaimEvent)) public userClaimHistory;

    event Deposited(address indexed user, uint256 amount, uint256 duration, uint256 timestamp);
    event Claimed(address indexed user, uint256 amount, uint256 duration, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    function isValidDuration(uint256 duration) public view returns (bool) {
        for (uint256 i = 0; i < durations.length; i++) {
            if (durations[i] == duration) return true;
        }
        return false;
    }

    function deposit(uint256 duration) external payable {
        require(isValidDuration(duration), "Invalid lock duration");
        require(msg.value > 0, "Zero deposit not allowed");
        require(!hasClaimed[msg.sender][duration], "Claim first before resaving");

        if (lockStartTime[msg.sender][duration] == 0) {
            lockStartTime[msg.sender][duration] = block.timestamp;
        }

        if (!hasEverDeposited[msg.sender]) {
            hasEverDeposited[msg.sender] = true;
            totalUsers++;
        }

        userLockedAmount[msg.sender][duration] += msg.value;
        totalDeposited += msg.value;

        userDepositHistory[msg.sender][duration].push(DepositEvent({
            amount: msg.value,
            timestamp: block.timestamp
        }));

        emit Deposited(msg.sender, msg.value, duration, block.timestamp);
    }

    function claim(uint256 duration) external {
        require(isValidDuration(duration), "Invalid lock duration");
        require(!hasClaimed[msg.sender][duration], "Already claimed");

        uint256 start = lockStartTime[msg.sender][duration];
        require(start > 0, "No savings under this duration");
        require(block.timestamp >= start + duration, "Still locked");

        uint256 amount = userLockedAmount[msg.sender][duration];
        require(amount > 0, "Nothing to claim");

        hasClaimed[msg.sender][duration] = true;
        userLockedAmount[msg.sender][duration] = 0;
        totalClaims++;
        totalClaimedAmount += amount;

        userClaimHistory[msg.sender][duration] = ClaimEvent({
            amount: amount,
            timestamp: block.timestamp
        });

        payable(msg.sender).transfer(amount);
        emit Claimed(msg.sender, amount, duration, block.timestamp);
    }

    function getUnlockTime(address user, uint256 duration) external view returns (uint256) {
        return lockStartTime[user][duration] + duration;
    }

    function getDurations() external view returns (uint256[] memory) {
        return durations;
    }

    function getUserDepositHistory(address user, uint256 duration) external view returns (DepositEvent[] memory) {
        return userDepositHistory[user][duration];
    }

    function getUserClaimInfo(address user, uint256 duration) external view returns (ClaimEvent memory) {
        return userClaimHistory[user][duration];
    }

    receive() external payable {
        revert("Use deposit() instead");
    }
}
