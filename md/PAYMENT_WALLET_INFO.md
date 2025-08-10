# Payment and Wallet Information

## 🏦 **Where Payments Go**

### **Smart Contract Address**
- **Contract**: `0x58ae7520F81DC3464574960B792D43A82BF0C3f1`
- **Network**: opBNB Testnet
- **Deployer**: `0xdA13e8F82C83d14E7aa639354054B7f914cA0998`

## 💰 **Payment Flow**

### **1. Group Creation**
- **Payment**: Goes to the smart contract
- **Amount**: Any amount sent with `createGroup()` function
- **Purpose**: Initial group funding
- **Recipient**: Smart contract holds the funds

### **2. Group Contributions**
- **Payment**: Goes to the smart contract
- **Amount**: Any amount sent with `contribute()` function
- **Purpose**: Group savings
- **Recipient**: Smart contract holds the funds

### **3. Group Withdrawal**
- **Payment**: Distributed from smart contract to group members
- **Amount**: Equal share to each member
- **Purpose**: Group payout
- **Recipients**: All group members get their share

### **4. Emergency Withdrawal**
- **Payment**: Goes to group creator with 10% penalty
- **Amount**: 90% of total group balance
- **Purpose**: Emergency access to funds
- **Recipient**: Group creator (with penalty)

## 🔐 **Wallet Roles**

### **Contract Owner (Deployer)**
- **Address**: `0xdA13e8F82C83d14E7aa639354054B7f914cA0998`
- **Role**: Can withdraw stuck funds
- **Power**: Admin access to contract

### **Group Creator**
- **Address**: Whoever creates the group
- **Role**: Can trigger emergency withdrawal
- **Power**: Can update group metadata

### **Group Members**
- **Address**: Members who join the group
- **Role**: Can contribute and vote for withdrawal
- **Power**: Equal voting rights

## 📊 **Fund Distribution**

### **Normal Withdrawal**
```
Total Group Balance
├── Member 1: Equal Share
├── Member 2: Equal Share
├── Member 3: Equal Share
└── ... (all members get equal amounts)
```

### **Emergency Withdrawal**
```
Total Group Balance
├── Group Creator: 90% (minus 10% penalty)
└── Penalty: 10% (stays in contract)
```

## 🎯 **Key Points**

✅ **All payments go to the smart contract first**  
✅ **Smart contract holds funds securely**  
✅ **Funds are distributed equally among members**  
✅ **Group creator can emergency withdraw with penalty**  
✅ **Contract owner can withdraw stuck funds**  

## 🔍 **How to Check**

### **Check Contract Balance**
```javascript
// View total contract balance
await contract.contractBalance()
```

### **Check Group Balance**
```javascript
// View specific group balance
await contract.getGroupBalance(groupId)
```

### **Check Member Contributions**
```javascript
// View member's contribution
const member = await contract.getMemberDetails(groupId, memberAddress)
console.log("Contribution:", member.contribution)
```

## 🚨 **Important Notes**

⚠️ **This is on opBNB Testnet** - Use test tokens only  
⚠️ **Funds are locked in smart contract** until withdrawal  
⚠️ **All members must vote** for normal withdrawal  
⚠️ **Emergency withdrawal has 10% penalty**  
⚠️ **Contract owner can access stuck funds**  

## 🎯 **Summary**

- **Payments**: Go to smart contract `0x58ae7520F81DC3464574960B792D43A82BF0C3f1`
- **Deployer**: `0xdA13e8F82C83d14E7aa639354054B7f914cA0998`
- **Distribution**: Equal shares to all group members
- **Security**: Funds are locked until group consensus 