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
 * 2. At least one contact method (email address or phone number) must be provided.
 *
 * @returns Array of user-friendly validation error messages (empty array if valid).
 */
export function validateClient(input: ClientInput): string[] {
  const errors: string[] = [];
  
  if (!input.name || !input.name.trim()) {
    errors.push('Client name is required.');
  }
  
  const email = input.email ? input.email.trim() : '';
  const phone = input.phone ? input.phone.trim() : '';
  
  if (!email && !phone) {
    errors.push('At least one contact method (email or phone) is required.');
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

