// Simple in-memory storage fallback (replace with actual database later)
class SimpleStorage {
  private groups: any[] = [];
  private users: any[] = [];

  // Group methods
  async findMany() {
    return this.groups;
  }

  async findUnique({ where }: any) {
    return this.groups.find(group => group.id === where.id);
  }

  async create({ data }: any) {
    const newItem = { ...data, id: Date.now().toString() };
    this.groups.push(newItem);
    return newItem;
  }

  async update({ where, data }: any) {
    const index = this.groups.findIndex(item => item.id === where.id);
    if (index !== -1) {
      this.groups[index] = { ...this.groups[index], ...data };
      return this.groups[index];
    }
    return null;
  }

  async delete({ where }: any) {
    const index = this.groups.findIndex(item => item.id === where.id);
    if (index !== -1) {
      return this.groups.splice(index, 1)[0];
    }
    return null;
  }
}

// Export a mock prisma client
export const prisma = {
  group: new SimpleStorage(),
  user: new SimpleStorage(),
  $connect: async () => {},
  $disconnect: async () => {}
};