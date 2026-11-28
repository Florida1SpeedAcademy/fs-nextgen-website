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

  function progression(event, races, best) {
    const figure = node('figure');
    figure.append(node('figcaption', 'Season progression · race order'));
    const chart = svgNode('svg', {
      viewBox: '0 0 440 151',
      role: 'img',
      'aria-label': `${event} progression. ${races.map(race => `${race.date}: ${race.mark}`).join('; ')}. Season best ${best.mark}.`,
    }, figure);
    const times = races.map(race => race.time);
    const upper = Math.ceil(Math.max(...times) / 100) * 100 + 100;
    const lower = Math.max(0, Math.min(Math.floor(Math.min(...times) / 100) * 100 - 100, upper - 400));
    const left = 49;
    const right = 427;
    const top = 12;
    const bottom = 121;
    const x = index => left + index * (right - left) / (races.length - 1);
    const y = time => bottom - (time - lower) * (bottom - top) / (upper - lower);

    for (const value of [upper, Math.round((upper + lower) / 200) * 100, lower]) {
      const position = y(value);
      svgNode('line', { x1: left, x2: right, y1: position, y2: position, class: 'season-gridline' }, chart);
      svgNode('text', { x: 0, y: position + 4, class: 'season-chart-axis' }, chart).textContent = chartTime(value);
    }
    svgNode('polyline', {
      points: races.map((race, index) => `${x(index)},${y(race.time)}`).join(' '),
      class: 'season-trend',
    }, chart);
    races.forEach((race, index) => {
      const dot = svgNode('circle', {
        cx: x(index),
        cy: y(race.time),
        r: race.time === best.time ? 7 : 5,
        class: race.time === best.time ? 'season-point season-point-best' : 'season-point',
      }, chart);
      svgNode('title', {}, dot).textContent = `${race.date} · ${race.meet} · ${race.mark}`;
    });
    svgNode('text', { x: left, y: 144, class: 'season-chart-axis' }, chart).textContent = races[0].date;
    svgNode('text', { x: right, y: 144, 'text-anchor': 'end', class: 'season-chart-axis' }, chart).textContent = races.at(-1).date;
    return figure;
  }

  const events = new Map();
  for (const row of table.tBodies[0].rows) {
    const [event, mark, date, , place] = Array.from(row.cells, cell => cell.textContent.trim());
    const meet = row.cells[3].firstChild.textContent.trim();
    if (!/^\d+(?::[0-5]\d)?\.\d{1,2}s?$/.test(mark)) continue;
    const dateKey = Date.parse(date);
    if (!Number.isFinite(dateKey)) continue;
    const race = {
      mark,
      date: date.replace(/, \d{4}$/, ''),
      dateKey,
      meet,
      place: /^\d+$/.test(place) && Number(place) > 0 ? Number(place) : Infinity,
      time: toHundredths(mark.replace(/s$/, '')),
    };
    if (!events.has(event)) events.set(event, []);
    events.get(event).push(race);
  }

  const marks = Array.from(grid.querySelectorAll('.athlete-best'));
  const cards = node('div');
  cards.className = 'season-card-grid';
  for (const mark of marks) {
    const event = mark.querySelector('span').textContent.trim();
    const races = events.get(event);
    if (!races?.length) {
      cards.append(mark.cloneNode(true));
      continue;
    }
    races.sort((a, b) => a.dateKey - b.dateKey);
    const first = races[0];
    const best = races.reduce((fastest, race) => race.time < fastest.time ? race : fastest);
    const top = races.reduce((highest, race) => race.place < highest.place ? race : highest);
    const card = node('article');
    card.className = 'season-card';
    const metrics = node('dl');
    addMetric(metrics, 'Season best', best.mark, `${best.meet} · ${best.date}`);
    if (first.time > best.time) {
      addMetric(metrics, 'First race to best', `${((first.time - best.time) / 100).toFixed(2)}s faster`,
        `${first.mark} → ${best.mark}`);
    } else {
      addMetric(metrics, 'Races', String(races.length));
    }
    if (Number.isFinite(top.place)) {
      addMetric(metrics, 'Top finish', `#${top.place}`, top.meet);
    }
    card.append(node('h3', event), metrics);
    if (races.length > 1) card.append(progression(event, races, best));
    cards.append(card);
  }
  if (!cards.querySelector('.season-card')) return;

  grid.replaceWith(cards);
  const heading = document.querySelector('.athlete-detail .section-head');
  heading.querySelector('h2').textContent = 'Season cards';
  heading.querySelector('.section-intro').textContent =
    'Compare your athlete’s best times, top finishes, and race-by-race progress. Meet results and sources are listed below.';
})();
