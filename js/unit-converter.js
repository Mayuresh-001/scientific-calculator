/**
 * Unit Converter Module
 * Supports bi-directional conversion across Length, Mass, Temperature, Area,
 * Volume, Speed, Time, Digital Storage, Pressure, and Energy.
 */

const UNIT_DEFINITIONS = {
  Length: {
    baseUnit: 'm',
    units: {
      m: { name: 'Meter (m)', rate: 1 },
      km: { name: 'Kilometer (km)', rate: 1000 },
      cm: { name: 'Centimeter (cm)', rate: 0.01 },
      mm: { name: 'Millimeter (mm)', rate: 0.001 },
      in: { name: 'Inch (in)', rate: 0.0254 },
      ft: { name: 'Foot (ft)', rate: 0.3048 },
      yd: { name: 'Yard (yd)', rate: 0.9144 },
      mi: { name: 'Mile (mi)', rate: 1609.344 },
      nmi: { name: 'Nautical Mile (nmi)', rate: 1852 },
      nm: { name: 'Nanometer (nm)', rate: 1e-9 }
    },
    defaultFrom: 'm',
    defaultTo: 'km'
  },
  Mass: {
    baseUnit: 'kg',
    units: {
      kg: { name: 'Kilogram (kg)', rate: 1 },
      g: { name: 'Gram (g)', rate: 0.001 },
      mg: { name: 'Milligram (mg)', rate: 1e-6 },
      lb: { name: 'Pound (lb)', rate: 0.45359237 },
      oz: { name: 'Ounce (oz)', rate: 0.028349523 },
      ton: { name: 'Metric Ton (t)', rate: 1000 },
      ct: { name: 'Carat (ct)', rate: 0.0002 }
    },
    defaultFrom: 'kg',
    defaultTo: 'lb'
  },
  Temperature: {
    custom: true,
    units: {
      C: { name: 'Celsius (°C)' },
      F: { name: 'Fahrenheit (°F)' },
      K: { name: 'Kelvin (K)' }
    },
    convert: (val, from, to) => {
      // First convert from 'from' to Kelvin
      let kelvin = val;
      if (from === 'C') kelvin = val + 273.15;
      else if (from === 'F') kelvin = (val - 32) * (5 / 9) + 273.15;
      else if (from === 'K') kelvin = val;

      // Then convert from Kelvin to 'to'
      if (to === 'C') return kelvin - 273.15;
      if (to === 'F') return (kelvin - 273.15) * (9 / 5) + 32;
      if (to === 'K') return kelvin;
      return val;
    },
    defaultFrom: 'C',
    defaultTo: 'F'
  },
  Area: {
    baseUnit: 'm2',
    units: {
      m2: { name: 'Square Meter (m²)', rate: 1 },
      km2: { name: 'Square Kilometer (km²)', rate: 1e6 },
      cm2: { name: 'Square Centimeter (cm²)', rate: 0.0001 },
      mm2: { name: 'Square Millimeter (mm²)', rate: 1e-6 },
      ft2: { name: 'Square Foot (ft²)', rate: 0.092903 },
      in2: { name: 'Square Inch (in²)', rate: 0.00064516 },
      acre: { name: 'Acre (ac)', rate: 4046.856422 },
      ha: { name: 'Hectare (ha)', rate: 10000 }
    },
    defaultFrom: 'm2',
    defaultTo: 'ft2'
  },
  Volume: {
    baseUnit: 'L',
    units: {
      L: { name: 'Liter (L)', rate: 1 },
      mL: { name: 'Milliliter (mL)', rate: 0.001 },
      m3: { name: 'Cubic Meter (m³)', rate: 1000 },
      cm3: { name: 'Cubic Centimeter (cm³)', rate: 0.001 },
      gal: { name: 'US Gallon (gal)', rate: 3.78541 },
      qt: { name: 'US Quart (qt)', rate: 0.946353 },
      pt: { name: 'US Pint (pt)', rate: 0.473176 },
      cup: { name: 'US Cup', rate: 0.236588 },
      floz: { name: 'US Fluid Ounce (fl oz)', rate: 0.0295735 }
    },
    defaultFrom: 'L',
    defaultTo: 'gal'
  },
  Speed: {
    baseUnit: 'm_s',
    units: {
      m_s: { name: 'Meter per second (m/s)', rate: 1 },
      km_h: { name: 'Kilometer per hour (km/h)', rate: 1 / 3.6 },
      mph: { name: 'Mile per hour (mph)', rate: 0.44704 },
      knot: { name: 'Knot (kn)', rate: 0.514444 },
      ft_s: { name: 'Foot per second (ft/s)', rate: 0.3048 }
    },
    defaultFrom: 'km_h',
    defaultTo: 'mph'
  },
  Time: {
    baseUnit: 's',
    units: {
      s: { name: 'Second (s)', rate: 1 },
      ms: { name: 'Millisecond (ms)', rate: 0.001 },
      min: { name: 'Minute (min)', rate: 60 },
      hr: { name: 'Hour (hr)', rate: 3600 },
      day: { name: 'Day (d)', rate: 86400 },
      week: { name: 'Week (wk)', rate: 604800 },
      yr: { name: 'Year (yr)', rate: 31536000 }
    },
    defaultFrom: 'min',
    defaultTo: 's'
  },
  Digital: {
    baseUnit: 'B',
    units: {
      B: { name: 'Byte (B)', rate: 1 },
      KB: { name: 'Kilobyte (KB)', rate: 1024 },
      MB: { name: 'Megabyte (MB)', rate: 1048576 },
      GB: { name: 'Gigabyte (GB)', rate: 1073741824 },
      TB: { name: 'Terabyte (TB)', rate: 1099511627776 },
      PB: { name: 'Petabyte (PB)', rate: 1125899906842624 }
    },
    defaultFrom: 'MB',
    defaultTo: 'GB'
  },
  Pressure: {
    baseUnit: 'Pa',
    units: {
      Pa: { name: 'Pascal (Pa)', rate: 1 },
      kPa: { name: 'Kilopascal (kPa)', rate: 1000 },
      bar: { name: 'Bar (bar)', rate: 100000 },
      psi: { name: 'Pound per sq inch (psi)', rate: 6894.757 },
      atm: { name: 'Atmosphere (atm)', rate: 101325 },
      mmHg: { name: 'Millimeter of mercury (mmHg)', rate: 133.322 }
    },
    defaultFrom: 'kPa',
    defaultTo: 'psi'
  },
  Energy: {
    baseUnit: 'J',
    units: {
      J: { name: 'Joule (J)', rate: 1 },
      kJ: { name: 'Kilojoule (kJ)', rate: 1000 },
      cal: { name: 'Calorie (cal)', rate: 4.184 },
      kcal: { name: 'Kilocalorie (kcal)', rate: 4184 },
      Wh: { name: 'Watt-hour (Wh)', rate: 3600 },
      kWh: { name: 'Kilowatt-hour (kWh)', rate: 3.6e6 },
      eV: { name: 'Electronvolt (eV)', rate: 1.602176634e-19 }
    },
    defaultFrom: 'kJ',
    defaultTo: 'kcal'
  }
};

class UnitConverter {
  constructor() {
    this.currentCategory = 'Length';
    this.unit1 = 'm';
    this.unit2 = 'km';
    this.value1 = '0';
    this.value2 = '0';
    this.activeInputIndex = 1; // 1 or 2
  }

  setCategory(categoryName) {
    if (!UNIT_DEFINITIONS[categoryName]) return;
    this.currentCategory = categoryName;
    const cat = UNIT_DEFINITIONS[categoryName];
    this.unit1 = cat.defaultFrom;
    this.unit2 = cat.defaultTo;
    this.value1 = '0';
    this.value2 = '0';
    this.activeInputIndex = 1;
  }

  getCategories() {
    return Object.keys(UNIT_DEFINITIONS);
  }

  getUnitsForCurrentCategory() {
    return UNIT_DEFINITIONS[this.currentCategory].units;
  }

  swapUnits() {
    const tempUnit = this.unit1;
    this.unit1 = this.unit2;
    this.unit2 = tempUnit;

    const tempVal = this.value1;
    this.value1 = this.value2;
    this.value2 = tempVal;
  }

  setUnit(index, unitKey) {
    if (index === 1) this.unit1 = unitKey;
    if (index === 2) this.unit2 = unitKey;
    this.recalculateFrom(this.activeInputIndex);
  }

  setValue(index, valStr) {
    this.activeInputIndex = index;
    if (index === 1) {
      this.value1 = valStr;
      this.recalculateFrom(1);
    } else {
      this.value2 = valStr;
      this.recalculateFrom(2);
    }
  }

  inputDigit(digit) {
    let current = this.activeInputIndex === 1 ? this.value1 : this.value2;
    if (current === '0') current = String(digit);
    else current += String(digit);
    this.setValue(this.activeInputIndex, current);
  }

  inputDecimal() {
    let current = this.activeInputIndex === 1 ? this.value1 : this.value2;
    if (!current.includes('.')) {
      current += '.';
      this.setValue(this.activeInputIndex, current);
    }
  }

  inputBackspace() {
    let current = this.activeInputIndex === 1 ? this.value1 : this.value2;
    if (current.length > 1) {
      current = current.slice(0, -1);
      if (current === '-') current = '0';
    } else {
      current = '0';
    }
    this.setValue(this.activeInputIndex, current);
  }

  clear() {
    this.value1 = '0';
    this.value2 = '0';
  }

  recalculateFrom(sourceIndex) {
    const cat = UNIT_DEFINITIONS[this.currentCategory];
    const sourceValStr = sourceIndex === 1 ? this.value1 : this.value2;
    const fromUnit = sourceIndex === 1 ? this.unit1 : this.unit2;
    const toUnit = sourceIndex === 1 ? this.unit2 : this.unit1;

    const num = parseFloat(sourceValStr);
    if (isNaN(num)) {
      if (sourceIndex === 1) this.value2 = '0';
      else this.value1 = '0';
      return;
    }

    let result = 0;
    if (cat.custom && cat.convert) {
      result = cat.convert(num, fromUnit, toUnit);
    } else {
      const fromRate = cat.units[fromUnit].rate;
      const toRate = cat.units[toUnit].rate;
      // Convert to base, then to target
      result = (num * fromRate) / toRate;
    }

    const formatted = parseFloat(result.toPrecision(8)).toString();
    if (sourceIndex === 1) {
      this.value2 = formatted;
    } else {
      this.value1 = formatted;
    }
  }
}

window.UnitConverter = UnitConverter;
