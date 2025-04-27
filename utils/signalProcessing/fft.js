export const FFT_X_MIN = 20; // 20Hz
export const FFT_X_MAX = 20000; // 20kHz
export const FFT_Y_MIN = -80; // Minimum Y value (in dB)
export const FFT_Y_MAX = 5; // Maximum Y value (in dB)

/* DB to linear conversion */
export const db2lin = (x) => {
  return Math.pow(10, x / 20);
};

export const db2linRange = (x, min, max) => {
  return (db2lin(x) - min) / (max - min);
};

export const lin2db = (x) => {
  if (x <= 0) return 0; // Handle log(0) case
  return 20 * Math.log10(x);
};

export const lin2dbRange = (x, min, max) => {
  return lin2db(x * (max - min) + min);
};

/* Log 10 to linear conversions (useful w.r.t plotting against Hz) */
export const log10ToLinRange = (x, min, max) => {
  if (x <= 0) return 0; // Handle log(0) case
  return (Math.log10(x) - min) / (max - min);
};

export const linToLog10Range = (x, min, max) => {
  return Path.pow(10, x * (max - min) + min);
};

export const LIN_X_MIN = Math.log10(FFT_X_MIN); // Convert dB to linear scale for x-axis
export const LIN_X_MAX = Math.log10(FFT_X_MAX); // Convert dB to linear scale for x-axis
export const LIN_Y_MIN = db2lin(FFT_Y_MIN); // Convert dB to linear scale for y-axis
export const LIN_Y_MAX = db2lin(FFT_Y_MAX); // Convert dB to linear scale for y-axis

/* FFT Functions */
import { FFT } from "ml-fft";

export const fft_hz_buckets = (numPoints, sampleRate) => {
  const maxIndx = Math.floor((FFT_X_MAX * numPoints) / sampleRate);
  const minNdx = Math.ceil((FFT_X_MIN * numPoints) / sampleRate);
  const xValues = new Array(maxIndx - minNdx);
  for (let i = minNdx; i < maxIndx; i++) {
    xValues[i - minNdx] = (i * sampleRate) / numPoints;
  }
  return xValues;
};

export const format_fft_data = (data) => {
  let xValues = fft_hz_buckets(data.length, 44100); // Assuming a sample rate of 44100Hz
  const fftData = new Array(xValues.length);
  for (let i = 0; i < xValues.length; i++) {
    fftData[i] = {
      x: xValues[i],
      y: data[i],
    };
  }
  //   console.log("FFT Data:", fftData);
  return fftData;
};

/* Windowing Funcs */

const flatTopWindow = (i, length) => {
  if (length <= 1) return 1; // Avoid division by zero
  const coefs = [0.21557895, 0.41663158, -0.27726358, -0.08357895, 0.0069473684];
  const cosScale = [0, 2 * Math.PI * i, 4 * Math.PI * i, 6 * Math.PI * i, 8 * Math.PI * i];

  return coefs.reduce((acc, coef, index) => {
    return acc + coef * Math.cos(cosScale[index] / (length - 1));
  });
};

export const runFFT = (pcmData) => {
  FFT.init(pcmData.length); // Initialize FFT with the length of the PCM data

  var re = new Array(pcmData.length);
  var im = new Array(pcmData.length);
  /* apply a flat-top window */
  var windowSum = 0;
  for (var i = 0; i < pcmData.length; i++) {
    let scale = flatTopWindow(i, pcmData.length); // Apply the flat-top window
    re[i] = pcmData[i] * scale; // Apply the window to the PCM data
    im[i] = 0;
    windowSum += scale;
  }

  /* Do fft */
  FFT.fft(re, im);
  /* Process FFT data */
  for (var i = 0; i < re.length; i++)
    re[i] = lin2db((Math.sqrt(re[i] * re[i] + im[i] * im[i]) * 2) / 32768 / windowSum ); // Convert to dB scale

  return re; // Format the FFT data
};
