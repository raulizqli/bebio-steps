import mongoose, { Document, Schema } from 'mongoose';

export interface ISleep extends Document {
  baby: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  location?: string;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SleepSchema: Schema = new Schema(
  {
    baby: {
      type: Schema.Types.ObjectId,
      ref: 'Baby',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
    },
    location: {
      type: String,
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

export default mongoose.model<ISleep>('Sleep', SleepSchema);
