import { NRelay1 } from '@nostrify/nostrify';

console.log('=== RELAY CONNECTION COMPARISON TEST ===\n');

async function testRelay(url, name) {
    console.log(`\n--- Testing ${name} (${url}) ---`);
    const startTime = Date.now();

    const relay = new NRelay1(url, {
        idleTimeout: false,
        log: (log) => {
            const elapsed = Date.now() - startTime;
            if (log.ns === 'relay.ws.state' && log.state === 'open') {
                console.log(`✅ [${elapsed}ms] WebSocket OPENED`);
            } else if (log.ns === 'relay.ws.error') {
                console.log(`❌ [${elapsed}ms] WebSocket ERROR`);
            }
        },
    });

    try {
        const queryStart = Date.now();
        const events = await relay.query([{ kinds: [34236], limit: 5 }], {
            signal: AbortSignal.timeout(15000)
        });
        const queryTime = Date.now() - queryStart;
        const totalTime = Date.now() - startTime;

        console.log(`✅ Query completed: ${events.length} events`);
        console.log(`   Query time: ${queryTime}ms`);
        console.log(`   Total time: ${totalTime}ms`);

        return { success: true, events: events.length, queryTime, totalTime };
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Failed after: ${totalTime}ms`);
        return { success: false, error: error.message, totalTime };
    } finally {
        relay.close();
    }
}

// Test both relays
const results = {};

results.divine = await testRelay('wss://relay.divine.video', 'relay.divine.video');
results.openvine = await testRelay('wss://relay3.openvine.co', 'relay3.openvine.co');

console.log('\n\n=== SUMMARY ===');
console.log('\nrelay.divine.video:');
console.log(`  Status: ${results.divine.success ? '✅ SUCCESS' : '❌ FAILED'}`);
if (results.divine.success) {
    console.log(`  Events: ${results.divine.events}`);
    console.log(`  Connection + Query: ${results.divine.totalTime}ms`);
} else {
    console.log(`  Error: ${results.divine.error}`);
}

console.log('\nrelay3.openvine.co:');
console.log(`  Status: ${results.openvine.success ? '✅ SUCCESS' : '❌ FAILED'}`);
if (results.openvine.success) {
    console.log(`  Events: ${results.openvine.events}`);
    console.log(`  Connection + Query: ${results.openvine.totalTime}ms`);
} else {
    console.log(`  Error: ${results.openvine.error}`);
}

console.log('\n=== INTERPRETATION ===');
if (results.divine.success && results.openvine.success) {
    const diff = results.divine.totalTime - results.openvine.totalTime;
    console.log(`Time difference: ${Math.abs(diff)}ms`);
    if (Math.abs(diff) > 1000) {
        console.log(`⚠️  Significant difference! ${diff > 0 ? 'relay.divine.video' : 'relay3.openvine.co'} is slower`);
    } else {
        console.log(`✅ Both relays perform similarly in Node.js`);
    }
} else {
    console.log('⚠️  One or both relays failed to connect');
}

console.log('\nℹ️  Compare these Node.js timings with browser timings from:');
console.log('   http://localhost:8080/debug-websocket-detailed.html');
