# Hocker ONE · Android

## Estado

Hocker ONE tiene capa Android mediante Capacitor.

La app Android funciona como contenedor nativo seguro para la versión web oficial de Hocker ONE.

## URL de producción

https://hockerone.vercel.app

## App ID

com.hocker.one

## Formatos

- APK: pruebas internas/manuales.
- AAB: formato correcto para publicación en Google Play.

## Comandos

npm run android:sync
npm run android:open
npm run android:debug
npm run android:apk
npm run android:aab

## Flujo recomendado

1. Ejecutar build web.
2. Sincronizar Capacitor.
3. Probar APK debug.
4. Configurar iconos nativos.
5. Crear firma release.
6. Generar AAB firmado.
7. Subir a Play Console.

## Archivos principales

android/
capacitor.config.ts
mobile-shell/
