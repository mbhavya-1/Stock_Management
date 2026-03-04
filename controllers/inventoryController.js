const Inventory = require("../models/Inventory");
const Log = require("../models/Log");

async function pushLog(data) {
    await Log.create(data);
}

exports.getAllItems = async (req, res) => {
    try {
        const items = await Inventory.find().sort({ last_updated: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createItem = async (req, res) => {
    const { item_name, category, quantity_in_stock, reorder_level, supplier } = req.body;

    if (!item_name || quantity_in_stock == null || reorder_level == null) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const newItem = await Inventory.create({
            item_name,
            category,
            quantity_in_stock: Number(quantity_in_stock),
            reorder_level: Number(reorder_level),
            supplier,
            last_updated: new Date()
        });

        await pushLog({
            tag: "created",
            item_name,
            category: category || "—",
            supplier: supplier || "—",
            quantity_changed: `N/A → ${newItem.quantity_in_stock}`,
            reorder_threshold_changed: `N/A → ${newItem.reorder_level}`,
            description: `Item '${item_name}' was added to inventory with ${newItem.quantity_in_stock} unit(s) and a reorder threshold of ${newItem.reorder_level}.`
        });

        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateItem = async (req, res) => {
    const { id } = req.params;
    const { quantity_in_stock, reorder_level } = req.body;

    try {
        const item = await Inventory.findById(id);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (quantity_in_stock != null && Number(quantity_in_stock) < 0) {
            return res.status(400).json({ message: "Stock cannot go below zero" });
        }

        const oldQty = item.quantity_in_stock;
        const oldReorder = item.reorder_level;

        if (quantity_in_stock != null) item.quantity_in_stock = Number(quantity_in_stock);
        if (reorder_level != null) item.reorder_level = Number(reorder_level);
        item.last_updated = new Date();

        await item.save();

        const qtyChanged = item.quantity_in_stock !== oldQty;
        const reorderChanged = item.reorder_level !== oldReorder;

        const descParts = [];
        if (qtyChanged) descParts.push(`quantity changed from ${oldQty} to ${item.quantity_in_stock}`);
        if (reorderChanged) descParts.push(`reorder threshold changed from ${oldReorder} to ${item.reorder_level}`);

        await pushLog({
            tag: "updated",
            item_name: item.item_name,
            category: item.category || "—",
            supplier: item.supplier || "—",
            quantity_changed: qtyChanged ? `${oldQty} → ${item.quantity_in_stock}` : "unchanged",
            reorder_threshold_changed: reorderChanged ? `${oldReorder} → ${item.reorder_level}` : "unchanged",
            description: descParts.length
                ? `'${item.item_name}' updated: ${descParts.join("; ")}.`
                : `'${item.item_name}' was saved with no changes.`
        });

        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await Inventory.findByIdAndDelete(id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};