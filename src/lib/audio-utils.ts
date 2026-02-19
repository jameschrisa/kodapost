/**
 * Audio utility functions for trimming and processing audio clips.
 * Uses the Web Audio API for client-side audio manipulation.
 */

/**
 * Trims an audio blob to the specified start/end times.
 * Returns a new WAV blob with only the trimmed portion.
 *
 * @param audioUrl - Object URL or blob URL of the source audio
 * @param trimStart - Start time in seconds
 * @param trimEnd - End time in seconds
 * @returns Trimmed audio as a WAV Blob
 */
export async function trimAudioBlob(
  audioUrl: string,
  trimStart: number,
  trimEnd: number
): Promise<Blob> {
  // Fetch the audio data
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();

  // Decode the audio
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Calculate sample offsets
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(trimStart * sampleRate);
  const endSample = Math.min(
    Math.floor(trimEnd * sampleRate),
    audioBuffer.length
  );
  const trimmedLength = endSample - startSample;

  if (trimmedLength <= 0) {
    await audioContext.close();
    throw new Error("Invalid trim range: end must be after start");
  }

  // Create a new buffer with the trimmed audio
  const trimmedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    trimmedLength,
    sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = trimmedBuffer.getChannelData(channel);
    for (let i = 0; i < trimmedLength; i++) {
      targetData[i] = sourceData[startSample + i];
    }
  }

  // Encode as WAV
  const wavBlob = encodeWAV(trimmedBuffer);

  await audioContext.close();
  return wavBlob;
}

/**
 * Encodes an AudioBuffer as a WAV file blob.
 */
function encodeWAV(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // Byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Interleave channels and write samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i];
      // Clamp to [-1, 1] and convert to 16-bit PCM
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Checks whether a trim has been applied (i.e., not the full clip).
 */
export function hasTrimApplied(
  trimStart: number | undefined,
  trimEnd: number | undefined,
  duration: number
): boolean {
  const start = trimStart ?? 0;
  const end = trimEnd ?? duration;
  // Consider it trimmed if start is > 0.5s or end is < (duration - 0.5s)
  return start > 0.5 || end < duration - 0.5;
}
