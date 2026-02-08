import mongoose, { Document, Schema } from 'mongoose';

export interface IMood extends Document {
  baby: mongoose.Types.ObjectId;
  mood: 'happy' | 'calm' | 'fussy' | 'crying' | 'sleeping' | 'alert';
  intensity: number;
  timestamp: Date;
  triggers?: string[];
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MoodSchema: Schema = new Schema(
  {
    baby: {
      type: Schema.Types.ObjectId,
      ref: 'Baby',
      required: true,
      index: true,
    },
    mood: {
      type: String,
      enum: ['happy', 'calm', 'fussy', 'crying', 'sleeping', 'alert'],
      required: true,
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    triggers: [{
      type: String,
    }],
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

export default mongoose.model<IMood>('Mood', MoodSchema);
