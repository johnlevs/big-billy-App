class CircularBuffer {
  constructor(size) {
    this._size = size; // Maximum size of the buffer
    this.buffer = new Array(size).fill(0); // Initialize the buffer with zeros
    this.head = 0; // Points to the next position to write
    this.isFull = false; // Tracks if the buffer is full
  }

  // Add a new value to the buffer
  add(value) {
    const replacedValue = this.buffer[this.head]; // Store the value that will be replaced

    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.size; // Wrap around when reaching the end
    if (this.head === 0) {
      this.isFull = true; // Buffer is full when head wraps around
    }
    return replacedValue; // Return the replaced value
  }

  // Get all the values in the buffer in order
  getValues() {
    if (!this.isFull) {
      return this.buffer.slice(0, this.head); // Return only the filled portion
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  // Get the current size of the buffer (number of elements added)
  get size() {
    return this.isFull ? this.size : this.head;
  }

  // Clear the buffer
  clear() {
    this.buffer.fill(0);
    this.head = 0;
    this.isFull = false;
  }

  // Get the current head value
  get headValue() {
    if (this.head === 0 && !this.isFull) {
      return null; // No valid head value if the buffer is empty
    }
    const index = this.head === 0 ? this.size - 1 : this.head - 1;
    return this.buffer[index];
  }

  // Dynamically resize the buffer
  resize(newSize) {
    if (newSize <= 0) {
      throw new Error("Buffer size must be greater than 0");
    }

    const currentValues = this.getValues(); // Get current values in the buffer
    this._size = newSize; // Update the size
    this.buffer = new Array(newSize).fill(0); // Create a new buffer with the new size
    this.head = 0; // Reset the head pointer
    this.isFull = false; // Reset the full flag

    // Re-add the existing values to the new buffer (truncate if necessary)
    for (let i = 0; i < Math.min(currentValues.length, newSize); i++) {
      this.add(currentValues[i]);
    }
  }
}

export default CircularBuffer;
