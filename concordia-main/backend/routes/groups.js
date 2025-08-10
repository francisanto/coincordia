const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Invite = require('../models/Invite');
const crypto = require('crypto');

// Get all groups for a user
router.get('/', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'User address is required' });
    }
    
    // Find user to check if admin
    const user = await User.findOne({ address });
    const isAdmin = user?.isAdmin || false;
    
    let groups = [];
    
    try {
      if (isAdmin) {
        // Admin can see all groups
        groups = await Group.find({});
        console.log(`📊 Found ${groups.length} groups for admin user: ${address}`);
      } else {
        // Regular users can only see groups they're members of
        groups = await Group.find({ 'members.address': address });
        console.log(`📊 Found ${groups.length} groups for regular user: ${address}`);
      }
    } catch (dbError) {
      console.error('❌ Database error fetching groups:', dbError);
      // Return empty array instead of failing
      groups = [];
    }
    
    return res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch groups',
      error: error.message || 'Unknown error'
    });
  }
});

// Get a specific group
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'User address is required' });
    }
    
    const group = await Group.findOne({ groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Check if user is a member or admin
    const user = await User.findOne({ address });
    const isAdmin = user?.isAdmin || false;
    const isMember = group.members.some(member => member.address === address);
    
    if (!isAdmin && !isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error('❌ Error fetching group:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch group' });
  }
});

// Create a new group
router.post('/', async (req, res) => {
  try {
    const { group } = req.body;
    
    if (!group || !group.groupId || !group.creator) {
      return res.status(400).json({ success: false, message: 'Invalid group data' });
    }
    
    // Check if group already exists
    const existingGroup = await Group.findOne({ groupId: group.groupId });
    
    if (existingGroup) {
      // Return the existing group instead of error to prevent duplicate creation
      console.log('⚠️ Group already exists, returning existing group:', group.groupId);
      return res.status(200).json({ 
        success: true, 
        group: existingGroup,
        message: 'Group already exists, returning existing group'
      });
    }
    
    // Create the group
    const newGroup = await Group.create({
      ...group,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Update user's groups
    await User.findOneAndUpdate(
      { address: group.creator },
      { $addToSet: { groups: group.groupId } },
      { upsert: true }
    );
    
    return res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    console.error('❌ Error creating group:', error);
    return res.status(500).json({ success: false, message: 'Failed to create group' });
  }
});

// Update a group
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group, address } = req.body;
    
    if (!group || !address) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }
    
    const existingGroup = await Group.findOne({ groupId });
    
    if (!existingGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Check if user is creator or admin
    const user = await User.findOne({ address });
    const isAdmin = user?.isAdmin || false;
    const isCreator = existingGroup.creator === address;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Update the group
    const updatedGroup = await Group.findOneAndUpdate(
      { groupId },
      { ...group, updatedAt: new Date() },
      { new: true }
    );
    
    return res.status(200).json({ success: true, group: updatedGroup });
  } catch (error) {
    console.error('❌ Error updating group:', error);
    return res.status(500).json({ success: false, message: 'Failed to update group' });
  }
});

// Generate invite code
router.post('/:groupId/invite', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'User address is required' });
    }
    
    const group = await Group.findOne({ groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Check if user is creator or admin
    const user = await User.findOne({ address });
    const isAdmin = user?.isAdmin || false;
    const isCreator = group.creator === address;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Generate invite code
    const inviteCode = crypto.randomBytes(6).toString('hex');
    
    // Save invite code
    await Invite.create({
      inviteCode,
      groupId,
      createdBy: address,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return res.status(201).json({ success: true, inviteCode });
  } catch (error) {
    console.error('❌ Error generating invite code:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate invite code' });
  }
});

// Join group with invite code
router.post('/join', async (req, res) => {
  try {
    const { inviteCode, address, nickname } = req.body;
    
    if (!inviteCode || !address) {
      return res.status(400).json({ success: false, message: 'Invite code and address are required' });
    }
    
    // Find invite
    const invite = await Invite.findOne({ inviteCode });
    
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }
    
    if (invite.isUsed) {
      return res.status(400).json({ success: false, message: 'Invite code already used' });
    }
    
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invite code expired' });
    }
    
    // Find group
    const group = await Group.findOne({ groupId: invite.groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Check if user is already a member
    const isMember = group.members.some(member => member.address === address);
    
    if (isMember) {
      return res.status(400).json({ success: false, message: 'Already a member of this group' });
    }
    
    // Add user to group
    const newMember = {
      address,
      nickname: nickname || '',
      joinedAt: new Date(),
      role: 'member',
      contribution: 0,
      auraPoints: 0,
      hasVoted: false,
      status: 'active'
    };
    
    await Group.findOneAndUpdate(
      { groupId: invite.groupId },
      { 
        $push: { members: newMember },
        updatedAt: new Date()
      }
    );
    
    // Mark invite as used
    await Invite.findOneAndUpdate(
      { inviteCode },
      {
        isUsed: true,
        usedBy: address,
        usedAt: new Date()
      }
    );
    
    // Update user's groups
    await User.findOneAndUpdate(
      { address },
      { 
        $addToSet: { groups: invite.groupId },
        nickname: nickname || undefined,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    return res.status(200).json({ success: true, groupId: invite.groupId });
  } catch (error) {
    console.error('❌ Error joining group:', error);
    return res.status(500).json({ success: false, message: 'Failed to join group' });
  }
});

module.exports = router;