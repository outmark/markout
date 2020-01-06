//@ts-check

export const {atoms, range} = (() => {
  const {freeze} = Object;

  /** @template {string} T @param {...T} strings */
  const atoms = (...strings) => freeze(strings); // .filter(atoms.filter).sort()

  atoms.filter = string => typeof string === 'string' && string.length;

  /** @param {string} string @param {string} [delimiter] */
  atoms.split = (string, delimiter = '') => freeze(string.split(delimiter));
  /**
   * Splits a string into case-distinct subsets as applicable.
   *
   * NOTE: A non-case-senstive string yields the single
   *       subset instance for all its cases. A fully cased
   *       string yields separate upper and lower case subsets
   *       and a single subset for both initial and any cases.
   *
   * @param {string} string @param {string} [delimiter]
   */
  atoms.split.cases = (string, delimiter = '') => {
    /** Ordered array of every unique original cased atom in the original string */
    const initialCase = freeze(atoms.union(...atoms.split(string, delimiter)));

    const lowerCaseString = string.toLowerCase();
    const upperCaseString = string.toUpperCase();

    if (lowerCaseString === upperCaseString) return [initialCase, initialCase, initialCase, initialCase];

    /** Ordered array of every unique original and transformed cased atom in the original string */
    const everyCase = freeze(
      atoms.union(...atoms.split(`${string}${delimiter}${lowerCaseString}${delimiter}${upperCaseString}`, delimiter)),
    );

    /** Ordered array of every unique lower cased atom in the original string */
    const lowerCase = freeze(atoms.union(...atoms.split(lowerCaseString, delimiter)));

    /** Ordered array of every unique upper cased atom in the original string */
    const upperCase = freeze(atoms.union(...atoms.split(upperCaseString, delimiter)));

    return everyCase.length === initialCase.length
      ? [initialCase, lowerCase, upperCase, initialCase]
      : [everyCase, lowerCase, upperCase, initialCase];
  };

  /** @template {string} T @param {...T} atoms @returns T[] */
  atoms.union = (...atoms) => [...new Set(atoms)];

  /** @template {string} T @param {...T} atoms @returns {string} */
  const range = (...atoms) => `[${atoms.map(range.escape).join('')}]`;
  range.escape = (atom, index) =>
    atom === ']' ? '\\]' : atom === '\\' ? '\\\\' : atom === '-' && index !== 0 ? '\\-' : atom;

  return {freeze, atoms, range};
})();

/** @param {string} inset */
export const countInsetQuotes = inset => {
  /** @type {number} */
  let quotes, position;
  position = -1;
  quotes = 0;
  while (position++ < (position = inset.indexOf('>', position))) quotes++;
  return quotes;
};

export const MATCHES = Symbol('matches');
export const MATCH = Symbol('match');

// /** @param {string} string */
// const upper = string => string.toUpperCase();
// /** @param {string} string */
// const lower = string => string.toLowerCase();
