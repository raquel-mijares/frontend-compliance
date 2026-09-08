# frontend-compliance

Notas de ingeniería sobre la parte del compliance que acaba tocándole al front-end:
consentimiento, analítica sin PII, privacidad infantil y la evidencia que pide una
auditoría SOC 2.

No es asesoría legal. Es lo que he tenido que resolver escribiendo interfaces en
productos auditados — SOC 2, ISO 27001, GDPR e HIPAA en compliance de seguridad;
COPPA y atribución publicitaria en streaming.

La tesis: casi todo el compliance que rompe en producción **rompe en el cliente**.
El equipo legal escribe la política, backend cifra la base de datos, y luego una
etiqueta de terceros dispara antes del banner de consentimiento y el trabajo de
seis meses se cae.

## Contenido

| | |
|---|---|
| [Consentimiento](docs/01-consent-gating.md) | Por qué el banner no es el control, y dónde va el control de verdad |
| [Analítica sin PII](docs/02-analytics-pii.md) | GA4, GTM y CAPI sin filtrar datos personales |
| [Privacidad infantil](docs/03-kids-privacy.md) | COPPA y GDPR art. 8 cuando tu producto tiene contenido para menores |
| [Evidencia SOC 2](docs/04-soc2-frontend.md) | Qué te va a pedir el auditor que vive en el front-end |

## Ejemplos

Código ejecutable, no pseudocódigo:

- [`src/consent.ts`](src/consent.ts) — máquina de estados de consentimiento
- [`src/hash.ts`](src/hash.ts) — normalización y hash SHA-256 para CAPI
- [`tests/`](tests/) — specs que **fallan** si algo dispara antes del consentimiento

```bash
npm install
npm test
```

## Por qué existe

Porque la mayoría del material sobre esto está escrito para abogados o para
gente de infra, y el que lo implementa acaba siendo quien escribe el componente.
