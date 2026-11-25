# Voz Afirmativa

Herramienta web de práctica para el **acompañamiento vocal afirmativo** (personas trans y de género diverso), pensada desde la mirada fonoaudiológica. Lectura guiada con nota de piano de referencia, rango definido por la persona y seguimiento en vivo por palabra y sílaba.

## Qué hace
- 4 niveles: palabras → frases → frases con intención/emoción → textos (editables en `data/ejercicios.json`).
- Piano de referencia (Do3–Si4), nota guía y rango en semitonos que elige cada persona.
- Medidor de tono en vivo (detector YIN) y nivel de voz con umbral.
- Seguimiento **automático**: el cursor avanza por sílaba según el audio (sin retraso) y el reconocimiento de palabras lo corrige.
- Cada sílaba queda marcada: dentro del rango (liso), más grave (punteado) o más agudo (rayado). Se marca la sílaba tónica.
- Calibración de micrófono (silencio + “aaa”) y **prueba previa** de palabras y sílabas con autoajuste de sensibilidad.
- Selector de micrófono, ganancia, reducción de ruido, acento (es-CL/AR/MX/ES).
- Motores de reconocimiento: **Navegador** (Web Speech API) o **Whisper local** (Transformers.js, WebGPU/WASM; el audio no sale del equipo).
- Contorno de tono de la sesión y **exportación CSV** para el seguimiento clínico.
- PWA: se puede instalar y la app funciona sin conexión (el modelo Whisper se guarda en caché tras la primera descarga).

## Publicar en GitHub Pages
1. Crea un repositorio y sube estos archivos a la rama `main`.
2. En **Settings → Pages**, elige **Source: GitHub Actions**. El flujo `.github/workflows/pages.yml` publica automáticamente.
3. Abre `https://<usuario>.github.io/<repo>/`. (HTTPS es obligatorio para usar el micrófono.)

Para probar en local: `python3 -m http.server 8000` y abre `http://localhost:8000`.

## Editar los ejercicios
`data/ejercicios.json` tiene cuatro niveles; cada ítem es `{"x":"texto"}` y, opcionalmente, `{"g":"Con calidez"}` como etiqueta de intención. No hace falta tocar el código.

## Notas técnicas
- Whisper se carga desde jsDelivr (`js/whisper.js`, versión fijada en `TF`); si cambia la API de Transformers.js, actualiza esa constante. Modelos: `onnx-community/whisper-base` y `-tiny`.
- Navegadores: Chrome/Edge recientes ofrecen el mejor soporte (micrófono elegido para reconocer, reconocimiento local, WebGPU). Safari y Firefox funcionan para tono y Whisper (WASM), pero no para Web Speech.
- Las sílabas se separan con reglas del español y su avance se estima por energía de voz: es una aproximación, no un análisis fonético.

## Aviso
Herramienta de apoyo; no reemplaza la evaluación ni el acompañamiento de un/a fonoaudiólogo/a. La nota guía es una referencia que cada persona elige, no una meta “correcta”. El audio no se guarda.

Licencia MIT.
