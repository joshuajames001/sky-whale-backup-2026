import { useState, useCallback } from 'react';

/**
 * Hook to convert an image into a "coloring book" style outline using Edge Detection.
 * Uses a simplified Sobel operator + Thresholding.
 */
export const useEdgeDetection = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const processImage = useCallback((imageUrl: string, threshold = 25): Promise<string> => {
        return new Promise((resolve, reject) => {
            setIsProcessing(true);
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrl;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setIsProcessing(false);
                    reject("No context");
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                const w = canvas.width;
                const h = canvas.height;

                // 1. Draw Original
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, w, h);
                const data = imageData.data;

                // --- HELPERS ---
                
                // Gaussian Blur Helper
                const gaussianBlur = (input: Float32Array, width: number, height: number, radius: number) => {
                     const output = new Float32Array(input.length);
                     const size = width * height;
                     
                     // Simple horizontal then vertical pass (approximation)
                     // Or even simpler: Box blur repeated 3 times approximates Gaussian
                     // Let's implement a simple kernel convolution for quality
                     const kernelSize = radius * 2 + 1;
                     const sigma = radius / 2; // approximation
                     const kernel = new Float32Array(kernelSize);
                     let sum = 0;
                     for(let i=0; i<kernelSize; i++) {
                         const x = i - radius;
                         const val = Math.exp(-(x*x)/(2*sigma*sigma));
                         kernel[i] = val;
                         sum += val;
                     }
                     // Normalize
                     for(let i=0; i<kernelSize; i++) kernel[i] /= sum;

                     // Horizontal Pass
                     const temp = new Float32Array(size);
                     for(let y=0; y<height; y++) {
                         for(let x=0; x<width; x++) {
                             let val = 0;
                             for(let k=0; k<kernelSize; k++) {
                                 const kx = x + (k - radius);
                                 if(kx >= 0 && kx < width) {
                                     val += input[y*width + kx] * kernel[k];
                                 } else {
                                     // Clamp edge
                                     const cx = Math.max(0, Math.min(width-1, kx));
                                     val += input[y*width + cx] * kernel[k];
                                 }
                             }
                             temp[y*width + x] = val;
                         }
                     }

                     // Vertical Pass
                     for(let x=0; x<width; x++) {
                         for(let y=0; y<height; y++) {
                             let val = 0;
                             for(let k=0; k<kernelSize; k++) {
                                 const ky = y + (k - radius);
                                 if(ky >= 0 && ky < height) {
                                     val += temp[ky*width + x] * kernel[k];
                                 } else {
                                     const cy = Math.max(0, Math.min(height-1, ky));
                                     val += temp[cy*width + x] * kernel[k];
                                 }
                             }
                             output[y*width + x] = val;
                         }
                     }
                     return output;
                };

                // --- PROCESSING ---

                // 2. Grayscale
                const gray = new Float32Array(w * h);
                for (let i = 0; i < w * h; i++) {
                    const r = data[i * 4];
                    const g = data[i * 4 + 1];
                    const b = data[i * 4 + 2];
                    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
                }

                // 3. Heavy Gaussian Blur (Radius 2) prevents noise/texture detection
                const blurred = gaussianBlur(gray, w, h, 2);

                // 4. Sobel Edge Detection
                const magnitude = new Float32Array(w * h);
                
                const getVal = (x: number, y: number) => {
                    if (x < 0 || x >= w || y < 0 || y >= h) return 0;
                    return blurred[y * w + x];
                };

                for (let y = 1; y < h - 1; y++) {
                    for (let x = 1; x < w - 1; x++) {
                        const idx = y * w + x;
                        const gx =
                            -1 * getVal(x - 1, y - 1) + 1 * getVal(x + 1, y - 1) +
                            -2 * getVal(x - 1, y)     + 2 * getVal(x + 1, y) +
                            -1 * getVal(x - 1, y + 1) + 1 * getVal(x + 1, y + 1);

                        const gy =
                            -1 * getVal(x - 1, y - 1) - 2 * getVal(x, y - 1) - 1 * getVal(x + 1, y - 1) +
                            1 * getVal(x - 1, y + 1)  + 2 * getVal(x, y + 1)  + 1 * getVal(x + 1, y + 1);

                        magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
                    }
                }

                // 5. Threshold & Output
                const outputData = new Uint8ClampedArray(data.length);
                
                // Adaptive Thresholding logic could go here, but strict is often cleaner outline
                
                for (let i = 0; i < w * h; i++) {
                    const mag = magnitude[i];
                    const idx = i * 4;

                    // If mag > threshold, it's an edge
                    const isEdge = mag > threshold;

                    if (isEdge) {
                         outputData[idx] = 0;
                         outputData[idx+1] = 0;
                         outputData[idx+2] = 0;
                         outputData[idx+3] = 255;
                    } else {
                         // Transparent
                         outputData[idx] = 255;
                         outputData[idx+1] = 255;
                         outputData[idx+2] = 255;
                         outputData[idx+3] = 0;
                    }
                }

                // 6. Binary Denoise & Dilate (Connect gaps)
                const cleanedData = new Uint8ClampedArray(outputData);
                const isBlack = (d: Uint8ClampedArray, i: number) => d[i+3] > 128;

                // Helper to count neighbors
                const countNeighbors = (d: Uint8ClampedArray, cx: number, cy: number) => {
                     let count = 0;
                     for(let dy=-1; dy<=1; dy++) {
                         for(let dx=-1; dx<=1; dx++) {
                             if(dx===0 && dy===0) continue;
                             const nx = cx+dx;
                             const ny = cy+dy;
                             if(nx>=0 && nx<w && ny>=0 && ny<h) {
                                 if(isBlack(d, (ny*w + nx)*4)) count++;
                             }
                         }
                     }
                     return count;
                };

                for (let y = 1; y < h - 1; y++) {
                    for (let x = 1; x < w - 1; x++) {
                        const i = (y * w + x) * 4;
                        
                        // DESPECKLE: Remove isolated pixels
                        if (isBlack(outputData, i)) {
                             if (countNeighbors(outputData, x, y) < 1) {
                                 // It's noise, kill it
                                 cleanedData[i+3] = 0; 
                             }
                        } else {
                             // DILATE/CLOSE: If surrounded by enough black, become black (closes gaps)
                             if (countNeighbors(outputData, x, y) >= 3) {
                                 cleanedData[i] = 0;
                                 cleanedData[i+1] = 0;
                                 cleanedData[i+2] = 0;
                                 cleanedData[i+3] = 255;
                             }
                        }
                    }
                }

                const newImageData = new ImageData(cleanedData, w, h);
                ctx.putImageData(newImageData, 0, 0);
                setIsProcessing(false);
                resolve(canvas.toDataURL());
            };

            img.onerror = (e) => {
                setIsProcessing(false);
                reject(e);
            }
        });
    }, []);

    return { processImage, isProcessing };
};
