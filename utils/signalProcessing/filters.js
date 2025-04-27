import CircularBuffer from "../circularBuffer";

export class MoveRms {
  constructor(size) {
    this.buffer = new CircularBuffer(size);
    this.sum = 0;
  }

  add(value) {
    const removedValue = this.buffer.add(value);
    this.sum += value * value;

    // Remove the squared value of the oldest element
    if (this.buffer.isFull) this.sum -= removedValue * removedValue;

    return this.rms;
  }

  get rms() {
    return Math.sqrt(this.sum / this.buffer.size); // Not full, use count
  }
}

export const BQF_HPF = "highpass";
export const BQF_LPF = "lowpass";

export class biQuadFilter {
  constructor(sampleRate, cutoff, Q, type) {
    this.sampleRate = sampleRate;
    this.cutoff = cutoff;
    this.Q = Q;
    this.z1 = 0;
    this.z2 = 0;

    const w0 = (2 * Math.PI * cutoff) / sampleRate;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosW0 = Math.cos(w0);

    switch (type) {
      case BQF_HPF:
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosW0;
        this.a2 = 1 - alpha;
        this.b0 = (1 + cosW0) / 2;
        this.b1 = -(1 + cosW0);
        this.b2 = (1 + cosW0) / 2;
        break;
      case BQF_LPF:
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosW0;
        this.a2 = 1 - alpha;
        this.b0 = (1 - cosW0) / 2;
        this.b1 = 1 - cosW0;
        this.b2 = (1 - cosW0) / 2;
        break;
      default:
        throw new Error("Invalid filter type");
    }
  }

  process(input) {
    const output =
      (this.b0 / this.a0) * input + (this.b1 / this.a0) * this.z1 + (this.b2 / this.a0) * this.z2;

    this.z2 = this.z1;
    this.z1 = input - output * (this.a1 / this.a0);

    return output;
  }
}

export class HighPassFilter {
  constructor(sampleRate, cutoff, Q) {
    this.filter = new biQuadFilter(sampleRate, cutoff, Q, BQF_HPF);
  }

  process(input) {
    return this.filter.process(input);
  }
}

export class LowPassFilter {
  constructor(sampleRate, cutoff, Q) {
    this.filter = new biQuadFilter(sampleRate, cutoff, Q, BQF_LPF);
  }

  process(input) {
    return this.filter.process(input);
  }
}
