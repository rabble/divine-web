// Test if the parser is actually being called correctly
const tags = [
  ["streaming", "https://cdn.divine.video/c58613baa5fad079fa401c938db1e817/manifest/video.m3u8", "hls"]
];

// Check what kind of tags we're dealing with
console.log("Test tags:", JSON.stringify(tags));

// Check streaming tag
const streamingTag = tags.find(tag => tag[0] === 'streaming' && tag[2] === 'hls');
console.log("Streaming tag found:", streamingTag);
if (streamingTag && streamingTag[1]) {
  console.log("Would return URL:", streamingTag[1]);
}
