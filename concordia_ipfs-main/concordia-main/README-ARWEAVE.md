# Arweave Integration for Concordia

This document describes the integration of Arweave permanent storage into the Concordia savings group application.

## Overview

Concordia now supports dual decentralized storage solutions:

1. **IPFS** - For efficient, content-addressed storage
2. **Arweave** - For permanent, immutable storage

This dual approach provides both the efficiency of IPFS and the permanence of Arweave, ensuring that group data remains accessible even if one storage solution experiences issues.

## Features

- **Dual Storage**: Group data is stored on both IPFS and Arweave
- **Status Tracking**: Monitor Arweave transaction confirmation status
- **UI Components**: Dedicated components for displaying Arweave storage information
- **API Endpoints**: New endpoints for retrieving data from both storage solutions

## Implementation Details

### API Endpoints

1. **Store Endpoint** (`/api/groups/store`)
   - Stores group data on both IPFS and Arweave
   - Returns transaction IDs and gateway URLs for both storage solutions

2. **Retrieve Endpoint** (`/api/groups/retrieve`)
   - Retrieves group data from either IPFS or Arweave based on provided parameters
   - Supports retrieval by group ID, IPFS hash, or Arweave transaction ID
   - Returns the most up-to-date version when data exists in both storage solutions

3. **Status Check Endpoint** (`/api/groups/arweave-status`)
   - Checks the confirmation status of an Arweave transaction
   - Returns status (pending, confirmed, failed) and timestamp

### UI Components

1. **ArweaveStorageInfo**
   - Displays Arweave transaction details
   - Shows confirmation status with appropriate visual indicators
   - Provides link to view transaction on Arweave Explorer

2. **ArweaveStatusChecker**
   - Allows manual checking of transaction status
   - Automatically updates UI when status changes
   - Provides user feedback via toast notifications

### Data Flow

1. User creates or updates a group
2. Data is saved locally and sent to the store API endpoint
3. API stores data on both IPFS and Arweave
4. Storage information (hashes, transaction IDs) is returned to the client
5. UI is updated with storage information and status
6. Status checker periodically checks for Arweave confirmation

## Future Improvements

- Implement automatic status checking with WebSockets
- Add data versioning and conflict resolution
- Implement data encryption for enhanced privacy
- Add support for retrieving historical versions from Arweave

## Technical Considerations

- Arweave transactions may take time to confirm (minutes to hours)
- IPFS content may need periodic pinning to ensure availability
- Consider implementing a fallback mechanism if one storage solution is unavailable