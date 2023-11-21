
import mongoose from "mongoose";

const taskInstance = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: String, required: true },
    completed: { type: Boolean, required: true },
    datetime: { type: Date, required: false },
    reminderSent: { type: Boolean, default: false } // Add this line for the reminderSent field
  },
  { timestamps: true }
);

const taskModel = mongoose.model("Task", taskInstance);

export default taskModel;
