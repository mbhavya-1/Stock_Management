const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
    {
        tag: { type: String, enum: ["created", "updated"], required: true },
        item_name: { type: String },
        category: { type: String },
        supplier: { type: String },
        quantity_changed: { type: String },
        reorder_threshold_changed: { type: String },
        description: { type: String },
        timestamp: { type: Date, default: Date.now }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            }
        }
    }
);

module.exports = mongoose.model("Log", logSchema);
