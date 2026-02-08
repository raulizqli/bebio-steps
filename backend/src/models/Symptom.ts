import mongoose, { Document, Schema } from 'mongoose';

export interface ISymptom extends Document {
  baby: mongoose.Types.ObjectId;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  startTime: Date;
  endTime?: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SymptomSchema: Schema = new Schema(
  {
    baby: {
      type: Schema.Types.ObjectId,
      ref: 'Baby',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true,
    },
    description: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
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

export default mongoose.model<ISymptom>('Symptom', SymptomSchema);
