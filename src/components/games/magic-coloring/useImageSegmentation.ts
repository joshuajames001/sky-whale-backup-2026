import { useState, useCallback } from 'react';

export interface SegmentedRegion {
    id: number;
    color: string; // Hex matching the palette
    label: number; // The number to display (1-based index of palette)
    centroid: { x: number, y: number };
    pixelIndices: number[]; // Indices in the width*height array
}

export interface SegmentationResult {
    regions: SegmentedRegion[];
    palette: string[];
    width: number;
    height: number;
    regionMap: Int32Array; // Pixel Index -> Region ID
    outlineMap: Uint8Array; // Pixel Index -> 1 if edge, 0 if not
}

export const useImageSegmentation = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    // K-Means Helper
    const runKMeans = (data: Uint8ClampedArray, k: number) => {
        // Simple random initialization
        const centers: number[][] = [];
        for (let i = 0; i < k; i++) {
            centers.push([Math.random() * 255, Math.random() * 255, Math.random() * 255]);
        }

        const assignments = new Uint8Array(data.length / 4);
        let changed = true;
        let iterations = 0;

        while (changed && iterations < 20) {
            changed = false;
            iterations++;
            
            const counts = new Uint32Array(k);
            const sumR = new Float32Array(k);
            const sumG = new Float32Array(k);
            const sumB = new Float32Array(k);

            for (let i = 0; i < assignments.length; i++) {
                const r = data[i * 4];
                const g = data[i * 4 + 1];
                const b = data[i * 4 + 2];
                
                let minDist = Infinity;
                let clusterIndex = 0;

                for (let j = 0; j < k; j++) {
                    const dr = r - centers[j][0];
                    const dg = g - centers[j][1];
                    const db = b - centers[j][2];
                    const dist = dr * dr + dg * dg + db * db;
                    if (dist < minDist) {
                        minDist = dist;
                        clusterIndex = j;
                    }
                }

                if (assignments[i] !== clusterIndex) {
                    assignments[i] = clusterIndex;
                    changed = true;
                }

                counts[clusterIndex]++;
                sumR[clusterIndex] += r;
                sumG[clusterIndex] += g;
                sumB[clusterIndex] += b;
            }

            for (let j = 0; j < k; j++) {
                if (counts[j] > 0) {
                    centers[j][0] = sumR[j] / counts[j];
                    centers[j][1] = sumG[j] / counts[j];
                    centers[j][2] = sumB[j] / counts[j];
                }
            }
        }

        return { assignments, centers };
    };

    const processImage = useCallback((imageUrl: string, colorCount = 10): Promise<SegmentationResult> => {
        return new Promise((resolve, reject) => {
            setIsProcessing(true);
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrl;

            img.onload = () => {
                const MAX_DIM = 512; // Moderate resolution for sharp enough numbers but fast processing
                let scale = 1;
                let w = img.width;
                let h = img.height;
                if (w > MAX_DIM || h > MAX_DIM) {
                    scale = Math.min(MAX_DIM / w, MAX_DIM / h);
                    w = Math.floor(w * scale);
                    h = Math.floor(h * scale);
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // 1. Pre-process: Blur to reduce noise/texture -> simpler regions
                ctx.filter = 'blur(3px)';
                ctx.drawImage(img, 0, 0, w, h);
                ctx.filter = 'none'; // Reset

                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;

                // 2. K-Means
                const { assignments, centers } = runKMeans(data, colorCount);

                // 3. Region Extraction (BFS) & Output Maps
                // We'll do an initial pass, then a merging pass
                let regionMap = new Int32Array(w * h).fill(-1);
                const visited = new Uint8Array(w * h).fill(0);
                let initialRegions: { id: number, label: number, pixels: number[] }[] = [];
                let regionIdCounter = 0;

                const getIdx = (x: number, y: number) => y * w + x;

                // A. Initial Region Growing
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const idx = getIdx(x, y);
                        if (visited[idx]) continue;

                        const clusterId = assignments[idx];
                        const stack = [[x, y]];
                        visited[idx] = 1;
                        
                        const currentRegionPixels: number[] = [];

                        while (stack.length) {
                            const [cx, cy] = stack.pop()!;
                            const cIdx = getIdx(cx, cy);
                            
                            regionMap[cIdx] = regionIdCounter;
                            currentRegionPixels.push(cIdx);

                            // Neighbors (4-connectivity)
                            const neighbors = [
                                [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
                            ];

                            for (const [nx, ny] of neighbors) {
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    const nIdx = getIdx(nx, ny);
                                    if (!visited[nIdx] && assignments[nIdx] === clusterId) {
                                        visited[nIdx] = 1;
                                        stack.push([nx, ny]);
                                    }
                                }
                            }
                        }

                        initialRegions.push({
                             id: regionIdCounter,
                             label: clusterId,
                             pixels: currentRegionPixels
                        });
                        regionIdCounter++;
                    }
                }

                // B. Region Merging (Iterative)
                // Filter out small regions by merging them into largest neighbor
                const MIN_REGION_SIZE = 250; // Increased threshold for simpler result
                let cleanRegions = [...initialRegions];
                let mergedSomething = true;
                let iterations = 0;

                while (mergedSomething && iterations < 5) {
                    mergedSomething = false;
                    iterations++;
                    
                    // Sort by size (ascending) to merge small stuff first
                    cleanRegions.sort((a, b) => a.pixels.length - b.pixels.length);
                    
                    const newRegions: typeof cleanRegions = [];
                    const mergedIds = new Set<number>();

                    for (const reg of cleanRegions) {
                         if (mergedIds.has(reg.id)) continue;

                         if (reg.pixels.length < MIN_REGION_SIZE) {
                             // Find neighbors
                             const neighborCounts = new Map<number, number>();
                             
                             for (const pIdx of reg.pixels) {
                                 const px = pIdx % w;
                                 const py = Math.floor(pIdx / w);
                                 
                                 const nCoords = [[px+1, py], [px-1, py], [px, py+1], [px, py-1]];
                                 for(const [nx, ny] of nCoords) {
                                     if (nx>=0 && nx<w && ny>=0 && ny<h) {
                                         const nIdx = ny * w + nx;
                                         const nId = regionMap[nIdx];
                                         if (nId !== reg.id && nId !== -1) {
                                             neighborCounts.set(nId, (neighborCounts.get(nId) || 0) + 1);
                                         }
                                     }
                                 }
                             }

                             // Pick best neighbor (most shared edge)
                             let bestNeighborId = -1;
                             let maxCount = -1;
                             
                             neighborCounts.forEach((count, nId) => {
                                 if (count > maxCount) {
                                     maxCount = count;
                                     bestNeighborId = nId;
                                 }
                             });

                             if (bestNeighborId !== -1) {
                                 // Merge into bestNeighborId
                                 // We need to find the actual object of bestNeighborId in cleanRegions (or newRegions if processed?)
                                 // Actually, performing simple ID remapping on the map is easier, 
                                 // then rebuilding the regions array at the end.
                                 
                                 for(const pIdx of reg.pixels) {
                                     regionMap[pIdx] = bestNeighborId;
                                 }
                                 
                                 // We mark this region as merged (gone)
                                 mergedIds.add(reg.id);
                                 mergedSomething = true;
                                 
                                 // Technically we should update the neighbor's pixel list if we want to process it in this same loop correctly
                                 // But for simplicity/speed: just update map, and rebuild array in next pass?
                                 // Or just update the map loop-by-loop.
                             } else {
                                 // No neighbor (island?), keep it
                                 newRegions.push(reg);
                             }
                         } else {
                             newRegions.push(reg);
                         }
                    }
                    
                    // Rebuild region objects from the map to ensure up-to-date pixel lists for next pass
                    if (mergedSomething) {
                        const rebuiltMap = new Map<number, number[]>();
                        for(let i=0; i<regionMap.length; i++) {
                            const rId = regionMap[i];
                            if (!rebuiltMap.has(rId)) rebuiltMap.set(rId, []);
                            rebuiltMap.get(rId)!.push(i);
                        }
                        
                        cleanRegions = [];
                        rebuiltMap.forEach((pixels, id) => {
                            // Find original label (color) - sample first pixel
                            const pIdx = pixels[0];
                            const label = assignments[pIdx]; // Original K-Means cluster
                            cleanRegions.push({ id, label, pixels });
                        });
                    }
                }
                
                // Final Regions Construction
                const regions: SegmentedRegion[] = [];
                const outlineMap = new Uint8Array(w * h);

                cleanRegions.forEach(cr => {
                     // Calculate Centroid
                     let sumX = 0, sumY = 0;
                     for(const pIdx of cr.pixels) {
                         sumX += pIdx % w;
                         sumY += Math.floor(pIdx / w);
                     }
                     const cx = sumX / cr.pixels.length;
                     const cy = sumY / cr.pixels.length;
                     
                     // Color
                     const rgb = centers[cr.label];
                     const toHex = (n: number) => Math.floor(n).toString(16).padStart(2, '0');
                     const colorHex = `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;

                     regions.push({
                         id: cr.id,
                         color: colorHex,
                         label: cr.label + 1,
                         centroid: { x: cx, y: cy },
                         pixelIndices: cr.pixels
                     });
                });

                // 4. Generate Outlines (Edges between different regions)
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const idx = getIdx(x, y);
                        const rId = regionMap[idx];
                        
                        // Check neighbors
                        if (x < w - 1 && regionMap[getIdx(x + 1, y)] !== rId) outlineMap[idx] = 1;
                        else if (y < h - 1 && regionMap[getIdx(x, y + 1)] !== rId) outlineMap[idx] = 1;
                    }
                }
                
                // Final Palette
                const finalPalette = centers.map(c => {
                    const toHex = (n: number) => Math.floor(n).toString(16).padStart(2, '0');
                    return `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;
                });

                setIsProcessing(false);
                resolve({
                    regions,
                    palette: finalPalette,
                    width: w,
                    height: h,
                    regionMap,
                    outlineMap
                });
            };

            img.onerror = (e) => {
                setIsProcessing(false);
                reject(e);
            };
        });
    }, []);

    return { processImage, isProcessing };
};
