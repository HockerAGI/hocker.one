const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hockerone.vercel.app").replace(/\/$/, "");

export function getHockerOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hocker AGI Technologies",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/hocker-one-logo.png`,
    sameAs: ["https://linkfly.to/hocker"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "contacto.hocker@gmail.com",
        contactType: "customer support",
        availableLanguage: ["es", "en"],
      },
    ],
  };
}

export function getHockerSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hocker ONE",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    url: `${SITE_URL}/one`,
    description:
      "Sistema operativo conversacional para coordinar NOVA, AGIs, aprobación owner, evidencia y acciones reales del ecosistema HOCKER.",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/PreOrder",
      price: "0",
      priceCurrency: "MXN",
    },
  };
}

export function getHockerWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hocker AGI Technologies",
    url: SITE_URL,
    inLanguage: "es-MX",
  };
}

export function getHockerPublicJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      getHockerOrganizationJsonLd(),
      getHockerSoftwareApplicationJsonLd(),
      getHockerWebsiteJsonLd(),
    ],
  };
}
