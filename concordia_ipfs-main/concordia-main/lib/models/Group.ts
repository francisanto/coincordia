import mongoose, { Schema, Document, Model } from 'mongoose';

// Define interfaces for TypeScript
export interface IMember extends Document {
  address: string;
  nickname?: string;
  joinedAt: string;
  role: 'admin' | 'member' | 'creator';
  contribution?: number;
  auraPoints?: number;
  hasVoted?: boolean;
  status: 'active' | 'inactive';
}

export interface IGroup extends Document {
  groupId: string;
  name: string;
  description?: string;
  creator: string;
  members: IMember[];
  contributions?: any[];
  settings?: any;
  blockchain?: any;
  mongodb?: any;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Define schemas
const MemberSchema = new Schema<IMember>({
  address: { type: String, required: true, lowercase: true },
  nickname: { type: String },
  joinedAt: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'member', 'creator'] },
  contribution: { type: Number },
  auraPoints: { type: Number },
  hasVoted: { type: Boolean },
  status: { type: String, required: true, enum: ['active', 'inactive'] }
});

const GroupSchema = new Schema<IGroup>({
  groupId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  creator: { type: String, required: true, lowercase: true },
  members: [MemberSchema],
  contributions: { type: [Schema.Types.Mixed] },
  settings: { type: Schema.Types.Mixed },
  blockchain: { type: Schema.Types.Mixed },
  arweave: { type: Schema.Types.Mixed },
  inviteCode: { type: String },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

// Create indexes for faster queries
GroupSchema.index({ creator: 1 });
GroupSchema.index({ inviteCode: 1 });

// Define the model
let Group: Model<IGroup>;

try {
  // Use existing model if it exists
  Group = mongoose.model<IGroup>('Group');
} catch {
  // Create new model if it doesn't exist
  Group = mongoose.model<IGroup>('Group', GroupSchema);
}

export default Group;