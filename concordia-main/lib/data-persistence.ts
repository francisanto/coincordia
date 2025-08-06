// All localStorage logic removed. Use Greenfield API only.
export class DataPersistence {
  // All methods now throw errors or are stubs
  saveGroup() { throw new Error('Local storage is disabled. Use Greenfield API.'); }
  loadGroups() { throw new Error('Local storage is disabled. Use Greenfield API.'); }
  updateGroup() { throw new Error('Local storage is disabled. Use Greenfield API.'); }
  deleteGroup() { throw new Error('Local storage is disabled. Use Greenfield API.'); }
  getGroup() { throw new Error('Local storage is disabled. Use Greenfield API.'); }
  clearAllData() { throw new Error('Local storage is disabled. Use Greenfield API.'); }
} 