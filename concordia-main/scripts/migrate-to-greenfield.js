#!/usr/bin/env node

/**
 * Migration Script: localStorage to Greenfield
 * 
 * This script migrates all existing localStorage data to BNB Greenfield storage.
 * Run this script after setting up your Greenfield credentials.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting migration from localStorage to Greenfield...\n');

// Check if running in browser environment
if (typeof window !== 'undefined') {
  console.log('📱 Running in browser environment');
  
  // Migration function for browser
  async function migrateInBrowser() {
    try {
      // Import the data persistence service
      const { dataPersistenceService } = await import('../lib/data-persistence.ts');
      
      console.log('🔄 Starting migration...');
      
      // Migrate all localStorage data to Greenfield
      const result = await dataPersistenceService.migrateFromLocalStorage();
      
      console.log(`\n🎉 Migration complete!`);
      console.log(`✅ Successfully migrated: ${result.migrated} groups`);
      console.log(`❌ Failed to migrate: ${result.failed} groups`);
      
      if (result.failed > 0) {
        console.log('\n⚠️ Some groups failed to migrate. Check the console for details.');
      }
      
      // Clear old localStorage data (optional)
      const shouldClear = confirm('Do you want to clear the old localStorage data? (This cannot be undone)');
      if (shouldClear) {
        localStorage.removeItem('concordia-groups');
        console.log('🗑️ Old localStorage data cleared');
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }
  
  // Run migration
  migrateInBrowser();
  
} else {
  console.log('🖥️ Running in Node.js environment');
  
  // Node.js migration script
  async function migrateInNode() {
    try {
      // Load environment variables
      require('dotenv').config({ path: '.env.local' });
      
      // Check required environment variables
      const requiredEnvVars = [
        'GREENFIELD_ACCESS_KEY',
        'GREENFIELD_SECRET_KEY',
        'GREENFIELD_BUCKET_NAME',
        'GREENFIELD_ENDPOINT'
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.log('\nPlease set these variables in your .env.local file');
        process.exit(1);
      }
      
      console.log('✅ Environment variables configured');
      
      // Import required modules
      const { greenfieldService } = require('../lib/greenfield-service.ts');
      const { dataPersistenceService } = require('../lib/data-persistence.ts');
      
      console.log('🔄 Starting migration...');
      
      // Migrate all localStorage data to Greenfield
      const result = await dataPersistenceService.migrateFromLocalStorage();
      
      console.log(`\n🎉 Migration complete!`);
      console.log(`✅ Successfully migrated: ${result.migrated} groups`);
      console.log(`❌ Failed to migrate: ${result.failed} groups`);
      
      if (result.failed > 0) {
        console.log('\n⚠️ Some groups failed to migrate. Check the logs for details.');
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
  
  // Run migration
  migrateInNode();
}

// Migration instructions
console.log('\n📋 Migration Instructions:');
console.log('1. Ensure your Greenfield credentials are configured in .env.local');
console.log('2. Run this script to migrate all existing data');
console.log('3. Verify that data is accessible in Greenfield');
console.log('4. Test the application to ensure everything works');
console.log('\n🔗 Greenfield Console: https://greenfield.bnbchain.org/');
console.log('📚 Documentation: https://docs.bnbchain.org/docs/greenfield/'); 