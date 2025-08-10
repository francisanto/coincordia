const express = require('express');
const router = express.Router();
const AuraReward = require('../models/AuraReward');
const User = require('../models/User');
const crypto = require('crypto');

// Get user's aura rewards
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Find rewards
    const rewards = await AuraReward.find({ userId }).sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, rewards });
  } catch (error) {
    console.error('❌ Error fetching aura rewards:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch aura rewards' });
  }
});

// Create aura reward
router.post('/', async (req, res) => {
  try {
    const { userId, auraPointsSpent, rewardType, rewardDetails } = req.body;
    
    if (!userId || !auraPointsSpent || !rewardType) {
      return res.status(400).json({ success: false, message: 'User ID, aura points spent, and reward type are required' });
    }
    
    // Check if user has enough aura points
    const user = await User.findOne({ address: userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.auraPoints < auraPointsSpent) {
      return res.status(400).json({ success: false, message: 'Not enough aura points' });
    }
    
    // Generate unique ID
    const id = crypto.randomBytes(16).toString('hex');
    
    // Create reward
    const reward = await AuraReward.create({
      id,
      userId,
      auraPointsSpent,
      rewardType,
      rewardDetails,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Deduct aura points
    await User.findOneAndUpdate(
      { address: userId },
      { 
        $inc: { auraPoints: -auraPointsSpent },
        updatedAt: new Date()
      }
    );
    
    return res.status(201).json({ success: true, reward });
  } catch (error) {
    console.error('❌ Error creating aura reward:', error);
    return res.status(500).json({ success: false, message: 'Failed to create aura reward' });
  }
});

// Update aura reward status
router.put('/:rewardId', async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { status, transactionHash } = req.body;
    
    if (!rewardId || !status) {
      return res.status(400).json({ success: false, message: 'Reward ID and status are required' });
    }
    
    if (!['pending', 'confirmed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    // Update reward
    const updatedReward = await AuraReward.findOneAndUpdate(
      { id: rewardId },
      { 
        status,
        transactionHash: transactionHash || undefined
      },
      { new: true }
    );
    
    if (!updatedReward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    
    // If failed, refund aura points
    if (status === 'failed') {
      await User.findOneAndUpdate(
        { address: updatedReward.userId },
        { 
          $inc: { auraPoints: updatedReward.auraPointsSpent },
          updatedAt: new Date()
        }
      );
    }
    
    return res.status(200).json({ success: true, reward: updatedReward });
  } catch (error) {
    console.error('❌ Error updating aura reward:', error);
    return res.status(500).json({ success: false, message: 'Failed to update aura reward' });
  }
});

module.exports = router;