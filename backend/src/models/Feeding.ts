import mongoose, { Document, Schema } from 'mongoose';

export interface IFeeding extends Document {
  baby: mongoose.Types.ObjectId;
  type: 'breast' | 'bottle' | 'solid';
  amount?: number;
  unit: 'oz' | 'ml' | 'servings';
  side?: 'left' | 'right' | 'both';
  duration?: number;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeedingSchema: Schema = new Schema(
  {
    baby: {
      type: Schema.Types.ObjectId,
      ref: 'Baby',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['breast', 'bottle', 'solid'],
      required: true,
    },
    amount: {
      type: Number,
    },
    unit: {
      type: String,
      enum: ['oz', 'ml', 'servings'],
      default: 'oz',
    },
    side: {
      type: String,
      enum: ['left', 'right', 'both'],
    },
    duration: {
      type: Number,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    notes: {
      type: String,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IFeeding>('Feeding', FeedingSchema);
