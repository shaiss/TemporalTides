/**
 * The corridor's spark rhythm — one clock for the plates, the first gate clock, Anne's and Maya's
 * corridor overlays and the spark sound. Plain JS (no Three.js) so tests can run it headless.
 *
 * Sparks walk `plates` in order with `gaps` seconds between them. Lines that make a claim about
 * the rhythm ("left plate sparks in four seconds") call foresee() so the claim comes true on screen.
 */
export class SparkSchedule {
  constructor({ gaps, plates, first = 1.6 }, onSpark = null) {
    this.gaps = gaps;
    this.plates = plates;
    this.onSpark = onSpark;
    this.t = 0;
    this.k = 0; // index of the next spark
    this.next = first; // time of the next spark
    this.last = new Map(); // plate -> time of its last spark
  }

  /** Full pattern length in sparks (plate order × gap order). */
  get period() {
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const a = this.plates.length;
    const b = this.gaps.length;
    return (a * b) / gcd(a, b);
  }

  plateOf(k) {
    return this.plates[((k % this.plates.length) + this.plates.length) % this.plates.length];
  }

  gapAfter(k) {
    return this.gaps[((k % this.gaps.length) + this.gaps.length) % this.gaps.length];
  }

  /** Advance by dt seconds; fires onSpark({ plate, k, t }) for every spark crossed. */
  update(dt) {
    this.t += dt;
    const fired = [];
    // Bounded catch-up: a long hitch must not dump a burst of sparks at once.
    for (let guard = 0; this.t >= this.next && guard < 4; guard++) {
      const k = this.k;
      const plate = this.plateOf(k);
      this.last.set(plate, this.next);
      const spark = { plate, k, t: this.next };
      this.k += 1;
      this.next += this.gapAfter(k);
      fired.push(spark);
      this.onSpark?.(spark);
    }
    if (this.t >= this.next) this.next = this.t + this.gapAfter(this.k - 1);
    return fired;
  }

  /** Seconds until the next spark (on `plate`, if given). */
  untilNext(plate = null) {
    let at = this.next;
    let k = this.k;
    for (let i = 0; i < this.period; i++) {
      if (plate == null || this.plateOf(k) === plate) return at - this.t;
      at += this.gapAfter(k);
      k += 1;
    }
    return Infinity;
  }

  /** Seconds since `plate` last sparked (Infinity if never). */
  sinceLast(plate) {
    return this.last.has(plate) ? this.t - this.last.get(plate) : Infinity;
  }

  /**
   * Make a timing call come true: the next spark (on `plate`, if given) lands `seconds` from now.
   * The plate order and gap order carry on unchanged from there.
   */
  foresee(seconds, plate = null) {
    if (plate != null) {
      for (let guard = 0; guard < this.plates.length && this.plateOf(this.k) !== plate; guard++) this.k += 1;
    }
    this.next = this.t + seconds;
  }
}
