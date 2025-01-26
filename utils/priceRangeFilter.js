function buildPriceRangeFilter(price) {
    if (!Array.isArray(price) || price.length === 0) {
        // No price filters selected
        console.log("No price filters selected");
        return {};
    }

    console.log("price from the utils func", price);
    // Map each label to a Mongo filter object
    const conditions = price
        .map((label) => {
        switch (label) {
            case "Under $5":
            return { price: { $lt: 5 } };

            case "$5 - $10":
            return { price: { $gte: 5, $lte: 10 } };

            case "$10 - $20":
            return { price: { $gte: 10, $lte: 20 } };

            case "Over $20":
            return { price: { $gt: 20 } };

            default:
            // If there's an unexpected label, ignore it or return {}
            return null;
        }
        })
        .filter(Boolean); // remove any null or invalid entries

    if (conditions.length === 0) {
        // All labels were invalid or empty
        return {};
    }

    // If multiple ranges are selected, we use $or so any of them match
    return { $or: conditions };
}

module.exports = {
    buildPriceRangeFilter, 
};