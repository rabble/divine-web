#!/usr/bin/env tsx
// Quick verification script to ensure relay configuration is correctly structured

import { 
  PRIMARY_RELAY, 
  SEARCH_RELAY, 
  PROFILE_RELAYS, 
  PRESET_RELAYS,
  getRelayUrls,
  toLegacyFormat,
  getRelayByUrl 
} from '../src/config/relays';

console.log('🔍 Verifying Relay Configuration\n');

// Verify PRIMARY_RELAY
console.log('✅ PRIMARY_RELAY:');
console.log(`   URL: ${PRIMARY_RELAY.url}`);
console.log(`   Name: ${PRIMARY_RELAY.name}`);
console.log(`   NIP-50: ${PRIMARY_RELAY.capabilities?.nip50 ? 'Yes' : 'No'}`);
console.log('');

// Verify SEARCH_RELAY
console.log('✅ SEARCH_RELAY:');
console.log(`   URL: ${SEARCH_RELAY.url}`);
console.log(`   Name: ${SEARCH_RELAY.name}`);
console.log(`   NIP-50: ${SEARCH_RELAY.capabilities?.nip50 ? 'Yes' : 'No'}`);
console.log('');

// Verify PROFILE_RELAYS
console.log('✅ PROFILE_RELAYS:');
console.log(`   Count: ${PROFILE_RELAYS.length}`);
PROFILE_RELAYS.forEach((relay, i) => {
  console.log(`   ${i + 1}. ${relay.name} (${relay.url})`);
});
console.log('');

// Verify PRESET_RELAYS
console.log('✅ PRESET_RELAYS:');
console.log(`   Count: ${PRESET_RELAYS.length}`);
PRESET_RELAYS.forEach((relay, i) => {
  console.log(`   ${i + 1}. ${relay.name} (${relay.url})`);
});
console.log('');

// Test helper functions
console.log('✅ Helper Functions:');
const profileUrls = getRelayUrls(PROFILE_RELAYS);
console.log(`   getRelayUrls(PROFILE_RELAYS): ${profileUrls.length} URLs`);

const legacyFormat = toLegacyFormat(PRESET_RELAYS);
console.log(`   toLegacyFormat(PRESET_RELAYS): ${legacyFormat.length} entries`);
console.log(`   Example: ${JSON.stringify(legacyFormat[0])}`);

const foundRelay = getRelayByUrl('wss://relay.divine.video');
console.log(`   getRelayByUrl('wss://relay.divine.video'): ${foundRelay?.name || 'Not found'}`);
console.log('');

// Verify no duplicates in PRESET_RELAYS
const urls = PRESET_RELAYS.map(r => r.url);
const uniqueUrls = new Set(urls);
if (urls.length === uniqueUrls.size) {
  console.log('✅ No duplicate URLs in PRESET_RELAYS');
} else {
  console.error('❌ DUPLICATE URLs found in PRESET_RELAYS!');
  process.exit(1);
}

// Verify PRIMARY_RELAY exists in PRESET_RELAYS
const primaryInPresets = PRESET_RELAYS.some(r => r.url === PRIMARY_RELAY.url);
if (primaryInPresets) {
  console.log('✅ PRIMARY_RELAY is included in PRESET_RELAYS');
} else {
  console.warn('⚠️  PRIMARY_RELAY is NOT in PRESET_RELAYS (might be intentional)');
}

console.log('\n✨ Relay configuration verified successfully!\n');
