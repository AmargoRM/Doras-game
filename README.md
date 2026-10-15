# Doras Survivor — Operación: Ni un Combo Más

Juego web (HTML + JavaScript, sin instalar nada) basado en la mecánica de **Crucitas Survivor**:
tres carriles, obstáculos que bajan, saltos, power-ups y eventos especiales.

Doras y Botas recorren la selva esquivando la comida más engordadora. Cada golpe llena el
**Barriga-metro**; al 100 % se acaba la partida (y el personaje se ve cada vez más ancho).

## Cómo jugarlo

- El juego se publica en Cloudflare (ver "Publicar con Top 3 compartido"). Queda en
  `https://doras-survivor.<tu-subdominio>.workers.dev`.
- También funciona abriendo `public/index.html` desde cualquier servidor web, pero sin Top 3 compartido
  (solo récord local).
- Celular: deslizá a los lados para cambiar de carril, tocá o deslizá arriba para saltar. También hay botones ◀ Saltar ▶.
- Computadora: flechas o A/D para moverse, Espacio/W/↑ para saltar, P o Esc para pausa, M para silenciar.

## Elementos

| Tipo | Qué hace |
|---|---|
| 🍔 🍕 🍩 🍟 🌭 🥓 🍗 🍫 🌮 🥤 🍦 | Comida chatarra: se salta o se esquiva. Si te pega, sube el Barriga-metro. |
| Charco de aceite | Se salta; con tenis se cruza sin problema. |
| Buffet libre, combo agrandado, máquina de snacks (etiqueta roja) | No se saltan: hay que cambiar de carril. |
| 🍎 Manzana | Puntos y baja la barriga. Cada 10 activa el **Modo Fit**. |
| 💧 Agua | Todo va más lento por 6 s y baja la barriga. |
| 👟 Tenis | Salto más alto y cruzan charcos de aceite por 8 s. |
| 🥦 Brócoli | Escudo contra un golpe. |
| 🥗 Ensalada | Baja 12 % la barriga. |
| Comida «FIT» (etiqueta verde: barra saludable, batido detox, granola, influencer) | Trampa: casi no engorda, pero activa el **Efecto Rebote**: todo va un 5 % más rápido por cada una, aparecen más obstáculos y los puntos se multiplican ("likes"). Se acumula hasta x8. |
| 🦊 Zorro Antojo | Desde el nivel 2. Te persigue cambiando de carril y te roba escudo, tenis y agua. Hay que saltarlo. |

Además, desde el nivel 2 el **metabolismo lento** hace subir la barriga sola, despacito, y
aparecen **filas dobles** (dos carriles ocupados, uno libre).

## Eventos especiales

- **Cumpleaños en la oficina**: llueven pasteles y cupcakes (reemplaza la "conferencia de prensa" de Crucitas).
- **Modo Fit**: aparece comida "saludable" engañosa (barras con azúcar, batidos detox, influencers) y llueven manzanas con puntos dobles (reemplaza al "Geoparque").
- **Estampida del food truck**: avisa el carril y baja a toda velocidad (reemplaza la "estampida de Daniela").

## Final

La ruta del Mapa tiene 6 tramos (unos 2 minutos y medio). Al terminar aparece el jefe final,
**el Rey Combo Agrandado**, que lanza comida durante 24 segundos avisando el carril. Si lo aguantás,
"se empacha de sí mismo" y llegás al **Templo de la Ensalada Legendaria**… que resulta ser un combo
agrandado con una hoja de lechuga encima. Ahí recibís 3 premios ridículos al azar (por ejemplo,
"membresía VIP de un gimnasio que cierra mañana"), un título según cómo llegó tu Barriga-metro y
+5000 "puntos de vida saludable, no canjeables". Después podés seguir en modo infinito.

## Top 3 compartido

- En el menú y al perder se ve el **Top 3 de todos los jugadores**.
- Al terminar una partida (o al ganar) aparece una casilla para escribir tu nombre. Mientras escribís,
  sugiere nombres de jugadores que ya existen (tocás uno y se completa). El juego recuerda tu último nombre.
- Se guarda el **mejor puntaje de cada nombre**. Te dice tu puesto y cuántos puntos te faltan para el podio.
- 🥗 junto a un nombre = esa persona llegó al final del Mapa.
- Hay un freno básico contra puntajes inventados, pero no es a prueba de tramposos expertos.

## Publicar con Top 3 compartido (una sola vez)

1. En Cloudflare: **My Profile → API Tokens → Create Token → plantilla "Edit Cloudflare Workers"**.
   Copiá el token.
2. Copiá también tu **Account ID** (aparece en el panel de Workers, a la derecha).
3. En GitHub, en este repo: **Settings → Secrets and variables → Actions → New repository secret**:
   - `CLOUDFLARE_API_TOKEN` = el token
   - `CLOUDFLARE_ACCOUNT_ID` = el Account ID
4. En la pestaña **Actions**, abrí "Publicar juego en Cloudflare" y tocá **Run workflow**
   (o hacé cualquier push). La primera vez crea solo el almacén de puntajes (`doras-scores`).
5. Al final del registro del paso "Publicar" aparece la dirección del juego.

## Archivos

- `public/index.html` — página.
- `public/game.js` — todo el juego.
- `public/assets/doras.webp` (y `doras.png`) — personaje sin fondo.
- `worker/index.js` — servidor: entrega el juego y guarda/lee los puntajes.
- `wrangler.toml` — configuración de Cloudflare.
- `.github/workflows/deploy.yml` — publica automáticamente en Cloudflare.

El récord personal también se guarda en el navegador de cada persona.

Sátira ficticia: no usa marcas reales ni da consejos médicos.
