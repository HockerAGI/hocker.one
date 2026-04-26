# Hocker ONE · Android Build en GitHub Actions

## Motivo

La compilación local en Termux/Proot puede fallar en AAPT2 por limitaciones del entorno Android ARM64.

## Solución

El APK debug se compila en GitHub Actions usando Ubuntu, Java 21, Node 20, Gradle y Capacitor.

## Workflow

.github/workflows/android-debug.yml

## Artifact esperado

hocker-one-debug-apk

## APK esperado

android/app/build/outputs/apk/debug/app-debug.apk
