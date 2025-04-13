function lin_v2p(value, min, max) {
  return (value - min) / (max - min);
}
function lin_p2v(percent, min, max) {
  return min + (max - min) * percent;
}

function log10_v2p(value, min, max) {
  return Math.log10(value / min) / Math.log10(max / min);
}

function log10_p2v(percent, min, max) {
  return min * Math.pow(max / min, percent);
}

const Linear = "linear";
const Logarithmic = "logarithmic";

class Param {
  constructor(defaultValue, min, max, units = "", p_type = Linear) {
    this.min = min; // Minimum value for the parameter
    this.max = max; // Maximum value for the parameter
    this.default = defaultValue; // Default value for the parameter
    this.value = this.default; // Current value of the parameter

    this.units = units; // Units for the parameter (e.g., "ms", "Hz", etc.)
    this.p_type = p_type; // T}ype of parameter (linear or logarithmic)
  }
}

// Class to manage a collection of parameters
class ParamController {
  constructor() {
    this._params = {};
  }

  // Add a new parameter
  add_param(key, defaultValue, min, max, units = "", p_typeType = Linear) {
    if (this._params[key]) {
      throw new Error(`Parameter with key "${key}" already exists.`);
    }

    this._params[key] = new Param(defaultValue, min, max, units, p_typeType);
  }

  // Get a parameter by key
  get(key) {
    const param = this._params[key];
    if (!param) {
      throw new Error(`Parameter with key "${key}" does not exist.`);
    }
    return param;
  }

  // Update the current value of a parameter
  set(key, value) {
    const param = this.get(key);
    param.value = value;
  }

  set_from_percent(key, percent) {
    if (percent < 0 || percent > 1) throw new Error(`Percent value must be between 0 and 1.`);

    const param = this.get(key);
    switch (param.p_type) {
      case Linear:
        param.value = lin_p2v(percent, param.min, param.max);
        break;
      case Logarithmic:
        param.value = log10_p2v(percent, param.min, param.max);
        break;
    }
  }

  get_percent(key) {
    const param = this.get(key);
    switch (param.p_type) {
      case Linear:
        return lin_v2p(param.value, param.min, param.max);
      case Logarithmic:
        return log10_v2p(param.value, param.min, param.max);
    }
  }

  min(key) {
    const param = this.get(key);
    return param.min;
  }

  max(key) {
    const param = this.get(key);
    return param.max;
  }

  default(key) {
    const param = this.get(key);
    return param.default;
  }

  // returns array of all params
  params_list() {
    let params = Object.keys(this._params).map((key) => {
      return { key: key, value: this._params[key] };
    });
    return params;
  }

  params() {
    return this._params;
  }

  set_params(params) {
    for (const key in params) {
      if (this._params[key]) {
        this._params[key].value = params[key];
      } else {
        throw new Error(`Parameter with key "${key}" does not exist.`);
      }
    }
  }

  copyFrom(other) {
    if (!(other instanceof ParamController)) {
      throw new Error("Cannot copy from a non-ParamController object.");
    }
    this._params = { ...other._params };
  }
}

let bbb_params = new ParamController();

// signal processing
bbb_params.add_param("HpfCutoff", 5000.0, 20.0, 20000.0, "Hz", Logarithmic);
bbb_params.add_param("LpfCutoff", 1000.0, 20.0, 20000.0, "Hz", Logarithmic);
bbb_params.add_param("WindowSizeMs", 200, 5.0, 500.0, "Ms");
bbb_params.add_param("AudioLatencyMs", 250, 0.0, 1000.0, "Ms");

// motor control - triggers
bbb_params.add_param("FlipInterval", 1000, 100.0, 2000.0, "Ms");
bbb_params.add_param("BodyThreshold", 5000, 500.0, 20000.0);
bbb_params.add_param("MouthThreshold", 5000, 500.0, 20000.0);

// extra gpio control
//   bbb_params.add_param("BodySpeed", 1.0, 0.0, 1.0);
//   bbb_params.add_param("MouthSpeed", 1.0, 0.0, 1.0);
//   bbb_params.add_param("MouthFwdHold", 0.1, 0.0, 0.3);
//   bbb_params.add_param("MouthBwdHold", 0.1, 0.0, 0.3);
//   bbb_params.add_param("GpioRate", 250, 100.0, 500.0);

export { bbb_params, ParamController };
