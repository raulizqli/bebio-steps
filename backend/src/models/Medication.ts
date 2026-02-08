import mongoose, { Document, Schema } from 'mongoose';

export interface IMedication extends Document {
  baby: mongoose.Types.ObjectId;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  purpose?: string;
  sideEffects?: string[];
  administrations: {
    time: Date;
    administeredBy: mongoose.Types.ObjectId;
    notes?: string;
  }[];
  isActive: boolean;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema: Schema = new Schema(
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
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    prescribedBy: {
      type: String,
    },
    purpose: {
      type: String,
    },
    sideEffects: [{
      type: String,
    }],
    administrations: [{
      time: {
        type: Date,
        required: true,
      },
      administeredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      notes: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
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

export default mongoose.model<IMedication>('Medication', MedicationSchema);
