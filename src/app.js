/** @format */
import { Observer, from, pairs, fromEvent } from 'rxjs';
import {
  skipUntil,
  takeUntil,
  repeat,
  tap,
  map,
  pairwise,
  pluck,
} from 'rxjs/operators';

// store references to dom elements in variables
const canvas = document.getElementById('canvas');
const palette = document.getElementsByClassName('palette')[0];
const ctx = canvas.getContext('2d');

// get styles to deal with border width when drawing on canvas
const styling = getComputedStyle(canvas, null);
const topBorder = parseInt(styling.getPropertyValue('border-top-width'));
const leftBorder = parseInt(styling.getPropertyValue('border-left-width'));

// create observables
const beginDrawing$ = fromEvent(canvas, 'mousedown');
const endDrawing$ = fromEvent(document, 'mouseup');
const drawing$ = fromEvent(canvas, 'mousemove');
const palette$ = fromEvent(palette, 'click');
const colors$ = from(palette.querySelectorAll('[data-color]'));
const brushes$ = from(palette.querySelectorAll('[data-size]'));

// set the initial stroke styles
ctx.strokeStyle = 'black';
ctx.lineWidth = '1';
ctx.lineCap = 'round';

// reusable function to remove 'selected class'
const removeClass = element => element.classList.remove('selected');

// function with logic to draw a line in the canvas
function drawLine([prev, curr]) {
  ctx.beginPath();
  ctx.moveTo(prev.x, prev.y);
  ctx.lineTo(curr.x, curr.y);
  ctx.closePath();
  ctx.stroke();
}

// logic reacting to events on the palette
palette$
  .pipe(pluck('target'))
  .subscribe(({ dataset, parentNode, classList }) => {
    if (dataset && dataset.color) {
      ctx.strokeStyle = dataset.color;
      colors$.subscribe(removeClass);
      classList.add('selected');
    } else if (dataset.size) {
      ctx.lineWidth = dataset.size;
      brushes$.subscribe(removeClass);
      classList.add('selected');
    } else if (parentNode.dataset && parentNode.dataset.size) {
      ctx.lineWidth = parentNode.dataset.size;
      brushes$.subscribe(removeClass);
      parentNode.classList.add('selected');
    }
  });

// logic reacting to events on the canvas
const paint$ = drawing$
  .pipe(
    skipUntil(beginDrawing$),
    takeUntil(endDrawing$),
    map(e => {
      const clientRect = e.target.getBoundingClientRect();
      return {
        x: e.clientX - (clientRect.left + topBorder - 0.5),
        y: e.clientY - (clientRect.top + leftBorder - 0.5),
      };
    }),
    pairwise(),
    repeat()
  )
  .subscribe(drawLine);
