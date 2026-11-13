export interface CredentialSample {
  companyName: string;
  credentialType: string;
  holderName: string;
  credentialNumber: string;
  expiryDate: string;
}

export const CREDENTIAL_SAMPLES: CredentialSample[] = [
  {
    companyName: "Akademia Rozwoju Kompetencji",
    credentialType: "Specjalista SEO",
    holderName: "Anna Wiśniewska",
    credentialNumber: "ML24-2026-773102",
    expiryDate: "14.03.2028",
  },
  {
    companyName: "Centrum Edukacji Zawodowej",
    credentialType: "Kosmetolog",
    holderName: "Michał Zieliński",
    credentialNumber: "ML24-2026-482913",
    expiryDate: "21.09.2029",
  },
  {
    companyName: "Szkoła Trenerów Personalnych",
    credentialType: "Trener personalny",
    holderName: "Karolina Nowak",
    credentialNumber: "ML24-2026-118820",
    expiryDate: "05.06.2027",
  },
  {
    companyName: "Instytut Pierwszej Pomocy",
    credentialType: "Specjalista pierwszej pomocy",
    holderName: "Piotr Kamiński",
    credentialNumber: "ML24-2026-902371",
    expiryDate: "30.11.2027",
  },
];
