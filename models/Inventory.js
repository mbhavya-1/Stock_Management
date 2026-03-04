const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        item_name: { type: String, required: true, trim: true },
        category: { type: String, trim: true },
        quantity_in_stock: { type: Number, required: true, min: 0 },
        reorder_level: { type: Number, required: true, min: 0 },
        supplier: { type: String, trim: true },
        last_updated: { type: Date, default: Date.now }
    },
    {
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            }
        }
    }
);

module.exports = mongoose.model("Inventory", inventorySchema);
