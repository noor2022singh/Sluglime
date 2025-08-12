export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

export const optimizePostUpdate = (updates, postId) => {
    const update = updates[postId];
    if (!update) return null;

    const now = Date.now();
    if (update.timestamp && (now - update.timestamp) > 5000) {
        return null;
    }

    return update;
};

export const batchUpdates = (updates, batchSize = 10) => {
    const batched = [];
    let currentBatch = [];

    Object.entries(updates).forEach(([postId, update]) => {
        currentBatch.push({ postId, ...update });

        if (currentBatch.length >= batchSize) {
            batched.push([...currentBatch]);
            currentBatch = [];
        }
    });

    if (currentBatch.length > 0) {
        batched.push(currentBatch);
    }

    return batched;
}; 