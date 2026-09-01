/**
 * R5: Beneficiary Matching
 * Matches extracted destination account against tenant configured accounts.
 * Mismatch flags for extra review but MUST NOT block approval.
 */
export interface BeneficiaryMatchResult {
  isMatch: boolean;
  matchedAccount?: string;
}

export function matchBeneficiary(
  extractedAccount: string | null | undefined,
  configuredAccounts: string[],
): BeneficiaryMatchResult {
  if (!extractedAccount || !configuredAccounts || configuredAccounts.length === 0) {
    return { isMatch: false };
  }

  const cleanExtracted = extractedAccount.trim().replace(/\D/g, '');
  for (const acc of configuredAccounts) {
    const cleanConfigured = acc.trim().replace(/\D/g, '');
    if (cleanExtracted === cleanConfigured || cleanExtracted.endsWith(cleanConfigured) || cleanConfigured.endsWith(cleanExtracted)) {
      return { isMatch: true, matchedAccount: acc };
    }
  }

  return { isMatch: false };
}
