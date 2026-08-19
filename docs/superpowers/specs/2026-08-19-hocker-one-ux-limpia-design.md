# Hocker One - Diseño limpio y adaptativo

Fecha: 2026-08-19
Estado: diseño aprobado en conversación, pendiente de revisión final del Owner antes de plan de implementación
Alcance: Hocker One privado, con prioridad en NOVA, AGIs, navegación y certificación

## 1. Objetivo

Hocker One debe sentirse limpio, amigable y fácil de entender en celular, tableta, computadora y pantallas grandes.

La interfaz mostrará sólo lo necesario para comprender el estado, decidir y actuar. La información interna seguirá existiendo para evidencia, soporte y auditoría, pero no ocupará la vista principal si no cambia una decisión.

Regla principal:

> Si un dato no ayuda a entender, decidir o actuar en ese momento, no aparece en primer plano.

## 2. Principios de diseño

1. Una sola acción principal por contexto.
2. Nombres cortos, claros y preferentemente en español.
3. Sin tecnicismos en la vista normal.
4. Detalle técnico sólo bajo demanda.
5. Nada duplicado entre barra lateral, encabezado y contenido.
6. Estados visibles con palabras simples: Listo, Pendiente, En proceso, Requiere atención, Sin conexión.
7. La interfaz prioriza excepciones: si todo está bien, ocupa menos espacio.
8. El historial y la evidencia no se borran; se mueven a vistas de detalle.
9. La navegación cambia según el espacio disponible, no según una marca o dispositivo concreto.
10. La experiencia debe cumplir accesibilidad, reflujo, teclado, foco visible y zonas seguras.

## 3. Estructura principal

La navegación visible se reduce a seis destinos:

- Inicio
- NOVA
- Trabajo
- Ecosistema
- Operación
- Más

### Inicio

Muestra sólo:

- estado general;
- pendientes importantes;
- alertas reales;
- acciones que requieren al Owner;
- cambios recientes que afecten una decisión.

No muestra IDs, versiones, nodos, nombres de proveedor ni datos de diagnóstico salvo error.

### NOVA

Es la experiencia principal de conversación.

### Trabajo

Agrupa:

- tareas;
- aprobaciones;
- acciones pendientes;
- resultados recientes que requieran seguimiento.

### Ecosistema

Agrupa:

- Apps;
- AGIs;
- conexiones;
- memoria.

### Operación

Agrupa:

- estado;
- procesos activos;
- nodos;
- señales;
- incidencias.

### Más

Agrupa funciones menos frecuentes:

- seguridad;
- reglas;
- evidencia;
- configuración;
- vistas especializadas.

La búsqueda rápida permanece disponible para usuarios avanzados.

## 4. NOVA: pantalla completa

NOVA deja de verse como una tarjeta dentro de un tablero.

### Vista normal

Debe ocupar todo el espacio útil disponible.

Elementos visibles:

- botón de menú cuando haga falta;
- NOVA;
- nombre corto de la conversación cuando exista;
- un estado breve sólo si cambia algo importante;
- conversación;
- caja para escribir;
- controles realmente disponibles.

### Elementos que salen de la vista principal

- barra de espacio de trabajo permanente;
- nombre del nodo;
- proyecto técnico;
- modelo;
- proveedor;
- cantidad de conexiones;
- versiones;
- IDs;
- trazas;
- detalles internos del Owner Gate;
- segunda cabecera de NOVA;
- tarjeta exterior del chat;
- bordes y fondos anidados sin función.

### Historial

El historial de conversaciones será secundario:

- escritorio: panel ocultable;
- tableta: panel deslizable o plegable;
- celular: panel que aparece sólo al pedirlo.

No se mostrará una lista extensa de conversaciones si no se solicita.

### Detalle

Cuando haga falta, se abre un panel de detalle con información avanzada. El panel no compite con la conversación.

## 5. AGIs: vista limpia

La página de AGIs deja de ser una pared de tarjetas grandes.

### Resumen superior

Debe responder cuatro preguntas:

- ¿Cuántas AGIs hay?
- ¿Cuántas están listas?
- ¿Cuántas requieren atención?
- ¿Qué debo hacer ahora?

No se mostrarán explicaciones técnicas extensas de la certificación en primer plano.

### Lista

Cada AGI muestra como máximo:

- nombre;
- función breve;
- estado;
- una señal corta de lo pendiente cuando exista.

Ejemplo:

NOVA - Coordinación - Lista
VERTX - Seguridad - Requiere atención
JURIX - Legal - Pendiente

### Detalle de una AGI

Al abrir una AGI pueden aparecer:

- actividad reciente;
- pruebas;
- herramientas;
- memoria;
- evidencia;
- historial de ejecuciones;
- identificadores internos;
- versiones;
- información de diagnóstico.

Nada de esto ocupa la lista principal.

## 6. Un solo botón para certificar

No habrá 16 botones individuales en la vista normal.

La página mostrará una sola acción cuando realmente haga falta.

Estados:

### Todo listo

Texto: `16 de 16 listas`
Acción principal: ninguna.

### Falta verificación del Owner

Texto: `Necesitamos verificar tu sesión para continuar.`
Botón: `Verificar y continuar`

### Faltan pruebas

Texto: `Quedan AGIs por revisar.`
Botón: `Continuar revisión`

### En proceso

Texto: `Revisando VERTX...`
Botón adicional: ninguno.

### Error temporal

Texto simple que explique que la revisión se puede retomar.
Botón, sólo cuando sea necesario: `Reanudar`

### Problema real

Texto: `VERTX requiere atención.`
Botón: `Ver detalle`

### Estado inseguro o incompleto

Texto: `No se pudo confirmar el estado.`
Botón: `Reintentar`

Los controles individuales sólo podrán existir en una vista avanzada de diagnóstico, nunca como acciones principales equivalentes.

## 7. Previsión de problemas antes de certificar las 16 AGIs

La certificación se mantiene pausada hasta fortalecer la evaluación.

### Problema actual

Parte de la evaluación depende todavía de encontrar palabras o frases concretas. Esto puede marcar como incorrecta una respuesta correcta expresada de otra manera, o aceptar una respuesta débil que sólo contiene una palabra esperada.

### Diseño nuevo

Antes de volver a certificar:

1. Separar hechos comprobables de interpretación de texto.
2. Verificar por datos reales todo lo que pueda comprobarse sin interpretar lenguaje.
3. Crear ejemplos variados de respuestas correctas e incorrectas para las 16 AGIs.
4. Probar distintas formas de decir lo mismo.
5. Evaluar intención y resultado, no palabras sueltas.
6. Mantener cada versión de evaluación identificada.
7. No modificar resultados históricos.
8. Reutilizar evidencia válida existente.
9. Ejecutar primero pruebas locales y baratas antes de usar modelos reales.
10. Reanudar la certificación Owner sólo cuando esta matriz esté verde.

## 8. Barra superior

La barra superior se simplifica.

Debe mostrar sólo:

- nombre de la vista;
- búsqueda cuando sea útil;
- alertas reales;
- acceso a NOVA cuando no estemos dentro de NOVA.

En escritorio no se repite el logo si ya está visible en la navegación lateral.

El estado general se representa de forma compacta. Si todo está bien, basta una señal pequeña. Si existe una incidencia, entonces se expande y explica el problema.

## 9. Barra lateral

La barra lateral debe poder plegarse.

No mostrará permanentemente dos niveles completos de navegación.

Comportamiento:

- primer nivel: destinos principales;
- segundo nivel: sólo cuando el usuario entra al área o lo solicita;
- búsqueda disponible para llegar directamente a cualquier vista.

Las etiquetas deben ser cortas.

## 10. Celular, tableta, computadora y pantallas grandes

### Espacio pequeño

- navegación inferior o menú;
- una sola columna;
- NOVA ocupa la pantalla;
- historial y detalle se abren encima sólo cuando se solicitan;
- botones grandes y fáciles de tocar;
- ningún contenido importante queda debajo de elementos fijos.

### Espacio medio

- navegación compacta;
- NOVA sigue siendo dominante;
- se puede abrir un panel lateral temporal;
- AGIs puede alternar entre lista y detalle.

### Espacio grande

- navegación lateral plegable;
- NOVA puede mostrar historial al lado;
- detalle opcional en un tercer panel sólo cuando haya espacio suficiente;
- el texto no se estira a todo el ancho de una pantalla ultrapanorámica.

### Pantallas muy grandes o TV

- mayor tamaño de lectura y foco;
- navegación clara;
- prioridad a consulta y seguimiento;
- no se fuerza una experiencia de escritura pensada para control remoto.

## 11. Qué se elimina de la vista normal

Se oculta o mueve a detalle:

- IDs técnicos;
- nombres de workers;
- nombres de nodos;
- versiones de pruebas;
- hashes;
- proveedor/modelo;
- conteos técnicos de conexiones;
- estados internos que no afectan una decisión;
- historial largo;
- registros antiguos;
- explicaciones repetidas;
- botones duplicados;
- botones que sólo actualizan información que puede refrescarse de forma segura;
- adornos, brillos y tarjetas anidadas que no ayuden a entender la información.

No se elimina la evidencia durable necesaria para auditoría, seguridad o soporte.

## 12. Lenguaje

Se priorizan palabras simples en español.

Ejemplos:

- `Runtime` -> `Estado` o `Ejecución`, según contexto.
- `Worker` -> `Proceso` cuando sea visible al usuario; el nombre técnico puede quedar en detalle.
- `Owner Gate` se conserva como nombre de gobierno interno sólo donde sea necesario; en la vista normal se usa `Aprobación`.
- `Eval` -> `Prueba`.
- `Tool` -> `Herramienta`.
- `Evidence` -> `Evidencia`.
- `Registry` -> `Registro`.
- `Pending` -> `Pendiente`.
- `Degraded` -> `Con problema` o `Requiere atención`.
- `Offline` -> `Sin conexión`.

No se traducen nombres propios de productos o AGIs.

## 13. Estados comunes

Todos los módulos usarán el mismo vocabulario:

- Listo
- Pendiente
- En proceso
- Requiere atención
- Sin conexión
- No disponible

Los mensajes de error deben decir:

1. qué pasó;
2. qué puede hacer el usuario;
3. si lo ya realizado se conserva.

## 14. Reglas visuales

- Menos tarjetas.
- No anidar tarjetas salvo necesidad real.
- Menos bordes y brillos.
- Mayor espacio entre grupos importantes.
- Texto principal legible y breve.
- Datos secundarios con menor peso visual.
- Colores para significado, no decoración.
- Una acción principal por pantalla o bloque.
- No depender sólo del color para comunicar estado.
- Evitar texto extremadamente pequeño.
- Respetar zonas seguras y teclado móvil.
- Soportar aumento de tamaño y reflujo sin ocultar funciones.

## 15. Accesibilidad

La implementación deberá validar:

- ancho equivalente a 320 px sin pérdida de información esencial;
- zoom elevado;
- teclado completo;
- foco visible;
- foco no tapado por barras fijas;
- lector de pantalla;
- movimiento reducido;
- orientación vertical y horizontal;
- zonas seguras;
- ventanas divididas;
- pantallas plegables y redimensionables;
- contraste suficiente;
- controles táctiles cómodos.

Objetivo: WCAG 2.2 AA para la interfaz web aplicable.

## 16. Rendimiento percibido

La limpieza también debe mejorar velocidad percibida.

- cargar primero contenido útil;
- efectos visuales nunca bloquean la interfaz;
- NOVA debe mostrar respuesta o estado de envío inmediatamente;
- evitar consultas duplicadas desde varios componentes para el mismo dato;
- refrescar en segundo plano cuando sea seguro;
- no mantener elementos complejos invisibles si no se usan.

## 17. Pruebas necesarias

Antes de producción deberán pasar:

- pruebas de lógica;
- pruebas de navegación;
- pruebas de estados de certificación;
- pruebas de las 16 AGIs con respuestas variadas;
- pruebas de permisos y AAL2;
- pruebas de accesibilidad;
- pruebas de celular, tableta, escritorio y pantallas grandes;
- pruebas de teclado y foco;
- pruebas de reflujo y zoom;
- pruebas de errores y recuperación;
- pruebas de rendimiento;
- revisión visual de las páginas principales.

La revisión final se hará en Preview antes de fusionar a `main`.

## 18. Alcance de implementación

Primera entrega:

1. fortalecer evaluación de las 16 AGIs;
2. crear shell adaptativo simplificado;
3. convertir NOVA en chat inmersivo;
4. simplificar AGIs;
5. reducir navegación y duplicados globales;
6. mover información técnica a detalles;
7. unificar estados y palabras;
8. validar accesibilidad y tamaños;
9. revisar visualmente Preview;
10. fusionar sólo con todas las pruebas verdes.

## 19. Fuera de alcance de esta entrega

- cambiar la identidad o misión de las 16 AGIs;
- conceder más autonomía;
- activar acciones externas nuevas;
- cambiar reglas de seguridad o aprobación para reducir control;
- mover datos canónicos sólo por razones visuales;
- rediseñar las diez apps del ecosistema en esta misma entrega;
- convertir NOVA en la única interfaz de todo HOCKER todavía.

## 20. Seguridad y gobierno

La simplificación visual no reduce controles.

Se mantienen:

- `allow_actions=false` como línea base;
- aprobación humana para acciones materiales;
- separación entre razonar, aprobar, ejecutar y verificar;
- evidencia durable;
- fallo seguro;
- menor privilegio;
- no autoevolución productiva.

La pantalla puede ser simple aunque el control interno sea riguroso.

## 21. Criterios de aceptación

La entrega se considera correcta cuando:

1. NOVA ocupa la pantalla útil y se siente como una aplicación de chat principal.
2. No existe una cadena de tarjetas anidadas alrededor de NOVA.
3. `/agis` tiene una sola acción principal de certificación cuando corresponde.
4. Los botones individuales de certificación no aparecen en la vista normal.
5. La vista principal de AGIs permite entender el estado de las 16 sin leer datos técnicos.
6. La navegación principal tiene nombres cortos y claros.
7. No hay información técnica duplicada entre barra lateral, barra superior y contenido.
8. Proyecto, nodo, versiones, IDs y proveedor/modelo no aparecen permanentemente.
9. La interfaz funciona desde 320 px hasta pantallas grandes sin pérdida de funciones esenciales.
10. La certificación no se reanuda hasta que la matriz de evaluación de las 16 AGIs esté probada contra paráfrasis y casos adversos.
11. La evidencia válida ya existente se conserva.
12. AAL2, permisos, Owner Gate y `allow_actions` no se debilitan.
13. Pruebas, accesibilidad, build y revisión visual están verdes antes de `main`.

## 22. Fundamento interno

Este diseño sigue las reglas canónicas del proyecto:

- Hocker One sigue siendo la superficie de aprobación y ejecución controlada.
- La ausencia de evidencia se trata como pendiente y no como éxito.
- Las aplicaciones deben incluir diseño adaptativo, accesibilidad, estados de error/recuperación y matriz de dispositivos.
- El sistema de diseño debe incluir arquitectura de información, navegación, componentes, estados, accesibilidad, patrones adaptativos y pruebas visuales.
- La simplificación no elimina información canónica; separa información ejecutiva de evidencia técnica.

## 23. Fundamento externo investigado

La arquitectura toma como referencia patrones actuales, sin copiar su identidad visual:

- ChatGPT y Gemini: conversación como superficie principal e historial secundario.
- Vercel AI Chatbot: shell de chat dedicado, barra lateral plegable y viewport completo.
- LibreChat: historial adaptativo y cierre de panel en pantallas pequeñas.
- Open WebUI: navegación de conversación separada de vistas administrativas.
- Apple: navegación lateral ocultable, jerarquía corta y adaptación al espacio.
- Android: navegación adaptativa según tamaño de ventana.
- WCAG 2.2: reflujo, foco visible y accesibilidad en ventanas estrechas y zoom.

Estas referencias son guías de interacción y arquitectura, no fuentes de identidad visual HOCKER.
