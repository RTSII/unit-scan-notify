export const UNIT_PATTERN = /^[A-Z][0-9][A-Z]$/;

/**
 * Normalize raw unit input from the UI into an uppercase, alphanumeric
 * three-character code. Characters beyond the third are discarded.
 */
export const normalizeUnit = (value: string): string => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);

/**
 * Determine whether the provided unit string matches the expected
 * letter-number-letter schema, e.g. `C2D`.
 */
export const isValidUnit = (value: string): boolean => {
  return UNIT_PATTERN.test(value);
};

/**
 * Convenience helper that normalizes the input and verifies validity in a
 * single step, returning the normalized unit and a validity flag.
 */
export const normalizeAndValidateUnit = (value: string) => {
  const unit = normalizeUnit(value);
  return { unit, isValid: isValidUnit(unit) };
};

export const UNIT_FORMAT_HINT = 'A1B';
export const UNIT_FORMAT_DESCRIPTION = 'letter-number-letter (e.g. C2D)';
