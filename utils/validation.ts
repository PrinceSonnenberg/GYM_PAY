/**
 * Business Rule Validation Utility
 *
 * Provides shared validation logic used by both the server API handlers
 * and client-side UI forms to ensure data integrity across the app.
 */

export interface ClientInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface InvoiceItemInput {
  amount?: number;
  rate?: number;
  sessions?: number;
}

export interface InvoiceInput {
  clientId?: string;
  items?: InvoiceItemInput[];
  dueDate?: string;
  issuedDate?: string;
}

/**
 * Validates client creation and update inputs.
 * Business Rules:
 * 1. Client name is required and cannot be empty or whitespace.
 * 2. Client email address is required and must be valid.
 * 3. Phone number (if provided) must be a valid South African number (e.g., 082 123 4567 or +27 82 123 4567)
 *    or a standard international number starting with '+'.
 *
 * @returns Array of user-friendly validation error messages (empty array if valid).
 */
export function validateClient(input: ClientInput): string[] {
  const errors: string[] = [];
  
  if (!input.name || !input.name.trim()) {
    errors.push('Client name is required.');
  }
  
  const email = input.email ? input.email.trim() : '';
  if (!email) {
    errors.push('Client email address is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required.');
  }

  const phone = input.phone ? input.phone.trim() : '';
  if (phone) {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    const isSouthAfricanLocal = /^0\d{9}$/.test(cleaned);
    const isSouthAfricanIntl = /^\+?27\d{9}$/.test(cleaned);
    const isInternational = /^\+[1-9]\d{6,14}$/.test(cleaned);

    if (!isSouthAfricanLocal && !isSouthAfricanIntl && !isInternational) {
      errors.push('Phone number must be a valid South African number (e.g., 082 123 4567 or +27 82 123 4567) or a properly-formatted international number starting with +.');
    }
  }
  
  return errors;
}

/**
 * Validates invoice creation and update inputs.
 * Business Rules:
 * 1. A client must be selected for the invoice.
 * 2. At least one line item must be included.
 * 3. The total monetary amount of the invoice must be strictly greater than zero.
 * 4. The invoice due date cannot precede the issued date.
 *
 * @returns Array of user-friendly validation error messages (empty array if valid).
 */
export function validateInvoice(input: InvoiceInput): string[] {
  const errors: string[] = [];

  if (!input.clientId || !input.clientId.trim()) {
    errors.push('A client must be selected.');
  }

  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    errors.push('At least one line item is required.');
  } else {
    const totalAmount = input.items.reduce((sum, item) => {
      const lineAmount = item.amount !== undefined 
        ? item.amount 
        : ((item.rate || 0) * (item.sessions || 1));
      return sum + (Number(lineAmount) || 0);
    }, 0);

    if (totalAmount <= 0) {
      errors.push('Invoice total must be greater than zero.');
    }
  }

  if (input.dueDate && input.issuedDate && input.dueDate < input.issuedDate) {
    errors.push('Due date cannot be before the issued date.');
  }

  return errors;
}

