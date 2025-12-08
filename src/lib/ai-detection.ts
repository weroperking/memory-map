export interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number;
  reasons: string[];
  noiseScore: number;
  edgeScore: number;
  colorConsistencyScore: number;
  textureScore: number;
}

// Analyze image for AI generation artifacts
export async function detectAIGenerated(imageUrl: string): Promise<AIDetectionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({
          isAIGenerated: false,
          confidence: 0,
          reasons: ['Could not analyze image'],
          noiseScore: 0,
          edgeScore: 0,
          colorConsistencyScore: 0,
          textureScore: 0,
        });
        return;
      }
      
      // Scale down for performance
      const maxSize = 512;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 1. Noise Pattern Analysis
      // AI images often have uniform noise patterns across the image
      const noiseScore = analyzeNoisePatterns(data, canvas.width, canvas.height);
      
      // 2. Edge Sharpness Analysis
      // AI images often have unnaturally sharp or smooth edges
      const edgeScore = analyzeEdges(data, canvas.width, canvas.height);
      
      // 3. Color Consistency Analysis
      // AI images may have subtle color banding or unusual gradients
      const colorConsistencyScore = analyzeColorConsistency(data, canvas.width, canvas.height);
      
      // 4. Texture Pattern Analysis
      // AI images often have repetitive micro-textures
      const textureScore = analyzeTexturePatterns(data, canvas.width, canvas.height);
      
      // Combine scores
      const combinedScore = (
        noiseScore * 0.3 +
        edgeScore * 0.25 +
        colorConsistencyScore * 0.25 +
        textureScore * 0.2
      );
      
      const isAIGenerated = combinedScore > 0.55;
      const confidence = Math.min(Math.abs(combinedScore - 0.5) * 2 * 100, 95);
      
      const reasons: string[] = [];
      
      if (noiseScore > 0.6) {
        reasons.push('Uniform noise patterns detected (typical of AI diffusion models)');
      }
      if (edgeScore > 0.6) {
        reasons.push('Unusual edge smoothness detected');
      }
      if (colorConsistencyScore > 0.55) {
        reasons.push('Suspicious color gradient patterns');
      }
      if (textureScore > 0.55) {
        reasons.push('Repetitive micro-texture patterns found');
      }
      
      if (reasons.length === 0) {
        reasons.push(isAIGenerated ? 'Multiple subtle AI artifacts detected' : 'No significant AI artifacts detected');
      }
      
      resolve({
        isAIGenerated,
        confidence: Math.round(confidence),
        reasons,
        noiseScore: Math.round(noiseScore * 100),
        edgeScore: Math.round(edgeScore * 100),
        colorConsistencyScore: Math.round(colorConsistencyScore * 100),
        textureScore: Math.round(textureScore * 100),
      });
    };
    
    img.onerror = () => {
      resolve({
        isAIGenerated: false,
        confidence: 0,
        reasons: ['Failed to load image'],
        noiseScore: 0,
        edgeScore: 0,
        colorConsistencyScore: 0,
        textureScore: 0,
      });
    };
    
    img.src = imageUrl;
  });
}

function analyzeNoisePatterns(data: Uint8ClampedArray, width: number, height: number): number {
  // Sample random pixels and check noise variance
  const samples = 1000;
  const noiseValues: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;
    const idx = (y * width + x) * 4;
    
    // Compare to neighbors
    const neighbors = [
      (y * width + x - 1) * 4,
      (y * width + x + 1) * 4,
      ((y - 1) * width + x) * 4,
      ((y + 1) * width + x) * 4,
    ];
    
    let diff = 0;
    neighbors.forEach((nIdx) => {
      diff += Math.abs(data[idx] - data[nIdx]);
      diff += Math.abs(data[idx + 1] - data[nIdx + 1]);
      diff += Math.abs(data[idx + 2] - data[nIdx + 2]);
    });
    
    noiseValues.push(diff / 12);
  }
  
  // Calculate variance of noise
  const mean = noiseValues.reduce((a, b) => a + b, 0) / noiseValues.length;
  const variance = noiseValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / noiseValues.length;
  const stdDev = Math.sqrt(variance);
  
  // AI images often have lower variance in noise (more uniform)
  // Real photos have more varied noise patterns
  const normalizedScore = 1 - Math.min(stdDev / 30, 1);
  
  return normalizedScore;
}

function analyzeEdges(data: Uint8ClampedArray, width: number, height: number): number {
  // Sobel edge detection
  let edgeSum = 0;
  let sharpEdgeCount = 0;
  let totalEdges = 0;
  
  for (let y = 1; y < height - 1; y += 3) {
    for (let x = 1; x < width - 1; x += 3) {
      const idx = (y * width + x) * 4;
      
      // Simplified Sobel
      const gx = 
        data[((y - 1) * width + x + 1) * 4] - data[((y - 1) * width + x - 1) * 4] +
        2 * (data[(y * width + x + 1) * 4] - data[(y * width + x - 1) * 4]) +
        data[((y + 1) * width + x + 1) * 4] - data[((y + 1) * width + x - 1) * 4];
      
      const gy =
        data[((y + 1) * width + x - 1) * 4] - data[((y - 1) * width + x - 1) * 4] +
        2 * (data[((y + 1) * width + x) * 4] - data[((y - 1) * width + x) * 4]) +
        data[((y + 1) * width + x + 1) * 4] - data[((y - 1) * width + x + 1) * 4];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > 30) {
        totalEdges++;
        edgeSum += magnitude;
        if (magnitude > 100) {
          sharpEdgeCount++;
        }
      }
    }
  }
  
  if (totalEdges === 0) return 0.5;
  
  // AI images often have unusual edge characteristics
  const avgEdgeStrength = edgeSum / totalEdges;
  const sharpRatio = sharpEdgeCount / totalEdges;
  
  // Very uniform edge strength can indicate AI
  const score = Math.min(sharpRatio * 1.5, 1) * 0.5 + (avgEdgeStrength > 80 ? 0.5 : avgEdgeStrength / 160);
  
  return score;
}

function analyzeColorConsistency(data: Uint8ClampedArray, width: number, height: number): number {
  // Check for unusual color gradients
  const colorBands: number[] = [];
  
  for (let y = 0; y < height; y += 10) {
    for (let x = 0; x < width - 10; x += 10) {
      const idx1 = (y * width + x) * 4;
      const idx2 = (y * width + x + 10) * 4;
      
      const hue1 = rgbToHue(data[idx1], data[idx1 + 1], data[idx1 + 2]);
      const hue2 = rgbToHue(data[idx2], data[idx2 + 1], data[idx2 + 2]);
      
      const hueDiff = Math.abs(hue1 - hue2);
      colorBands.push(hueDiff);
    }
  }
  
  // Count very small hue differences (smooth gradients)
  const smoothCount = colorBands.filter(d => d < 2).length;
  const smoothRatio = smoothCount / colorBands.length;
  
  // AI images often have very smooth color transitions
  return smoothRatio;
}

function analyzeTexturePatterns(data: Uint8ClampedArray, width: number, height: number): number {
  // Check for repetitive patterns
  const blockSize = 16;
  const blocks: number[][] = [];
  
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const blockHash: number[] = [];
      
      for (let dy = 0; dy < blockSize; dy += 4) {
        for (let dx = 0; dx < blockSize; dx += 4) {
          const idx = ((y + dy) * width + x + dx) * 4;
          blockHash.push(Math.floor(data[idx] / 32));
        }
      }
      
      blocks.push(blockHash);
    }
  }
  
  // Find similar blocks
  let similarPairs = 0;
  const checkLimit = Math.min(blocks.length, 100);
  
  for (let i = 0; i < checkLimit; i++) {
    for (let j = i + 1; j < checkLimit; j++) {
      let matches = 0;
      for (let k = 0; k < blocks[i].length; k++) {
        if (blocks[i][k] === blocks[j][k]) matches++;
      }
      if (matches > blocks[i].length * 0.7) {
        similarPairs++;
      }
    }
  }
  
  const maxPairs = (checkLimit * (checkLimit - 1)) / 2;
  const similarity = similarPairs / maxPairs;
  
  // High similarity can indicate AI-generated repetitive patterns
  return Math.min(similarity * 10, 1);
}

function rgbToHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  if (max === min) return 0;
  
  let h = 0;
  const d = max - min;
  
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  
  return h * 360;
}
