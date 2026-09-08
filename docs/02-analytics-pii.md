# Analítica sin filtrar datos personales

La analítica filtra PII casi siempre por accidente, y casi siempre por la misma
puerta: **la URL**.

## El caso que se repite

```
/reset-password?token=abc123&email=ana@example.com
```

GA4 recoge `page_location` completa por defecto. Ese email acaba de entrar en tu
propiedad de analítica, que es un sistema de un tercero, probablemente en otra
jurisdicción, con una política de retención que tú no controlas. Y GA4 no lo
quiere: mandar PII va contra sus condiciones y te pueden purgar la propiedad.

Lo mismo con los referrers. Una página con el email en la query enlaza a otra, y
el email viaja en el `Referer` a todos los terceros de la página destino.

## Regla práctica

**Nunca metas identificadores en la query string.** Ni email, ni teléfono, ni
nombre, ni el token de sesión. Van en el cuerpo del POST o en el path como
identificador opaco.

Si heredas un sistema que ya lo hace y no lo puedes cambiar hoy, sanea antes de
que llegue a la etiqueta:

```js
const PII_PARAMS = ['email', 'phone', 'token', 'name', 'ssn'];

function sanitizeUrl(raw) {
  const url = new URL(raw);
  for (const p of PII_PARAMS) {
    if (url.searchParams.has(p)) url.searchParams.set(p, '[redacted]');
  }
  return url.toString();
}
```

Es un parche. El arreglo es no ponerlo ahí.

## Los otros sitios por donde se escapa

| Vector | Cómo pasa |
|---|---|
| Títulos de página | `document.title = "Pedido de Ana García"` → va en cada evento |
| Parámetros de evento | `track('signup', { email })` porque hacía falta para depurar |
| Dimensiones personalizadas | Alguien mapea `user_email` "temporalmente" |
| Grabación de sesión | Hotjar/FullStory capturando un formulario sin enmascarar |
| Mensajes de error | `logError("fallo el pago de ana@example.com")` |
| `user_id` | Correcto en GA4 — pero tiene que ser opaco, no el email |

## Server-side no es una tirita

Mover las etiquetas a un contenedor de servidor o a CAPI mejora fiabilidad y te
da un punto donde sanear. No te exime de nada: sigues tratando datos personales,
sigues necesitando base legal, y el consentimiento sigue aplicando.

Lo que sí resuelve: te da **un solo sitio** donde inspeccionar y redactar antes
de que salga a un tercero. Eso es mucho, pero es higiene, no cumplimiento.

## Hashear no es anonimizar

Un `SHA-256` de un email es un **seudónimo**, no un anónimo. Es determinista y
el espacio de emails es enumerable: cualquiera con una lista puede revertirlo por
fuerza bruta. Bajo GDPR sigue siendo dato personal (considerando 26).

Sirve para dos cosas reales: que el proveedor haga match sin ver el original, y
que reduzcas el daño si hay filtración. No sirve para decir "ya no es PII".

Ver [`src/hash.ts`](../src/hash.ts) para la normalización — que es donde falla
todo el mundo, porque sin normalizar previa los hashes no casan y la tasa de
match se hunde.

## Cómo lo verificas

No mirando el Network tab una vez. Un test que navega, dispara los flujos
sensibles, y **falla** si alguna petición saliente contiene algo con forma de
email o de teléfono. Ver [`tests/no-pii.spec.ts`](../tests/no-pii.spec.ts).
