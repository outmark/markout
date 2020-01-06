//@ts-check

/** @template {selector} T @extends Array<T> */
//@ts-ignore
export class Selectors extends Array {
  // /**
  //  * @template {T} U
  //  * @template This
  //  * @param {(value: T, index: number, array: T[]) => selector|selectors} callbackFunction
  //  * @param {This} [thisArgument]
  //  * @returns {Selectors<T>}
  //  */
  //@ts-ignore
  get flatMap() {
    Object.defineProperty(
      Selectors.prototype,
      'flatMap',
      Object.getOwnPropertyDescriptor(Array.prototype, 'flatMap') ||
        Object.getOwnPropertyDescriptor(
          class extends Array {
            flatMap(callbackFunction, thisArgument) {
              return this.concat(...this.map(callbackFunction, thisArgument));
            }
          }.prototype,
          'flatMap',
        ),
    );

    return this.flatMap;
    // return this.concat(...super.map(callbackFunction, thisArgument));
  }

  toString() {
    return this.join(',');
  }
  static get [Symbol.species]() {
    return this;
  }
}

/** @typedef {string} selector */
/** @typedef {Selectors|selector[]} selectors */
