
import { Client } from '@bnb-chain/greenfield-js-sdk';
import { GroupMetadata, MemberData, ContributionData } from './greenfield-service';

export interface GreenfieldConfig {
  endpoint: string;
  chainId: string;
  bucketName: string;
  bucketId: string;
}

export class GreenfieldDirectService {
  private client: any = null;
  private config: GreenfieldConfig;

  constructor() {
    this.config = {
      endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
      chainId: process.env.GREENFIELD_CHAIN_ID || "5600",
      bucketName: process.env.GREENFIELD_BUCKET_NAME || "concordia-data",
      bucketId: process.env.GREENFIELD_BUCKET_ID || "0x000000000000000000000000000000000000000000000000000000000000566f",
    };
  }

  private async initClient() {
    if (!this.client) {
      try {
        this.client = Client.create(this.config.endpoint, this.config.chainId);
        console.log('✅ Greenfield client initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Greenfield client:', error);
        throw error;
      }
    }
    return this.client;
  }

  async saveGroup(groupId: string, groupData: GroupMetadata): Promise<boolean> {
    try {
      const client = await this.initClient();
      const objectName = `groups/group_${groupId}.json`;
      
      const metadata = {
        ...groupData,
        updatedAt: new Date().toISOString(),
        version: "1.0",
      };

      await client.object.createObject({
        bucketName: this.config.bucketName,
        objectName: objectName,
        creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000",
        visibility: "VISIBILITY_TYPE_PUBLIC_READ",
        contentType: "application/json",
        redundancyType: "REDUNDANCY_EC_TYPE",
        payload: Buffer.from(JSON.stringify(metadata)),
      });

      console.log('✅ Group saved to Greenfield:', groupId);
      return true;
    } catch (error) {
      console.error('❌ Error saving group to Greenfield:', error);
      return false;
    }
  }

  async getGroup(groupId: string): Promise<GroupMetadata | null> {
    try {
      const client = await this.initClient();
      const objectName = `groups/group_${groupId}.json`;

      const objectData = await client.object.downloadFile({
        bucketName: this.config.bucketName,
        objectName: objectName,
      });

      const groupData = JSON.parse(objectData.toString());
      console.log('✅ Group retrieved from Greenfield:', groupId);
      return groupData;
    } catch (error) {
      console.error('❌ Error retrieving group from Greenfield:', error);
      return null;
    }
  }

  async getAllGroups(): Promise<GroupMetadata[]> {
    try {
      const client = await this.initClient();
      
      const listObjectsResponse = await client.object.listObjects({
        bucketName: this.config.bucketName,
        prefix: "groups/",
        maxKeys: 1000,
      });

      if (!listObjectsResponse.objects) {
        return [];
      }

      const groups: GroupMetadata[] = [];
      for (const object of listObjectsResponse.objects) {
        try {
          const objectData = await client.object.downloadFile({
            bucketName: this.config.bucketName,
            objectName: object.objectName,
          });
          const groupData = JSON.parse(objectData.toString());
          groups.push(groupData);
        } catch (error) {
          console.error(`❌ Error fetching group ${object.objectName}:`, error);
        }
      }

      console.log('✅ All groups retrieved from Greenfield:', groups.length);
      return groups;
    } catch (error) {
      console.error('❌ Error retrieving all groups from Greenfield:', error);
      return [];
    }
  }

  async updateGroup(groupId: string, updates: Partial<GroupMetadata>): Promise<boolean> {
    try {
      const existingGroup = await this.getGroup(groupId);
      if (!existingGroup) {
        console.error('❌ Group not found for update:', groupId);
        return false;
      }

      const updatedGroup = {
        ...existingGroup,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return await this.saveGroup(groupId, updatedGroup);
    } catch (error) {
      console.error('❌ Error updating group:', error);
      return false;
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const client = await this.initClient();
      const objectName = `groups/group_${groupId}.json`;

      await client.object.deleteObject({
        bucketName: this.config.bucketName,
        objectName: objectName,
      });

      console.log('✅ Group deleted from Greenfield:', groupId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting group from Greenfield:', error);
      return false;
    }
  }

  async uploadFile(file: File, fileName: string): Promise<string | null> {
    try {
      const client = await this.initClient();
      const objectName = `uploads/${Date.now()}_${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await client.object.createObject({
        bucketName: this.config.bucketName,
        objectName: objectName,
        creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000",
        visibility: "VISIBILITY_TYPE_PUBLIC_READ",
        contentType: file.type,
        redundancyType: "REDUNDANCY_EC_TYPE",
        payload: buffer,
      });

      console.log('✅ File uploaded to Greenfield:', objectName);
      return objectName;
    } catch (error) {
      console.error('❌ Error uploading file to Greenfield:', error);
      return null;
    }
  }

  async saveInvite(inviteCode: string, groupId: string): Promise<boolean> {
    try {
      const client = await this.initClient();
      const objectName = `invites/invite_${inviteCode}.json`;

      const inviteData = {
        inviteCode,
        groupId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      await client.object.createObject({
        bucketName: this.config.bucketName,
        objectName: objectName,
        creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000",
        visibility: "VISIBILITY_TYPE_PUBLIC_READ",
        contentType: "application/json",
        redundancyType: "REDUNDANCY_EC_TYPE",
        payload: Buffer.from(JSON.stringify(inviteData)),
      });

      console.log('✅ Invite saved to Greenfield:', inviteCode);
      return true;
    } catch (error) {
      console.error('❌ Error saving invite to Greenfield:', error);
      return false;
    }
  }

  async getInvite(inviteCode: string): Promise<any | null> {
    try {
      const client = await this.initClient();
      const objectName = `invites/invite_${inviteCode}.json`;

      const objectData = await client.object.downloadFile({
        bucketName: this.config.bucketName,
        objectName: objectName,
      });

      const inviteData = JSON.parse(objectData.toString());
      
      // Check if invite is expired
      if (new Date() > new Date(inviteData.expiresAt)) {
        console.log('❌ Invite code expired:', inviteCode);
        return null;
      }

      console.log('✅ Invite retrieved from Greenfield:', inviteCode);
      return inviteData;
    } catch (error) {
      console.error('❌ Error retrieving invite from Greenfield:', error);
      return null;
    }
  }
}

export const greenfieldDirectService = new GreenfieldDirectService();
