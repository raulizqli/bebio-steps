import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  baby: mongoose.Types.ObjectId;
  type: 'sleep' | 'feeding';
  target: number;
  unit: string;
  period: 'daily' | 'weekly';
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    baby: {
      type: Schema.Types.ObjectId,
      ref: 'Baby',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sleep', 'feeding'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGoal>('Goal', GoalSchema);
