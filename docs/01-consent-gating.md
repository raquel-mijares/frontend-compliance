# El banner no es el control

El error más común que he visto auditar: tratar el banner de consentimiento como
si fuera el mecanismo de cumplimiento. No lo es. El banner es **interfaz**. El
mecanismo es lo que impide que se cargue nada hasta que hay una decisión.

Si tu banner es bonito y accesible pero el snippet de GTM está en el `<head>`
sin condición, no cumples nada. Solo lo has documentado en pantalla.

## Qué exige realmente el consentimiento previo

Bajo GDPR (y ePrivacy, que es la que manda en cookies), el consentimiento tiene
que ser **previo, específico, informado e inequívoco**, y tan fácil de retirar
como de dar. En la práctica, para el front-end:

- Nada no esencial se carga antes del `accept`. Ni el script, ni la cookie, ni
  la petición de red.
- "Seguir navegando implica aceptación" no vale. Scroll no es consentimiento.
- Rechazar tiene que costar lo mismo que aceptar. Un botón, mismo nivel.
- Sin preselección. Las casillas de categorías no esenciales arrancan en `false`.
- Retirar es una acción disponible siempre, no enterrada en un PDF.

## Dónde va el control

Una sola puerta, y todo pasa por ella:

```
decisión del usuario
        ↓
  estado de consentimiento  ←── persistido, versionado
        ↓
   cargador de etiquetas    ←── el único sitio que inyecta scripts
        ↓
   terceros (GA4, Meta, …)
```

Ningún componente carga su propio script. Ninguno. En cuanto un equipo mete un
`<script>` de un proveedor directamente en su vista "porque era rápido", la
puerta deja de existir y nadie se entera hasta la auditoría.

## Los tres estados, no dos

El fallo de diseño que más he tenido que deshacer es modelar el consentimiento
como booleano. Son tres:

| Estado | Significa | Qué se carga |
|---|---|---|
| `unknown` | Aún no ha decidido | Nada no esencial |
| `granted` | Aceptó esta categoría | Lo de esa categoría |
| `denied` | Rechazó explícitamente | Nada, y no se le vuelve a preguntar en cada vista |

Con un booleano, `false` significa a la vez "dijo que no" y "todavía no ha
dicho nada", y acabas o disparando antes de tiempo o preguntando en bucle.

## Versionar la decisión

El consentimiento se da sobre una política concreta. Si cambias las categorías o
metes un proveedor nuevo, el consentimiento anterior no cubre lo nuevo.

Guarda siempre la versión junto a la decisión:

```json
{
  "version": 3,
  "timestamp": "2026-09-08T14:22:31.000Z",
  "categories": { "analytics": true, "advertising": false }
}
```

Cuando `CURRENT_VERSION > stored.version`, el estado vuelve a `unknown`. Es
literalmente la evidencia que te va a pedir el auditor: *demuéstrame que este
usuario consintió esta versión de la política, y cuándo.*

## Consent Mode de Google

Si usas GA4 o Google Ads, Consent Mode v2 espera cuatro señales:

- `ad_storage`
- `analytics_storage`
- `ad_user_data`
- `ad_personalization`

El detalle que se escapa: hay que mandar el estado **por defecto en `denied`
antes** de que cargue gtag, y luego el `update` cuando el usuario decide. Si solo
mandas el `update`, hay una ventana en la que se ha disparado en modo concedido.

```js
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});
```

## Cómo se prueba

Un test que abre la página sin interactuar y falla si sale **cualquier**
petición a un dominio de terceros. Ver [`tests/consent.spec.ts`](../tests/consent.spec.ts).

Esto es lo que convierte "cumplimos" en algo verificable en CI en vez de una
afirmación en una reunión.
