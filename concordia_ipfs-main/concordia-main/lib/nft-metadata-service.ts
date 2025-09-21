export interface AuraNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  external_url: string;
  animation_url?: string;
}

export interface RedemptionCodeData {
  code: string;
  tier: number;
  auraAmount: number;
  createdAt: string;
  expiresAt?: string;
  description: string;
}

class NFTMetadataService {
  private readonly BASE_URL = 'https://api.concordia.app/nft-metadata';
  private readonly IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
  
  /**
   * Generate metadata for an Aura redemption code NFT
   */
  async generateRedemptionMetadata(
    codeData: RedemptionCodeData,
    tokenId: number
  ): Promise<AuraNFTMetadata> {
    const tierName = this.getTierName(codeData.tier);
    const tierColor = this.getTierColor(codeData.tier);
    const tierRarity = this.getTierRarity(codeData.tier);
    
    const metadata: AuraNFTMetadata = {
      name: `Aura Redemption Code #${tokenId}`,
      description: `A rare ${tierName} Aura redemption code worth ${codeData.auraAmount} Aura Points. ${codeData.description}`,
      image: this.generateTierImage(codeData.tier),
      attributes: [
        {
          trait_type: "Tier",
          value: tierName
        },
        {
          trait_type: "Aura Amount",
          value: codeData.auraAmount
        },
        {
          trait_type: "Rarity",
          value: tierRarity
        },
        {
          trait_type: "Redemption Code",
          value: codeData.code
        },
        {
          trait_type: "Created",
          value: new Date(codeData.createdAt).toLocaleDateString()
        },
        {
          trait_type: "Status",
          value: "Unredeemed"
        }
      ],
      external_url: `https://concordia.app/aura/redeem/${codeData.code}`,
      animation_url: this.generateTierAnimation(codeData.tier)
    };

    // Add expiration if exists
    if (codeData.expiresAt) {
      metadata.attributes.push({
        trait_type: "Expires",
        value: new Date(codeData.expiresAt).toLocaleDateString()
      });
    }

    return metadata;
  }

  /**
   * Generate tier-specific image URL
   */
  private generateTierImage(tier: number): string {
    const tierImages = {
      1: "https://ipfs.io/ipfs/QmBasicTierImage", // Basic tier image
      2: "https://ipfs.io/ipfs/QmSilverTierImage", // Silver tier image
      3: "https://ipfs.io/ipfs/QmGoldTierImage", // Gold tier image
      4: "https://ipfs.io/ipfs/QmPlatinumTierImage" // Platinum tier image
    };
    
    return tierImages[tier as keyof typeof tierImages] || tierImages[1];
  }

  /**
   * Generate tier-specific animation URL
   */
  private generateTierAnimation(tier: number): string {
    const tierAnimations = {
      1: "https://ipfs.io/ipfs/QmBasicTierAnimation", // Basic tier animation
      2: "https://ipfs.io/ipfs/QmSilverTierAnimation", // Silver tier animation
      3: "https://ipfs.io/ipfs/QmGoldTierAnimation", // Gold tier animation
      4: "https://ipfs.io/ipfs/QmPlatinumTierAnimation" // Platinum tier animation
    };
    
    return tierAnimations[tier as keyof typeof tierAnimations] || tierAnimations[1];
  }

  /**
   * Get tier name
   */
  private getTierName(tier: number): string {
    const tierNames = {
      1: "Basic",
      2: "Silver", 
      3: "Gold",
      4: "Platinum"
    };
    
    return tierNames[tier as keyof typeof tierNames] || "Basic";
  }

  /**
   * Get tier color
   */
  private getTierColor(tier: number): string {
    const tierColors = {
      1: "#6B7280", // Gray
      2: "#C0C0C0", // Silver
      3: "#FFD700", // Gold
      4: "#E5E4E2"  // Platinum
    };
    
    return tierColors[tier as keyof typeof tierColors] || "#6B7280";
  }

  /**
   * Get tier rarity
   */
  private getTierRarity(tier: number): string {
    const tierRarities = {
      1: "Common",
      2: "Uncommon",
      3: "Rare",
      4: "Legendary"
    };
    
    return tierRarities[tier as keyof typeof tierRarities] || "Common";
  }

  /**
   * Upload metadata to IPFS and return URI
   */
  async uploadMetadataToIPFS(metadata: AuraNFTMetadata): Promise<string> {
    try {
      // In a real implementation, you would upload to IPFS here
      // For now, we'll simulate the upload and return a mock URI
      
      const metadataHash = this.generateMockIPFSHash(metadata);
      const ipfsUri = `ipfs://${metadataHash}`;
      
      console.log('📤 Metadata uploaded to IPFS:', ipfsUri);
      
      return ipfsUri;
    } catch (error) {
      console.error('Failed to upload metadata to IPFS:', error);
      throw error;
    }
  }

  /**
   * Generate a mock IPFS hash for development
   */
  private generateMockIPFSHash(metadata: AuraNFTMetadata): string {
    const metadataString = JSON.stringify(metadata);
    const hash = this.simpleHash(metadataString);
    return `Qm${hash.substring(0, 44)}`;
  }

  /**
   * Simple hash function for development
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Create a redemption code with metadata
   */
  async createRedemptionCodeWithMetadata(
    code: string,
    tier: number,
    recipient: string,
    description: string = ""
  ): Promise<{
    code: string;
    tier: number;
    auraAmount: number;
    metadata: AuraNFTMetadata;
    metadataUri: string;
  }> {
    const auraAmount = this.getAuraAmountForTier(tier);
    
    const codeData: RedemptionCodeData = {
      code,
      tier,
      auraAmount,
      createdAt: new Date().toISOString(),
      description: description || `Aura redemption code for ${auraAmount} points`
    };

    // Generate metadata
    const metadata = await this.generateRedemptionMetadata(codeData, Date.now());
    
    // Upload to IPFS
    const metadataUri = await this.uploadMetadataToIPFS(metadata);
    
    return {
      code,
      tier,
      auraAmount,
      metadata,
      metadataUri
    };
  }

  /**
   * Get Aura amount for tier
   */
  private getAuraAmountForTier(tier: number): number {
    const tierAmounts = {
      1: 100,   // Basic tier
      2: 250,   // Silver tier
      3: 500,   // Gold tier
      4: 1000   // Platinum tier
    };
    
    return tierAmounts[tier as keyof typeof tierAmounts] || 100;
  }

  /**
   * Generate a unique redemption code
   */
  generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate multiple redemption codes
   */
  generateRedemptionCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateRedemptionCode());
    }
    return codes;
  }

  /**
   * Validate redemption code format
   */
  validateRedemptionCode(code: string): boolean {
    // Check if code is 8 characters long and contains only uppercase letters and numbers
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  }
}

export const nftMetadataService = new NFTMetadataService(); 