import mongoose, { Document, Schema } from 'mongoose';

export interface IDisease extends Document {
  baby: mongoose.Types.ObjectId;
  name: string;
  diagnosedDate: Date;
  diagnosedBy?: string;
  status: 'active' | 'recovered' | 'chronic';
  description?: string;
  symptoms: mongoose.Types.ObjectId[];
  medications: mongoose.Types.ObjectId[];
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseSchema: Schema = new Schema(
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
    diagnosedDate: {
      type: Date,
      required: true,
    },
    diagnosedBy: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'recovered', 'chronic'],
      default: 'active',
    },
    description: {
      type: String,
    },
    symptoms: [{
      type: Schema.Types.ObjectId,
      ref: 'Symptom',
    }],
    medications: [{
      type: Schema.Types.ObjectId,
      ref: 'Medication',
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

export default mongoose.model<IDisease>('Disease', DiseaseSchema);
