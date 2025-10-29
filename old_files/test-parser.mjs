import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

// Copy the parseImetaTag function from videoParser.ts
function parseImetaTag(tag) {
  if (tag[0] !== 'imeta') return null;

  const metadata = { url: '' };

  // Detect format: if tag[1] contains a space, it's Format 1
  const isFormat1 = tag[1] && tag[1].includes(' ');

  if (isFormat1) {
    // Format 1 parser (shouldn't trigger for our events)
    console.log('Using Format 1 parser');
  } else {
    // Format 2: separate elements for keys and values
    console.log('Using Format 2 parser');
    for (let i = 1; i < tag.length; i += 2) {
      const key = tag[i];
      const value = tag[i + 1];

      if (!key || !value) continue;

      switch (key) {
        case 'url':
          metadata.url = value;
          break;
        case 'm':
          metadata.mimeType = value;
          break;
        case 'image':
          metadata.thumbnailUrl = value;
          break;
        case 'blurhash':
          metadata.blurhash = value;
          break;
        case 'dim':
          metadata.dimensions = value;
          break;
        case 'x':
          metadata.hash = value;
          break;
      }
    }
  }

  return metadata.url ? metadata : null;
}

try {
  const events = await relay.query([
    { ids: ['d4fe40a7ef37b06932b89c907fb7ba472c10bbf28997ebb2b93f6b3add40715d'] }
  ], { signal: AbortSignal.timeout(5000) });

  if (events.length > 0) {
    const event = events[0];
    console.log('\n=== Testing imeta tag parsing ===\n');

    // Find all imeta tags
    const imetaTags = event.tags.filter(tag => tag[0] === 'imeta');
    console.log(`Found ${imetaTags.length} imeta tags\n`);

    imetaTags.forEach((tag, index) => {
      console.log(`\nImeta tag ${index + 1}:`);
      console.log('Tag array:', JSON.stringify(tag));
      const metadata = parseImetaTag(tag);
      console.log('Parsed metadata:', JSON.stringify(metadata, null, 2));
    });
  }
} catch (error) {
  console.error('Error:', error.message);
}

relay.close();
