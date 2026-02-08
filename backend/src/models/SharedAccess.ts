import mongoose, { Document, Schema } from 'mongoose';

export interface ISharedAccess extends Document {
  baby: mongoose.Types.ObjectId;
  sharedBy: mongoose.Types.ObjectId;
  sharedWith: mongoose.Types.ObjectId;
  shareCode: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canViewFeeding: boolean;
    canEditFeeding: boolean;
    canViewSleep: boolean;
    canEditSleep: boolean;
    canViewHealth: boolean;
    canEditHealth: boolean;
    canViewMood: boolean;
    canEditMood: boolean;
  };
  expiresAt?: Date;
  isActive: boolean;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SharedAccessSchema: Schema = new Schema(
  {
    baby: {
      type: Schema.Types.ObjectId,
      ref: 'Baby',
      required: true,
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWith: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    shareCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    permissions: {
      canView: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false },
      canViewFeeding: { type: Boolean, default: true },
      canEditFeeding: { type: Boolean, default: false },
      canViewSleep: { type: Boolean, default: true },
      canEditSleep: { type: Boolean, default: false },
      canViewHealth: { type: Boolean, default: true },
      canEditHealth: { type: Boolean, default: false },
      canViewMood: { type: Boolean, default: true },
      canEditMood: { type: Boolean, default: false },
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for expiration
SharedAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISharedAccess>('SharedAccess', SharedAccessSchema);
