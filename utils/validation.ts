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

export function validateInvoice(input: InvoiceInput): string[] {
  const errors: string[] = [];
  if (!input.clientId || !input.clientId.trim()) {
    errors.push('A client must be selected.');
  }
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    errors.push('At least one line item is required.');
  } else {
    const total = input.items.reduce((sum, item) => {
      const amount = item.amount !== undefined 
        ? item.amount 
        : ((item.rate || 0) * (item.sessions || 1));
      return sum + (Number(amount) || 0);
    }, 0);
    if (total <= 0) {
      errors.push('Invoice total must be greater than zero.');
    }
  }
  if (input.dueDate && input.issuedDate && input.dueDate < input.issuedDate) {
    errors.push('Due date cannot be before the issued date.');
  }
  return errors;
}
