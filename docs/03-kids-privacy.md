# Privacidad infantil

Si tu producto tiene contenido dirigido a menores, las reglas cambian de forma
que rompen suposiciones normales del front-end. No es "compliance con más
papeleo": hay cosas que directamente no puedes hacer.

## Lo que cambia

Bajo **COPPA** (EE. UU., menores de 13):

- Publicidad **contextual sí, comportamental no**. Nada de perfilado.
- Consentimiento parental verificable antes de recoger datos personales.
- Los identificadores persistentes cuentan como datos personales. Eso incluye
  cookies, device IDs y publicitarios.
- Minimización real: solo lo estrictamente necesario para la actividad.

Bajo **GDPR art. 8** (UE), el umbral de consentimiento propio es 16 por defecto,
y cada estado miembro puede bajarlo hasta 13. Si operas en varios países, el
umbral es distinto según dónde esté el usuario.

## El patrón que funciona: dos contextos, no un flag

La tentación es un booleano `isKids` que apaga cosas. Se rompe en cuanto alguien
añade una etiqueta nueva y se le olvida el `if`.

Lo que aguanta una auditoría es tratarlo como **dos contextos de ejecución
distintos**, con inventarios de etiquetas separados:

```ts
const TAGS = {
  general: [analytics, advertising, personalization, sessionRecording],
  kids:    [analyticsAggregatedOnly],
};
```

El contexto infantil arranca de una lista vacía y solo se le añade lo que se ha
revisado explícitamente. Si alguien registra una etiqueta nueva sin decidir
conscientemente que va en `kids`, no entra. El fallo por omisión es hacia el
lado seguro.

## Dónde se cuela igualmente

- **Reproductor de vídeo.** El SDK del reproductor manda telemetría propia y
  suele traer su propio ID publicitario. Hay que configurarlo aparte del resto.
- **Smart TV.** Las plataformas tienen sus propios identificadores. En Roku,
  Tizen o webOS eso no lo controla tu código de aplicación, lo controla el
  manifiesto y la configuración de la plataforma.
- **Contenido incrustado.** Un embed de YouTube estándar deja cookies. Existe
  `youtube-nocookie.com` justo para esto.
- **Fuentes y CDN.** Cargar una fuente desde un CDN de terceros transmite la IP.
  Autohospédalas.
- **Crash reporting.** Sentry y similares capturan más contexto del que crees.

## Age gating que no es teatro

Un selector de fecha de nacimiento no es consentimiento parental verificable, y
además cualquier niño lo pasa. Lo que hace la diferencia técnica:

- **Neutral**, sin sesgo. Pedir la fecha, no "¿tienes más de 13?" con el sí
  preseleccionado.
- **No reintentable.** Si el resultado es menor, persistir la decisión. Sin eso,
  recarga y prueba otra fecha.
- **Aplicado en servidor.** Si el gate solo vive en el cliente, no existe.

## Qué mirar antes de dar por hecho que cumples

- [ ] El inventario de etiquetas del contexto infantil está escrito y revisado
- [ ] Ninguna etiqueta se registra sola: añadir una requiere elegir contexto
- [ ] El SDK del reproductor tiene configuración específica de menores
- [ ] Los embeds usan variantes sin cookies
- [ ] Fuentes y assets autohospedados
- [ ] El gate de edad persiste y se aplica en servidor
- [ ] Hay un test que falla si aparece una petición no permitida en el contexto
      infantil

Ese último punto es el que hace que lo anterior siga siendo verdad dentro de un
año. La lista sin el test es un documento; con el test es un control.
