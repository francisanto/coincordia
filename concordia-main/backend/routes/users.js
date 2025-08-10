const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');

// Get user profile
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'User address is required' });
    }
    
    // Find user
    let user = await User.findOne({ address });
    
    if (!user) {
      // Create user if not exists
      user = await User.create({
        address,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      });
    } else {
      // Update last login
      await User.findOneAndUpdate(
        { address },
        { lastLogin: new Date() }
      );
    }
    
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { nickname, email } = req.body;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'User address is required' });
    }
    
    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { address },
      { 
        nickname,
        email,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Get user's groups
router.get('/:address/groups', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'User address is required' });
    }
    
    // Find user to check if admin
    let user;
    try {
      user = await User.findOne({ address });
    } catch (userError) {
      console.error('❌ Error finding user:', userError);
      // Continue with null user instead of failing
      user = null;
    }
    
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
    } catch (groupError) {
      console.error('❌ Database error fetching groups:', groupError);
      // Return empty array instead of failing
      groups = [];
    }
    
    return res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error('❌ Error fetching user groups:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user groups',
      error: error.message || 'Unknown error'
    });
  }
});

// Update user's aura points
router.put('/:address/aura', async (req, res) => {
  try {
    const { address } = req.params;
    const { points, operation } = req.body;
    
    if (!address || !points || !operation) {
      return res.status(400).json({ success: false, message: 'Address, points, and operation are required' });
    }
    
    if (!['add', 'subtract', 'set'].includes(operation)) {
      return res.status(400).json({ success: false, message: 'Invalid operation' });
    }
    
    let updateQuery = {};
    
    if (operation === 'add') {
      updateQuery = { $inc: { auraPoints: points } };
    } else if (operation === 'subtract') {
      updateQuery = { $inc: { auraPoints: -points } };
    } else if (operation === 'set') {
      updateQuery = { $set: { auraPoints: points } };
    }
    
    // Update user's aura points
    const updatedUser = await User.findOneAndUpdate(
      { address },
      {
        ...updateQuery,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('❌ Error updating aura points:', error);
    return res.status(500).json({ success: false, message: 'Failed to update aura points' });
  }
});

module.exports = router;