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
        string greenfieldObjectId;
        string greenfieldMetadataHash;
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
    mapping(uint256 => string) private groupMetadataHashes;

    event GroupCreated(
        uint256 indexed groupId, 
        address indexed creator, 
        string name,
        string description,
        uint256 goalAmount,
        uint256 duration,
        uint256 withdrawalDate,
        string greenfieldObjectId,
        string greenfieldMetadataHash
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
    event GreenfieldObjectUpdated(uint256 indexed groupId, string newObjectId, string newMetadataHash);
    event GroupMetadataUpdated(uint256 indexed groupId, string metadataHash);

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
        uint8 _dueDay,
        string memory _greenfieldObjectId,
        string memory _greenfieldMetadataHash
    ) external payable {
        require(_goalAmount > 0, "Goal must be positive");
        require(_duration > 0, "Duration must be positive");
        require(_withdrawalDate > block.timestamp, "Withdrawal date must be in future");
        require(_dueDay >= 1 && _dueDay <= 31, "Due day must be 1-31");
        require(bytes(_greenfieldObjectId).length > 0, "Greenfield object required");
        require(bytes(_greenfieldMetadataHash).length > 0, "Metadata hash required");

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
            greenfieldObjectId: _greenfieldObjectId,
            greenfieldMetadataHash: _greenfieldMetadataHash,
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
            _withdrawalDate,
            _greenfieldObjectId,
            _greenfieldMetadataHash
        );
    }

    function joinGroup(uint256 groupId, string memory nickname) external payable nonReentrant groupExists(groupId) {
        Group storage group = groups[groupId];
        require(group.isActive, "Group inactive");
        require(!groupMembers[groupId][msg.sender].isMember, "Already joined");
        require(memberList[groupId].length < 10, "Max 10 members");
        require(bytes(nickname).length > 0, "Nickname required");

        groupMembers[groupId][msg.sender] = Member({
            isMember: true,
            contribution: 0,
            auraPoints: 5, // Initial aura
            hasVoted: false,
            joinedAt: block.timestamp,
            nickname: nickname
        });
        
        memberList[groupId].push(msg.sender);
        group.memberCount++;

        emit JoinedGroup(groupId, msg.sender, nickname);
    }

    function contribute(uint256 groupId) external payable nonReentrant onlyGroupMember(groupId) groupExists(groupId) {
        Group storage group = groups[groupId];
        require(group.isActive, "Inactive group");
        require(msg.value > 0, "No ETH sent");

        Member storage member = groupMembers[groupId][msg.sender];
        member.contribution += msg.value;
        groupBalance[groupId] += msg.value;
        group.totalContributions++;

        // Bonus aura if contributed early
        uint256 today = (block.timestamp / 86400) % 30 + 1;
        bool isEarly = today <= group.dueDay;
        uint256 auraEarned = isEarly ? 10 : 5;
        member.auraPoints += auraEarned;

        // Store contribution details
        Contribution memory newContribution = Contribution({
            contributor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            auraPoints: auraEarned,
            isEarly: isEarly,
            transactionHash: ""
        });
        
        groupContributions[groupId].push(newContribution);

        emit Contributed(groupId, msg.sender, msg.value, auraEarned, isEarly, "");
    }

    function voteForWithdrawal(uint256 groupId) external onlyGroupMember(groupId) groupExists(groupId) {
        require(groups[groupId].isActive, "Inactive group");

        Member storage member = groupMembers[groupId][msg.sender];
        require(!member.hasVoted, "Already voted");
        member.hasVoted = true;

        // Check if all members voted
        address[] memory members = memberList[groupId];
        for (uint256 i = 0; i < members.length; i++) {
            if (!groupMembers[groupId][members[i]].hasVoted) {
                return;
            }
        }

        _executeWithdrawal(groupId);
    }

    function _executeWithdrawal(uint256 groupId) private {
        Group storage group = groups[groupId];
        group.isActive = false;

        uint256 balance = groupBalance[groupId];
        address[] memory members = memberList[groupId];
        uint256 share = balance / members.length;

        for (uint256 i = 0; i < members.length; i++) {
            payable(members[i]).transfer(share);
        }

        emit WithdrawalExecuted(groupId, balance);
    }

    function emergencyWithdrawal(uint256 groupId) external onlyGroupCreator(groupId) groupExists(groupId) {
        Group storage group = groups[groupId];
        require(group.isActive, "Already withdrawn");
        group.isActive = false;

        uint256 balance = groupBalance[groupId];
        uint256 penalty = (balance * 10) / 100;
        uint256 withdrawable = balance - penalty;

        payable(msg.sender).transfer(withdrawable);
        emit EmergencyWithdrawal(groupId, msg.sender, penalty);
    }

    function updateGreenfieldObject(uint256 groupId, string memory newObjectId, string memory newMetadataHash) 
        external onlyGroupCreator(groupId) groupExists(groupId) {
        require(bytes(newObjectId).length > 0, "Empty object ID");
        require(bytes(newMetadataHash).length > 0, "Empty metadata hash");
        
        groups[groupId].greenfieldObjectId = newObjectId;
        groups[groupId].greenfieldMetadataHash = newMetadataHash;

        emit GreenfieldObjectUpdated(groupId, newObjectId, newMetadataHash);
    }

    function updateGroupMetadata(uint256 groupId, string memory metadataHash) 
        external onlyGroupCreator(groupId) groupExists(groupId) {
        require(bytes(metadataHash).length > 0, "Empty metadata hash");
        
        groups[groupId].greenfieldMetadataHash = metadataHash;
        groupMetadataHashes[groupId] = metadataHash;

        emit GroupMetadataUpdated(groupId, metadataHash);
    }

    // View Functions

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

    function getGroupMetadataHash(uint256 groupId) external view returns (string memory) {
        return groupMetadataHashes[groupId];
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

    // Admin fallback
    function withdrawStuckFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}