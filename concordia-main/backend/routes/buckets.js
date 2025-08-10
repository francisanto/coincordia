const express = require('express');
const router = express.Router();
const Bucket = require('../models/Bucket');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new bucket
 * POST /api/buckets
 */
router.post('/', async (req, res) => {
  try {
    const { bucketName, groupId, creator, permissions } = req.body;

    if (!bucketName || !groupId || !creator) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bucketName, groupId, creator'
      });
    }

    // Check if bucket with this name already exists
    const existingBucket = await Bucket.findOne({ bucketName });
    if (existingBucket) {
      return res.status(409).json({
        success: false,
        error: 'Bucket with this name already exists'
      });
    }

    // Generate a unique bucket ID
    const bucketId = uuidv4();

    // Create the bucket
    const bucket = new Bucket({
      bucketId,
      bucketName,
      groupId,
      creator,
      permissions: {
        creator,
        members: []
      },
      ...req.body
    });

    await bucket.save();

    console.log('✅ Bucket created successfully:', bucketName);
    
    return res.status(201).json({
      success: true,
      bucketId,
      bucketName,
      groupId,
      creator
    });
  } catch (error) {
    console.error('❌ Error creating bucket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create bucket',
      details: error.message
    });
  }
});

/**
 * Get bucket by ID
 * GET /api/buckets/:bucketId
 */
router.get('/:bucketId', async (req, res) => {
  try {
    const { bucketId } = req.params;
    
    const bucket = await Bucket.findOne({ bucketId });
    
    if (!bucket) {
      return res.status(404).json({
        success: false,
        error: 'Bucket not found'
      });
    }
    
    return res.json({
      success: true,
      bucket
    });
  } catch (error) {
    console.error('❌ Error getting bucket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get bucket',
      details: error.message
    });
  }
});

/**
 * Get buckets for a group
 * GET /api/buckets/group/:groupId
 */
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const buckets = await Bucket.find({ groupId });
    
    return res.json({
      success: true,
      buckets
    });
  } catch (error) {
    console.error('❌ Error getting group buckets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get group buckets',
      details: error.message
    });
  }
});

/**
 * Update bucket permissions
 * PUT /api/buckets/:bucketId/permissions
 */
router.put('/:bucketId/permissions', async (req, res) => {
  try {
    const { bucketId } = req.params;
    const { permissions } = req.body;
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'Permissions are required'
      });
    }
    
    const bucket = await Bucket.findOneAndUpdate(
      { bucketId },
      { $set: { permissions } },
      { new: true }
    );
    
    if (!bucket) {
      return res.status(404).json({
        success: false,
        error: 'Bucket not found'
      });
    }
    
    return res.json({
      success: true,
      bucket
    });
  } catch (error) {
    console.error('❌ Error updating bucket permissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update bucket permissions',
      details: error.message
    });
  }
});

/**
 * Delete a bucket
 * DELETE /api/buckets/:bucketId
 */
router.delete('/:bucketId', async (req, res) => {
  try {
    const { bucketId } = req.params;
    
    const result = await Bucket.deleteOne({ bucketId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bucket not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Bucket deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting bucket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete bucket',
      details: error.message
    });
  }
});

module.exports = router;