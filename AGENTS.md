## Directrices Operativas para el Ecosistema Hocker ONE

Estos protocolos están calibrados para asegurar el rendimiento, la soberanía de los datos y la ejecución quirúrgica de nuestros agentes sobre la infraestructura de Vercel.

- **Ausencia de Estado Local:** Las Vercel Functions son entidades efímeras. No confíes en su memoria interna. Cualquier dato vital debe ser persistido inmediatamente en nuestra matriz central de Supabase.
- **Bóveda de Secretos:** NUNCA coloques credenciales tácticas en el código ni uses prefijos `NEXT_PUBLIC_` para llaves maestras. Utiliza el comando `vercel env pull` para sincronizar el entorno local con la bóveda segura.
- **Aniquilación de Latencia:** Asegúrate de que la región de ejecución de tus funciones (`Serverless Region`) sea exactamente la misma donde reside el clúster de nuestra base de datos para evitar latencia transcontinental.
- **Tareas de Fondo (I/O Pesado):** Para cálculos extensos de IA o llamadas de red largas, ajusta `maxDuration` de forma milimétrica. Utiliza `waitUntil` para procesar tareas secundarias sin hacer esperar al Director en la interfaz de mando.
- **Comunicaciones Seguras de IA:** Utiliza AI Gateway para enrutar las llamadas a nuestros modelos de inteligencia. Centralizar este flujo elimina las dependencias a ciegas y nos permite auditar cada byte de conocimiento que procesamos.
- **Sistemas de Cronometraje:** Todos los latidos programados (Cron Jobs) operan en UTC estricto e inyectan vida al sistema mediante solicitudes HTTP GET.
