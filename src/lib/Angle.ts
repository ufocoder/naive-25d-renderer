export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export class Angle implements Angle {
  private _degrees: number;

  constructor(degrees: number) {
     this._degrees = normalizeAngle(degrees);
  } 
  
  get degrees() {
    return this._degrees;
  }
  
  get radians() {
    return this._degrees * Math.PI / 180;
  }

  get cos() {
    return Math.cos(this.radians);
  }

  get sin() {
    return Math.sin(this.radians);
  }
}