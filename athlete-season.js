(() => {
  const grid = document.querySelector('.athlete-best-grid');
  const table = document.querySelector('.athlete-results-table');
  if (!grid || !table) return;

  function toHundredths(mark) {
    const [seconds, fraction] = mark.split('.');
    return seconds.split(':').reduce((total, part) => total * 60 + Number(part), 0) * 100
      + Number(fraction.padEnd(2, '0'));
  }

  function chartTime(value) {
    const seconds = Math.round(value / 100);
    return seconds >= 60
      ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
      : `${seconds}s`;
  }

  function node(tag, text) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function svgNode(tag, attributes, parent) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    parent.append(element);
    return element;
  }

  function addMetric(list, label, value, detail) {
    const block = node('div');
    const data = node('dd', value);
    if (detail) data.append(node('small', detail));
    block.append(node('dt', label), data);
    list.append(block);
  }

  function progression(event, results, best, isField) {
    const figure = node('figure');
    figure.append(node('figcaption', isField ? 'Season progression · meet order' : 'Season progression · race order'));
    const chart = svgNode('svg', {
      viewBox: '0 0 440 151',
      role: 'img',
      'aria-label': `${event} progression. ${results.map(result => `${result.date}: ${result.mark}`).join('; ')}. Season best ${best.mark}.`,
    }, figure);
    const values = results.map(result => result.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = !isField || max - min >= 300 ? 100 : max - min >= 60 ? 25 : 10;
    const upper = Math.ceil(max / step) * step + step;
    const lower = Math.max(0, Math.min(Math.floor(min / step) * step - step, upper - 4 * step));
    const left = 49;
    const right = 427;
    const top = 12;
    const bottom = 121;
    const x = index => left + index * (right - left) / (results.length - 1);
    const y = value => bottom - (value - lower) * (bottom - top) / (upper - lower);

    for (const value of [upper, Math.round((upper + lower) / (2 * step)) * step, lower]) {
      const position = y(value);
      svgNode('line', { x1: left, x2: right, y1: position, y2: position, class: 'season-gridline' }, chart);
      svgNode('text', { x: 0, y: position + 4, class: 'season-chart-axis' }, chart).textContent =
        isField ? `${value / 100}m` : chartTime(value);
    }
    svgNode('polyline', {
      points: results.map((result, index) => `${x(index)},${y(result.value)}`).join(' '),
      class: 'season-trend',
    }, chart);
    results.forEach((result, index) => {
      const isBest = result.value === best.value;
      const dot = svgNode('circle', {
        cx: x(index),
        cy: y(result.value),
        r: isBest ? 7 : 5,
        class: isBest ? 'season-point season-point-best' : 'season-point',
      }, chart);
      svgNode('title', {}, dot).textContent = `${result.date} · ${result.meet} · ${result.mark}`;
    });
    svgNode('text', { x: left, y: 144, class: 'season-chart-axis' }, chart).textContent = results[0].date;
    svgNode('text', { x: right, y: 144, 'text-anchor': 'end', class: 'season-chart-axis' }, chart).textContent = results.at(-1).date;
    return figure;
  }

  const events = new Map();
  for (const row of table.tBodies[0].rows) {
    const [event, mark, date, , place] = Array.from(row.cells, cell => cell.textContent.trim());
    const meet = row.cells[3].firstChild.textContent.trim();
    const isField = /^\d+\.\d{1,2}m$/.test(mark);
    if (!isField && !/^\d+(?::[0-5]\d)?\.\d{1,2}s?$/.test(mark)) continue;
    const dateKey = Date.parse(date);
    if (!Number.isFinite(dateKey)) continue;
    const result = {
      mark,
      date: date.replace(/, \d{4}$/, ''),
      dateKey,
      meet,
      place: /^\d+$/.test(place) && Number(place) > 0 ? Number(place) : Infinity,
      isField,
      value: toHundredths(mark.replace(/[ms]$/, '')),
    };
    if (!events.has(event)) events.set(event, []);
    events.get(event).push(result);
  }

  const marks = Array.from(grid.querySelectorAll('.athlete-best'));
  const cards = node('div');
  cards.className = 'season-card-grid';
  for (const mark of marks) {
    const event = mark.querySelector('span').textContent.trim();
    const results = events.get(event);
    if (!results?.length) {
      cards.append(mark.cloneNode(true));
      continue;
    }
    results.sort((a, b) => a.dateKey - b.dateKey);
    const first = results[0];
    const isField = first.isField;
    const direction = isField ? 1 : -1;
    const best = results.reduce((best, result) => direction * (result.value - best.value) > 0 ? result : best);
    const top = results.reduce((top, result) => result.place < top.place ? result : top);
    const card = node('article');
    card.className = 'season-card';
    const metrics = node('dl');
    addMetric(metrics, 'Season best', best.mark, `${best.meet} · ${best.date}`);
    const improvement = direction * (best.value - first.value);
    if (improvement > 0) {
      addMetric(metrics, isField ? 'First meet to best' : 'First race to best',
        `${(improvement / 100).toFixed(2)}${isField ? 'm farther' : 's faster'}`,
        `${first.mark} → ${best.mark}`);
    } else {
      addMetric(metrics, isField ? 'Marks' : 'Races', String(results.length));
    }
    if (Number.isFinite(top.place)) {
      addMetric(metrics, 'Top finish', `#${top.place}`, top.meet);
    }
    card.append(node('h3', event), metrics);
    if (results.length > 1) card.append(progression(event, results, best, isField));
    cards.append(card);
  }
  if (!cards.querySelector('.season-card')) return;

  grid.replaceWith(cards);
  const heading = document.querySelector('.athlete-detail .section-head');
  heading.querySelector('h2').textContent = 'Season cards';
  heading.querySelector('.section-intro').textContent =
    'See season bests, top finishes, and meet-by-meet progress. The meet log below links to the published results.';
})();
