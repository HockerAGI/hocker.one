# Apply review notes

1. Do not merge archived legacy files back into `src/`.
2. Use `env.example.enhanced` as the new template for fresh environments.
3. If you rehydrate the repo elsewhere, trust the live tree plus `.git`, not the zip mirror alone.
4. Validate the repository after any file move or path normalization.
5. Keep compliance gates and owner gates in place.

Current import scan summary:
- checked local imports: 654
- broken local imports: 3
- unresolved scopes: [
  [
    "@/lib/nova-executive-language",
    1
  ],
  [
    "./errors",
    1
  ],
  [
    "./.next/types/routes.d.ts",
    1
  ]
]
