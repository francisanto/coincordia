// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AuraRedemptionNFT
 * @dev NFT contract for Aura redemption codes
 * Each NFT represents a redemption code that can be used to claim Aura rewards
 */
contract AuraRedemptionNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Mapping from token ID to redemption code
    mapping(uint256 => string) public redemptionCodes;
    
    // Mapping from redemption code to token ID
    mapping(string => uint256) public codeToTokenId;
    
    // Mapping to track if a code has been redeemed
    mapping(string => bool) public isCodeRedeemed;
    
    // Events
    event RedemptionCodeCreated(uint256 tokenId, string code, address recipient);
    event RedemptionCodeRedeemed(string code, address redeemer, uint256 auraAmount);
    
    // Aura amounts for different redemption tiers
    uint256 public constant TIER_1_AURA = 100;   // Basic tier
    uint256 public constant TIER_2_AURA = 250;   // Silver tier
    uint256 public constant TIER_3_AURA = 500;   // Gold tier
    uint256 public constant TIER_4_AURA = 1000;  // Platinum tier
    
    constructor() ERC721("Aura Redemption Code", "AURACODE") Ownable() {}
    
    /**
     * @dev Create a new redemption code NFT
     * @param recipient Address to receive the NFT
     * @param code The redemption code
     * @param tier The tier of the redemption (1-4)
     * @param metadataURI The metadata URI for the NFT
     */
    function createRedemptionCode(
        address recipient,
        string memory code,
        uint8 tier,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        return _createRedemptionCode(recipient, code, tier, metadataURI);
    }

    /**
     * @dev Internal function to create a new redemption code NFT
     * @param recipient Address to receive the NFT
     * @param code The redemption code
     * @param tier The tier of the redemption (1-4)
     * @param metadataURI The metadata URI for the NFT
     */
    function _createRedemptionCode(
        address recipient,
        string memory code,
        uint8 tier,
        string memory metadataURI
    ) internal returns (uint256) {
        require(bytes(code).length > 0, "Code cannot be empty");
        require(codeToTokenId[code] == 0, "Code already exists");
        require(tier >= 1 && tier <= 4, "Invalid tier");
        require(recipient != address(0), "Invalid recipient");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint the NFT
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        
        // Store the redemption code
        redemptionCodes[newTokenId] = code;
        codeToTokenId[code] = newTokenId;
        
        emit RedemptionCodeCreated(newTokenId, code, recipient);
        
        return newTokenId;
    }
    
    /**
     * @dev Batch create redemption codes
     * @param recipients Array of recipient addresses
     * @param codes Array of redemption codes
     * @param tiers Array of tiers
     * @param metadataURIs Array of metadata URIs
     */
    function batchCreateRedemptionCodes(
        address[] memory recipients,
        string[] memory codes,
        uint8[] memory tiers,
        string[] memory metadataURIs
    ) external onlyOwner {
        require(
            recipients.length == codes.length &&
            codes.length == tiers.length &&
            tiers.length == metadataURIs.length,
            "Arrays must have same length"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _createRedemptionCode(recipients[i], codes[i], tiers[i], metadataURIs[i]);
        }
    }
    
    /**
     * @dev Redeem a code and get Aura points
     * @param code The redemption code to redeem
     * @param tier The tier of the redemption
     */
    function redeemCode(string memory code, uint8 tier) external {
        require(bytes(code).length > 0, "Code cannot be empty");
        require(!isCodeRedeemed[code], "Code already redeemed");
        require(tier >= 1 && tier <= 4, "Invalid tier");
        
        uint256 tokenId = codeToTokenId[code];
        require(tokenId > 0, "Code does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this code");
        
        // Mark code as redeemed
        isCodeRedeemed[code] = true;
        
        // Calculate Aura amount based on tier
        uint256 auraAmount = getAuraAmountForTier(tier);
        
        // Burn the NFT after redemption
        _burn(tokenId);
        
        // Clear mappings
        delete redemptionCodes[tokenId];
        delete codeToTokenId[code];
        
        emit RedemptionCodeRedeemed(code, msg.sender, auraAmount);
    }
    
    /**
     * @dev Get Aura amount for a specific tier
     * @param tier The tier (1-4)
     * @return The Aura amount for the tier
     */
    function getAuraAmountForTier(uint8 tier) public pure returns (uint256) {
        if (tier == 1) return TIER_1_AURA;
        if (tier == 2) return TIER_2_AURA;
        if (tier == 3) return TIER_3_AURA;
        if (tier == 4) return TIER_4_AURA;
        revert("Invalid tier");
    }
    
    /**
     * @dev Check if a code is valid and not redeemed
     * @param code The redemption code to check
     * @return isValid Whether the code is valid
     * @return isRedeemed Whether the code has been redeemed
     * @return tokenId The token ID associated with the code
     */
    function checkCodeStatus(string memory code) external view returns (
        bool isValid,
        bool isRedeemed,
        uint256 tokenId
    ) {
        tokenId = codeToTokenId[code];
        isValid = tokenId > 0;
        isRedeemed = isCodeRedeemed[code];
    }
    
    /**
     * @dev Get redemption code for a token ID
     * @param tokenId The token ID
     * @return The redemption code
     */
    function getRedemptionCode(uint256 tokenId) external view returns (string memory) {
        return redemptionCodes[tokenId];
    }
    
    /**
     * @dev Get all redemption codes for an address
     * @param owner The address to get codes for
     * @return codes Array of redemption codes
     * @return tokenIds Array of token IDs
     */
    function getRedemptionCodesForAddress(address owner) external view returns (
        string[] memory codes,
        uint256[] memory tokenIds
    ) {
        uint256 balance = balanceOf(owner);
        codes = new string[](balance);
        tokenIds = new uint256[](balance);
        
        uint256 index = 0;
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                codes[index] = redemptionCodes[i];
                tokenIds[index] = i;
                index++;
            }
        }
    }
    
    /**
     * @dev Override required functions
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override _burn function to resolve conflict between ERC721 and ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Emergency function to burn a token (only owner)
     * @param tokenId The token ID to burn
     */
    function emergencyBurn(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        string memory code = redemptionCodes[tokenId];
        
        _burn(tokenId);
        
        // Clear mappings
        delete redemptionCodes[tokenId];
        if (bytes(code).length > 0) {
            delete codeToTokenId[code];
        }
    }
} 