// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Concordia is Ownable, ReentrancyGuard {
    uint256 private _groupIds;

    struct Group {
        uint256 id;
        string name;
        string description;
        uint256 goalAmount;
        uint256 dueDay;
        uint256 duration;
        uint256 withdrawalDate;
        address creator;
        bool isActive;
        uint256 createdAt;
        uint256 totalContributions;
        uint256 memberCount;
    }

    struct Member {
        bool isMember;
        uint256 contribution;
        uint256 auraPoints;
        bool hasVoted;
        uint256 joinedAt;
        string nickname;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        uint256 timestamp;
        uint256 auraPoints;
        bool isEarly;
        string transactionHash;
    }

    mapping(uint256 => Group) private groups;
    mapping(uint256 => mapping(address => Member)) private groupMembers;
    mapping(uint256 => address[]) private memberList;
    mapping(uint256 => uint256) private groupBalance;
    mapping(uint256 => Contribution[]) private groupContributions;

    event GroupCreated(
        uint256 indexed groupId, 
        address indexed creator, 
        string name,
        string description,
        uint256 goalAmount,
        uint256 duration,
        uint256 withdrawalDate
    );

    event JoinedGroup(uint256 indexed groupId, address indexed member, string nickname);

    event Contributed(
        uint256 indexed groupId, 
        address indexed member, 
        uint256 amount, 
        uint256 auraPoints,
        bool isEarly,
        string transactionHash
    );

    event WithdrawalExecuted(uint256 indexed groupId, uint256 totalAmount);
    event EmergencyWithdrawal(uint256 indexed groupId, address indexed executor, uint256 penaltyAmount);

    modifier onlyGroupCreator(uint256 groupId) {
        require(groups[groupId].creator == msg.sender, "Only group creator");
        _;
    }

    modifier onlyGroupMember(uint256 groupId) {
        require(groupMembers[groupId][msg.sender].isMember, "Only group member");
        _;
    }

    modifier groupExists(uint256 groupId) {
        require(groups[groupId].id != 0, "Group does not exist");
        _;
    }

    function createGroup(
        string memory _name,
        string memory _description,
        uint256 _goalAmount,
        uint256 _duration,
        uint256 _withdrawalDate,
        uint8 _dueDay
    ) external payable {
        require(_goalAmount > 0, "Goal must be positive");
        require(_duration > 0, "Duration must be positive");
        require(_withdrawalDate > block.timestamp, "Withdrawal date must be in future");
        require(_dueDay >= 1 && _dueDay <= 31, "Due day must be 1-31");

        unchecked {
            _groupIds++;
        }

        groups[_groupIds] = Group({
            id: _groupIds,
            name: _name,
            description: _description,
            goalAmount: _goalAmount,
            dueDay: _dueDay,
            duration: _duration,
            withdrawalDate: _withdrawalDate,
            creator: msg.sender,
            isActive: true,
            createdAt: block.timestamp,
            totalContributions: 0,
            memberCount: 1
        });

        groupMembers[_groupIds][msg.sender] = Member({
            isMember: true,
            contribution: 0,
            auraPoints: 5, // Creator gets 5 aura points
            hasVoted: false,
            joinedAt: block.timestamp,
            nickname: "Creator"
        });
        
        memberList[_groupIds].push(msg.sender);

        emit GroupCreated(
            _groupIds, 
            msg.sender, 
            _name,
            _description,
            _goalAmount,
            _duration,
            _withdrawalDate
        );
    }

    function joinGroup(uint256 groupId, string memory nickname) 
        external 
        payable 
        nonReentrant 
        groupExists(groupId) 
    {
        Group storage group = groups[groupId];
        require(group.isActive, "Group inactive");
        require(!groupMembers[groupId][msg.sender].isMember, "Already joined");
        require(memberList[groupId].length < 10, "Max 10 members");
        require(bytes(nickname).length > 0, "Nickname required");

        groupMembers[groupId][msg.sender] = Member({
            isMember: true,
            contribution: 0,
            auraPoints: 5,
            hasVoted: false,
            joinedAt: block.timestamp,
            nickname: nickname
        });
        
        memberList[groupId].push(msg.sender);
        group.memberCount++;

        emit JoinedGroup(groupId, msg.sender, nickname);
    }

    function contribute(uint256 groupId) 
        external 
        payable 
        nonReentrant 
        onlyGroupMember(groupId) 
    {
        Group storage group = groups[groupId];
        require(group.isActive, "Group inactive");
        require(msg.value > 0, "Contribution must be positive");
        require(block.timestamp < group.withdrawalDate, "Group closed");

        Member storage member = groupMembers[groupId][msg.sender];
        
        uint256 auraPoints = 1;
        bool isEarly = false;
        
        if (block.timestamp < group.createdAt + 7 days) {
            auraPoints = 3;
            isEarly = true;
        }

        member.contribution += msg.value;
        member.auraPoints += auraPoints;
        group.totalContributions += msg.value;
        groupBalance[groupId] += msg.value;

        groupContributions[groupId].push(Contribution({
            contributor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            auraPoints: auraPoints,
            isEarly: isEarly,
            transactionHash: ""
        }));

        emit Contributed(groupId, msg.sender, msg.value, auraPoints, isEarly, "");
    }

    function voteForWithdrawal(uint256 groupId) 
        external 
        onlyGroupMember(groupId) 
    {
        Group storage group = groups[groupId];
        require(group.isActive, "Group inactive");
        require(block.timestamp >= group.withdrawalDate, "Withdrawal date not reached");
        
        Member storage member = groupMembers[groupId][msg.sender];
        require(!member.hasVoted, "Already voted");

        member.hasVoted = true;

        bool allVoted = true;
        for (uint256 i = 0; i < memberList[groupId].length; i++) {
            if (!groupMembers[groupId][memberList[groupId][i]].hasVoted) {
                allVoted = false;
                break;
            }
        }

        if (allVoted) {
            _executeWithdrawal(groupId);
        }
    }

    function emergencyWithdrawal(uint256 groupId) 
        external 
        onlyGroupCreator(groupId) 
    {
        Group storage group = groups[groupId];
        require(group.isActive, "Group inactive");
        require(block.timestamp >= group.withdrawalDate + 30 days, "Not available yet");

        uint256 penaltyAmount = groupBalance[groupId] * 5 / 100;
        uint256 withdrawalAmount = groupBalance[groupId] - penaltyAmount;

        group.isActive = false;
        groupBalance[groupId] = 0;

        (bool success, ) = group.creator.call{value: withdrawalAmount}("");
        require(success, "Transfer failed");

        emit EmergencyWithdrawal(groupId, msg.sender, penaltyAmount);
    }

    function _executeWithdrawal(uint256 groupId) private {
        Group storage group = groups[groupId];
        uint256 totalAmount = groupBalance[groupId];
        
        group.isActive = false;
        groupBalance[groupId] = 0;

        uint256 memberCount = memberList[groupId].length;
        uint256 sharePerMember = totalAmount / memberCount;

        for (uint256 i = 0; i < memberCount; i++) {
            address memberAddress = memberList[groupId][i];
            (bool success, ) = memberAddress.call{value: sharePerMember}("");
            require(success, "Transfer failed");
        }

        emit WithdrawalExecuted(groupId, totalAmount);
    }

    // View functions
    function getGroupDetails(uint256 groupId) external view returns (Group memory) {
        return groups[groupId];
    }

    function getMemberDetails(uint256 groupId, address user) external view returns (Member memory) {
        return groupMembers[groupId][user];
    }

    function getMembers(uint256 groupId) external view returns (address[] memory) {
        return memberList[groupId];
    }

    function getGroupContributions(uint256 groupId) external view returns (Contribution[] memory) {
        return groupContributions[groupId];
    }

    function getGroupBalance(uint256 groupId) external view returns (uint256) {
        return groupBalance[groupId];
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTotalGroups() external view returns (uint256) {
        return _groupIds;
    }

    function isGroupMember(uint256 groupId, address user) external view returns (bool) {
        return groupMembers[groupId][user].isMember;
    }

    function withdrawStuckFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
