# Ayuda de DIV2 como aplicación web

La ayuda del entorno (`HELP/HELP.DIV`, la misma que se ve con F1 dentro de DIV2) convertida en una aplicación web
variante de la aplicación de escritorio para htaW. Se usa fuera del emulador, junto al editor, con buscador, índice
de palabras clave, ejemplos que se copian o se guardan como `.PRG` y notas añadidas.

Se puede ver desde: https://xwolfoverride.github.io/DIV2Help/

## Decisiones

- **La fuente es `HELP.DIV`**, no la conversión a HTML de [vii](https://vii1.github.io/DIV2Help)
- **El texto original no se edita.** Las correcciones van en `ERRATAS.txt` (buscar y reemplazar por
  página, con motivo que se muestra al pie) y las ampliaciones en `ANOTACIONES.DIV` (mismo marcado de DIV2), que
  se muestran en un recuadro distinto. Páginas nuevas desde el número 3000.
- **El compilador manda**: `SYSTEM/LTOBJ.DEF` y `SYSTEM/LTLEX.DEF` se usan para comprobar la ayuda (funciones,
  parámetros, constantes, sinónimos) y para enlazar el código de los ejemplos con sus páginas. Además, todos los programas de ejemplo se
  compilan y las dudas de comportamiento se resuelven con el [código 
  fuente publicado del intérprete](https://github.com/vii1/DIV); de ahí sale también la lista de errores de
  ejecución (página 3003), que la ayuda original no tenía.

## Revisión

Las erratas corregidas, las inconsistencias que se documentan en lugar de corregirse (por ejemplo `_point` y
`_slash`, que valen 51 como `_comma`) y las notas añadidas están en
[`REVISION.md`](REVISION.md).

## Desarrollo
Esta web, su versión htaW y las anotaciones de inconsistencia y revisión han sido generedas con IA.