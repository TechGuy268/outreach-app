/**
 * Template variable replacement engine
 * Supports {{variable}} syntax
 */

export interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
  [key: string]: string | undefined;
}

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined ? value : match;
  });
}

export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const vars = new Set<string>();
  for (const match of matches) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

export function buildVariablesFromLead(lead: {
  firstName: string;
  lastName: string;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  website?: string | null;
}): TemplateVariables {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    fullName: `${lead.firstName} ${lead.lastName}`,
    email: lead.email || undefined,
    company: lead.company || undefined,
    jobTitle: lead.jobTitle || undefined,
    location: lead.location || undefined,
    website: lead.website || undefined,
  };
}
