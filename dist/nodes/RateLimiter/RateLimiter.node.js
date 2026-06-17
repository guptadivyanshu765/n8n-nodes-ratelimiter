"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor() {
        this.description = {
            displayName: 'Rate Limiter',
            name: 'rateLimiter',
            icon: 'file:ratelimiter.svg',
            group: ['transform'],
            version: 1,
            description: 'Throttle item flow to prevent hitting API rate limits (429 errors)',
            defaults: {
                name: 'Rate Limiter',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Mode',
                    name: 'mode',
                    type: 'options',
                    default: 'requestsPerMinute',
                    options: [
                        { name: 'Fixed Delay', value: 'fixedDelay' },
                        { name: 'Requests Per Second', value: 'requestsPerSecond' },
                        { name: 'Requests Per Minute', value: 'requestsPerMinute' },
                    ],
                },
                {
                    displayName: 'Delay Between Items (ms)',
                    name: 'delay',
                    type: 'number',
                    default: 1000,
                    typeOptions: { minValue: 0 },
                    description: 'Milliseconds to wait between each item',
                    displayOptions: { show: { mode: ['fixedDelay'] } },
                },
                {
                    displayName: 'Max Requests Per Second',
                    name: 'requestsPerSecond',
                    type: 'number',
                    default: 10,
                    typeOptions: { minValue: 1, maxValue: 100 },
                    displayOptions: { show: { mode: ['requestsPerSecond'] } },
                },
                {
                    displayName: 'Max Requests Per Minute',
                    name: 'requestsPerMinute',
                    type: 'number',
                    default: 60,
                    typeOptions: { minValue: 1, maxValue: 3600 },
                    displayOptions: { show: { mode: ['requestsPerMinute'] } },
                },
                {
                    displayName: 'Batch Size',
                    name: 'batchSize',
                    type: 'number',
                    default: 1,
                    typeOptions: { minValue: 1 },
                    description: 'How many items to process at once before applying delay. Use this for APIs that allow small bursts.',
                },
                {
                    displayName: 'Add Metadata',
                    name: 'addMetadata',
                    type: 'boolean',
                    default: true,
                    description: 'Whether to append _rateLimiter info to each output item for debugging',
                },
            ],
        };
    }
    async execute() {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const items = this.getInputData();
        const mode = this.getNodeParameter('mode', 0);
        const batchSize = this.getNodeParameter('batchSize', 0);
        const addMetadata = this.getNodeParameter('addMetadata', 0);
        let delayMs;
        if (mode === 'fixedDelay') {
            delayMs = this.getNodeParameter('delay', 0);
        }
        else if (mode === 'requestsPerSecond') {
            const rps = this.getNodeParameter('requestsPerSecond', 0);
            delayMs = Math.floor(1000 / rps) * batchSize;
        }
        else {
            const rpm = this.getNodeParameter('requestsPerMinute', 0);
            delayMs = Math.floor(60000 / rpm) * batchSize;
        }
        const outputItems = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            for (let j = 0; j < batch.length; j++) {
                const itemIndex = i + j;
                const item = batch[j];
                const json = addMetadata
                    ? {
                        ...item.json,
                        _rateLimiter: {
                            itemIndex,
                            batchNumber: Math.floor(itemIndex / batchSize) + 1,
                            delayApplied: delayMs,
                            mode,
                            processedAt: new Date().toISOString(),
                        },
                    }
                    : { ...item.json };
                outputItems.push({
                    json,
                    binary: item.binary,
                    pairedItem: { item: itemIndex },
                });
            }
            // Sleep after each batch except the last
            if (i + batchSize < items.length) {
                await sleep(delayMs);
            }
        }
        return [outputItems];
    }
}
exports.RateLimiter = RateLimiter;
