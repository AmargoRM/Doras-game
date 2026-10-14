# Doras Survivor — Operación: Ni un Combo Más

Juego web (HTML + JavaScript, sin instalar nada) basado en la mecánica de **Crucitas Survivor**:
tres carriles, obstáculos que bajan, saltos, power-ups y eventos especiales.

Doras y Botas recorren la selva esquivando la comida más engordadora. Cada golpe llena el
**Barriga-metro**; al 100 % se acaba la partida (y el personaje se ve cada vez más ancho).

## Cómo jugarlo

- Abrí `index.html` desde un servidor web (por ejemplo GitHub Pages).
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
| 🥗 Ensalada | Baja 20 % la barriga. |

## Eventos especiales

- **Cumpleaños en la oficina**: llueven pasteles y cupcakes (reemplaza la "conferencia de prensa" de Crucitas).
- **Modo Fit**: aparece comida "saludable" engañosa (barras con azúcar, batidos detox, influencers) y llueven manzanas con puntos dobles (reemplaza al "Geoparque").
- **Estampida del food truck**: avisa el carril y baja a toda velocidad (reemplaza la "estampida de Daniela").

## Archivos

- `index.html` — página.
- `game.js` — todo el juego.
- `assets/doras.webp` (y `doras.png`) — personaje sin fondo.

El récord se guarda solo en el navegador de cada persona.

Sátira ficticia: no usa marcas reales ni da consejos médicos.
