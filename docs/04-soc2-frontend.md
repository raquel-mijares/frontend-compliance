# Lo que un auditor SOC 2 te pide del front-end

SOC 2 no es una certificación con una lista fija: es una auditoría de que los
controles que **tú** dijiste que tienes, funcionan, de forma consistente, durante
un periodo. Type I es un momento; Type II es normalmente entre 3 y 12 meses.

Eso cambia lo que significa "estar listo". No es arreglarlo la semana antes. Es
que el control haya estado funcionando todo el periodo y puedas demostrarlo.

## La parte que acaba siendo del front-end

**Control de acceso.** Ocultar un botón no es control de acceso. Si el endpoint
responde a quien no debe, da igual lo que enseñe la interfaz. Ocultar es UX; el
control está en el servidor. El auditor lo prueba llamando al endpoint.

Lo que sí aporta el cliente: que los estados de permiso sean explícitos y
testeables, no `v-if` dispersos por veinte componentes.

**Trazabilidad de acciones sensibles.** Cambios de permisos, exportaciones de
datos, borrados. El registro lo escribe el servidor, pero el cliente tiene que
mandar contexto suficiente para que la entrada signifique algo.

**Sesión.** Timeout por inactividad, cierre de sesión que de verdad invalida en
servidor, y no dejar datos sensibles en `localStorage` sobreviviendo al logout.

**Dependencias.** Aquí es donde más se falla en front-end. Es criterio de
seguridad y tu `node_modules` es superficie de ataque: `npm audit` en CI, lockfile
comprometido, y un proceso escrito para parchear con una ventana definida.

**Gestión de cambios.** Que cada cambio en producción sea rastreable hasta una
revisión aprobada. En la práctica: rama protegida, PR obligatorio, revisor
distinto del autor, CI en verde. Si alguien puede hacer push directo a `main`,
ese control no existe.

## Evidencia > intención

La diferencia entre un control que pasa y uno que no suele ser si genera
**artefactos con fecha** de forma automática.

| Control | Evidencia débil | Evidencia que pasa |
|---|---|---|
| Revisión de código | "Revisamos todo" | Rama protegida + historial de PRs del periodo |
| Escaneo de dependencias | "Usamos npm audit" | Job de CI, con resultados archivados |
| Gating de consentimiento | Captura del banner | Test en CI que falla si dispara antes |
| Control de acceso | Documento de roles | Tests de autorización por rol, en cada build |

El patrón: **convertir política en test.** Un test que corre en cada PR y falla
cuando el control deja de cumplirse produce evidencia continua sin que nadie
tenga que acordarse de recopilarla. Esto es también, casualmente, lo que hace
que el control siga siendo verdad.

## El error de calendario

Empezar tres semanas antes de la ventana de auditoría. Si el periodo Type II
empieza en enero y activas la protección de rama en marzo, tienes dos meses de
cambios sin el control. El auditor lo va a ver en el historial.

Los controles hay que encenderlos **antes** de que empiece el periodo, no antes
de que acabe.
