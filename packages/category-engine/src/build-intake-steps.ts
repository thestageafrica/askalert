import type { AppliesTo, CategoryAttribute, CategoryConfig } from './schemas';

export type IntakeStep = {
  key: string;
  label: string;
  type: CategoryAttribute['type'];
  required: boolean;
  options?: readonly string[];
  unit?: string;
  applies_to: CategoryAttribute['applies_to'];
  /** Returns a human-readable error, or null when the value is valid. */
  validate: (value: unknown) => string | null;
};

function matchesAppliesTo(attribute: CategoryAttribute, appliesTo: AppliesTo): boolean {
  return attribute.applies_to === 'both' || attribute.applies_to === appliesTo;
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function createAttributeValidator(attribute: CategoryAttribute): (value: unknown) => string | null {
  return (value: unknown) => {
    if (isBlank(value)) {
      return attribute.required ? `Please answer: ${attribute.label}.` : null;
    }

    const rules = attribute.validation;

    switch (attribute.type) {
      case 'text':
      case 'area': {
        if (typeof value !== 'string') {
          return `${attribute.label} must be text.`;
        }
        if (rules?.min_length !== undefined && value.length < rules.min_length) {
          return `${attribute.label} must be at least ${rules.min_length} characters.`;
        }
        if (rules?.max_length !== undefined && value.length > rules.max_length) {
          return `${attribute.label} must be at most ${rules.max_length} characters.`;
        }
        if (rules?.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            return `${attribute.label} is not in the expected format.`;
          }
        }
        return null;
      }
      case 'number':
      case 'money': {
        const amount = asNumber(value);
        if (amount === null) {
          return `${attribute.label} must be a number.`;
        }
        if (attribute.type === 'money' && (!Number.isInteger(amount) || amount < 0)) {
          return `${attribute.label} must be a whole amount in kobo.`;
        }
        if (rules?.min !== undefined && amount < rules.min) {
          return `${attribute.label} must be at least ${rules.min}${attribute.unit ? ` ${attribute.unit}` : ''}.`;
        }
        if (rules?.max !== undefined && amount > rules.max) {
          return `${attribute.label} must be at most ${rules.max}${attribute.unit ? ` ${attribute.unit}` : ''}.`;
        }
        return null;
      }
      case 'date': {
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          return `${attribute.label} must be a valid date.`;
        }
        const time = Date.parse(value);
        if (rules?.min_date && time < Date.parse(rules.min_date)) {
          return `${attribute.label} cannot be before ${rules.min_date}.`;
        }
        if (rules?.max_date && time > Date.parse(rules.max_date)) {
          return `${attribute.label} cannot be after ${rules.max_date}.`;
        }
        return null;
      }
      case 'select': {
        if (typeof value !== 'string' || !attribute.options?.includes(value)) {
          return `Choose a valid option for ${attribute.label}.`;
        }
        return null;
      }
      case 'multi': {
        if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
          return `${attribute.label} must be a list of choices.`;
        }
        if (attribute.required && value.length === 0) {
          return `Pick at least one option for ${attribute.label}.`;
        }
        const allowed = new Set(attribute.options ?? []);
        if (value.some((item) => !allowed.has(item))) {
          return `One or more choices for ${attribute.label} are not allowed.`;
        }
        return null;
      }
      case 'boolean': {
        if (typeof value !== 'boolean') {
          return `${attribute.label} must be yes or no.`;
        }
        return null;
      }
      default:
        return null;
    }
  };
}

/** Ordered intake questions for a chat or form flow. */
export function buildIntakeSteps(
  config: CategoryConfig,
  appliesTo: AppliesTo,
): IntakeStep[] {
  return config.attributes
    .filter((attribute) => matchesAppliesTo(attribute, appliesTo))
    .map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      type: attribute.type,
      required: attribute.required,
      options: attribute.options,
      unit: attribute.unit,
      applies_to: attribute.applies_to,
      validate: createAttributeValidator(attribute),
    }));
}
