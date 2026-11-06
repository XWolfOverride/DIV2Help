# Revisión de la ayuda de DIV2

Resultado de contrastar la ayuda (`HELP\HELP.DIV`) con el propio sistema DIV2 y con su código:

- La tabla de objetos del compilador (`SYSTEM\LTOBJ.DEF`) y su tabla de símbolos (`SYSTEM\LTLEX.DEF`).
- El índice de palabras clave (`HELP\HELP.IDX`).
- **Compilación real de todos los programas de ejemplo** con el compilador del port para Windows
  (`tools\Div2Win\divc_port.exe`, ver [DOC/DIV2-WINDOWS.md](../../DOC/DIV2-WINDOWS.md)) y ejecución en él de los
  ejemplos añadidos.
- El código fuente publicado del intérprete (enlazado en [DOC/DIV2-SOURCES.md](../../DOC/DIV2-SOURCES.md)), para
  resolver dudas de comportamiento y obtener los textos de los errores de ejecución.
- El uso real en programas del repositorio (`P/Rebecca/REBE.PRG`).

Las comprobaciones de tablas, enlaces y llamadas las repite `genayuda.cs` en cada generación (`INFORME.md`). Para
volver a compilar los ejemplos: `dotnet run genayuda.cs -- --ejemplos <carpeta>` escribe cada programa completo como
`P<página>_<n>.PRG` (CP850, CRLF) y después se compila cada uno con `divc_port.exe` desde `tools\Div2Win` (mejor
sobre una copia de esa carpeta: el compilador deja sus archivos de trabajo en `system\`).

## Corregido (`ERRATAS.txt`)

Se muestra al pie de cada página afectada, en «Corregido en esta edición».

| Página | Problema |
|---|---|
| 114 `fget_dist()` | Enlaces a `get_dist()` (×2) y `fget_angle()` llevaban a `get_angle()` y a sí misma. |
| 119 `get_disty()` | El enlace a `get_distx()` llevaba a sí misma. |
| 131 `load_fnt()` | El enlace a `write_int()` llevaba a `write()`. |
| 164 | `is_play_cd()` en lugar de `is_playing_cd()`. |
| 170 `unload_pcm()` | Los enlaces a `load_pcm()`/`load_wav()` llevaban a `load_fpg()`. |
| 179 `set_color()` | La sintaxis mostraba `set_volume(`. |
| 183 `xadvance()` | El ejemplo llamaba a `advance(angle2,4)` (dos parámetros; `advance` recibe uno). |
| 187 `path_free()` | El enlace a `path_find()` llevaba a `path_line()`. |
| 209 `upper()`, 210 `lower()` | El ejemplo no compilaba: `BYTE miletra="a";` (un literal es una dirección, fuera del rango de un `BYTE`). Se usa el código ASCII. |
| 226 `fwrite()` | El ejemplo no compilaba: `OFFSET tabla1` en lugar de `OFFSET mitabla`. |
| 241 `save_map()` | `write_map()` en lugar de `write_in_map()`. |
| 248 `atan2()` | El enlace a `atan()` llevaba a sí misma. |
| 249 `draw()` | Coma de más antes de `)`: la sintaxis aparentaba 9 parámetros (son 8). |
| 257 `malloc()`, 258 `free()` | El ejemplo no compilaba: faltaba declarar `contador`. |
| 258 `free()` | «Ver» enlazaba a `atan2()` con el texto `free()`; debía ser `malloc()`. |
| 1016 `PROCESS` | El ejemplo no compilaba: faltaba `;` tras `id2=mi_proceso(160, 100)`. |
| 1036 | Enlace mal formado `(#1050,{&})`. |
| 1005, 1035, 1036 | Las descripciones de `<<` y `>>` estaban intercambiadas («rotación a la derecha» para `<<`). |
| 1105 `timer[]` | Paréntesis de más en la condición de un ejemplo. |
| 155, 569, 1104, 1200 | Llaves de marcado sin cerrar (descolocaban el resto del párrafo). |

Tras las erratas compilan todos los programas de ejemplo salvo el de `IMPORT` (página 1014), que importa una DLL
inexistente a propósito.

## Inconsistencias que se documentan en lugar de corregirse

- **`_point` y `_slash` valen 51**, igual que `_comma`, en la ayuda (página 1176), en `LTOBJ.DEF` y en las fuentes.
  En el teclado de PC el punto es el 52 y el guion (barra en el teclado inglés) el 53, así que `key(_point)` y
  `key(_slash)` detectan la coma. Se deja el valor original (es el que usa el compilador) y se añade una nota con
  el remedio (`key(52)`, `key(53)`).
- **Teclas que comparten código**: cursores y teclado numérico (`_up`/`_c_up`…), `_enter`/`_c_enter` y `_prn_scr`
  con `_c_asterisk`. Coherente con los códigos de rastreo, pero la ayuda no lo dice. Nota en la 1176.
- **Sinónimos sin documentar** en `LTLEX.DEF`: `:=`, `_eq _ne _gt _lt _ge _le`, `!=`, `=<`, `=>`, `whoami` (= `id`),
  `->` (= `.`), `&` como `OFFSET`, `*` como puntero. Página nueva 3001 (su ejemplo compila y funciona).
- **Comentarios de `LTOBJ.DEF` que contradicen la ayuda**, resueltos con el código del intérprete:
  - `get_fileinfo()`: el comentario dice que devuelve un puntero a `fullpath`; el código devuelve **0 o 1**, como
    dice la ayuda. El comentario es el erróneo.
  - `strdel()`: los valores negativos **añaden espacios** (al principio o al final), como dice el comentario y no la
    ayuda. Nota añadida en la 211, con ejemplo probado.
  - `calculate()`: devuelve **0** si el texto no es una expresión válida. Nota en la 254.
  - `set_env_color()` tiene el comentario copiado de otra función (sin efecto).
- **Prioridad de `AND`, `OR` y `XOR`** (página 1036): la tabla los pone por delante de las comparaciones, pero el
  compilador resuelve antes las comparaciones (`a == 1 AND b == 2` vale 1; comprobado ejecutándolo y en el
  código del compilador). Nota añadida en la 1036; el texto original no se cambia.
- **`qsort()`** figura en el compilador como `qsort(1,0)` (el primer parámetro es especial: la estructura); la ayuda
  documenta tres parámetros (`estructura, campo, modo`). No es un error de la ayuda.
- **`sizeof()`** tiene página de función, pero en el compilador es un operador (`LTLEX.DEF`). Correcto en la práctica.
- **`_free_sintax`** se escribe así (con «s») en la ayuda y en el compilador: es el nombre real.
- **Errores de compilación (páginas 500–653)**: 59 de sus ejemplos dan exactamente el error que documentan con el
  compilador del port. Otros compilan sin error o dan un número vecino; muchos son ejemplos de la forma correcta,
  y el compilador del port no tiene por qué coincidir en todo con el de DOS, así que no se ha cambiado nada.

## Ampliado (`ANOTACIONES.DIV`)

| Dónde | Qué | Comprobado |
|---|---|---|
| Página nueva 3000 | Acerca de esta edición: qué se ha revisado, cómo buscar, atajos. | — |
| Página nueva 3001 | Sinónimos que acepta el compilador. | Compila y se ejecuta. |
| Página nueva 3002 | Guardar y cargar una partida (estructura + `save`/`load`), con comprobación de tamaño y versión. | Ejecutado: conserva la partida y descarta un archivo de otro tamaño. |
| Página nueva 3003 | **Errores de ejecución**: la lista completa (100–183 y 200), que la ayuda no tenía. | Textos del intérprete. |
| 171 `write()` | Un texto calculado en la llamada (`"a"+itoa(n)`) no se muestra: el intérprete borra los textos temporales antes de pintar. | Ejecutado, y visto en el código. |
| 1176 Teclas | Las teclas del punto y de la barra; teclas que comparten código. | Visto en el código. |
| 158 `signal()` | Pausar el juego con `s_freeze_tree`/`s_wakeup_tree`. | Ejecutado. |
| 240 `ignore_error()` | Enlace a la lista de errores; límite de 127 errores ignorados (error 168). | Visto en el código. |
| 211 `strdel()` | Valores negativos para alinear textos. | Ejecutado. |
| 254 `calculate()` | Distinguir un texto no numérico de un 0. | Visto en el código. |
| 235 `chdir()` | Ejecutar desde el entorno o como juego compilado (`d.exe`, rutas relativas, `argv`). | Compila. |
| 1406 `STRING` | Programa completo con cadenas. | Ejecutado salvo la parte que lee el teclado (ver límites del port). |

## Límites del port de Windows observados

- Los programas que leen texto del teclado con `ascii` y lo muestran con `write()` (el ejemplo original de
  `calculate()` y el de cadenas) no muestran lo que se escribe; no se ha averiguado si falla `ascii` o el
  refresco del texto. `key()` sí funciona.
