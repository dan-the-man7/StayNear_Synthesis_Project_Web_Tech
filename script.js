// ---------- Shared data ----------
const HOSTELS = {
  hilltop: { name: 'Hilltop Lodge', price: 4200 },
  akuapem: { name: 'Akuapem Court', price: 5600 },
  heights: { name: 'Berekuso Heights', price: 7800 }
};
const EXTRAS = { meals: 1800, laundry: 350, shuttle: 400 };

function cedis(amount) {
  return 'GHS ' + amount.toLocaleString('en-US');
}

// ---------- hostels.html: budget filter ----------
const budget = document.querySelector('#budget');

if (budget) {
  const budgetOut = document.querySelector('#budget-out');
  const matchCount = document.querySelector('#match-count');
  const cards = document.querySelectorAll('.card');

  function filterCards() {
    const limit = Number(budget.value);
    let matches = 0;
    cards.forEach((card) => {
      const fits = HOSTELS[card.id].price <= limit;
      card.classList.toggle('is-hidden', !fits);
      if (fits) {
        matches += 1;
      }
    });
    budgetOut.value = cedis(limit);
    matchCount.textContent =
      `${matches} of ${cards.length} hostels fit this budget`;
  }

  budget.addEventListener('input', filterCards);
  filterCards();
}

// ---------- book.html: the viewing form ----------
const form = document.querySelector('#viewing-form');

if (form) {
  const phone = form.elements.phone;
  const notes = form.elements.notes;
  const dateInput = form.elements.date;
  const charCount = document.querySelector('#char-count');
  const estimate = document.querySelector('#estimate');
  const dialog = document.querySelector('#review-dialog');
  const summary = document.querySelector('#summary');

  // 1. Pre-select the hostel named in the URL: book.html?hostel=akuapem
  const params = new URLSearchParams(window.location.search);
  const wanted = params.get('hostel');
  if (HOSTELS[wanted]) {
    form.elements.hostel.value = wanted;
  }

  // 2. No viewings in the past: set min to today's date
  dateInput.min = new Date().toISOString().slice(0, 10);

  // 3. Live estimate, built from the same data the form will send
  function calculate() {
    const data = new FormData(form);
    const hostel = HOSTELS[data.get('hostel')];
    if (!hostel) {
      return null;
    }
    const factor = data.get('room') === 'single' ? 1.5 : 1;
    let extras = 0;
    data.getAll('extra').forEach((item) => {
      extras += EXTRAS[item];
    });
    const semesters = Number(data.get('semesters')) || 1;
    return (hostel.price * factor + extras) * semesters;
  }

  function showEstimate() {
    const total = calculate();
    estimate.value = total === null ? 'Pick a hostel' : cedis(total);
    charCount.value = `${notes.value.length} / ${notes.maxLength}`;
  }

  form.addEventListener('input', showEstimate);
  form.addEventListener('reset', () => {
    setTimeout(showEstimate, 0); // run after the browser clears the fields
  });
  showEstimate();

  // 4. A friendlier phone error using the ValidityState API
  phone.addEventListener('input', () => {
    if (phone.validity.patternMismatch) {
      phone.setCustomValidity('Use 10 digits starting with 0: 0241234567');
    } else {
      phone.setCustomValidity(''); // clear it or the form never submits
    }
  });

  // 5. Review: validate, then list every name/value pair in the dialog
  document.querySelector('#review-btn').addEventListener('click', () => {
    if (!form.reportValidity()) {
      return;
    }
    summary.replaceChildren(); // empty the list
    new FormData(form).forEach((value, name) => {
      const item = document.createElement('li');
      item.textContent = `${name}: ${value || '(empty)'}`;
      summary.appendChild(item);
    });
    const total = document.createElement('li');
    total.textContent = `Estimated cost: ${cedis(calculate())}`;
    summary.appendChild(total);
    dialog.returnValue = '';
    dialog.showModal();
  });

  // 6. The dialog closed: send the real form only if "Send" was pressed
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'send') {
      form.submit();
    }
  });
}

// ---------- confirmation.html: read the query string ----------
const receipt = document.querySelector('#receipt tbody');

if (receipt) {
  const sent = new URLSearchParams(window.location.search);
  const lead = document.querySelector('#lead');

  if (sent.size === 0) {
    lead.textContent = 'Nothing was sent. Fill in the form first.';
    document.querySelector('#receipt').classList.add('is-hidden');
  } else {
    const hostel = HOSTELS[sent.get('hostel')];
    document.querySelector('#thanks').textContent =
      `Thanks, ${sent.get('name')}!`;
    document.title = `Viewing at ${hostel ? hostel.name : 'a hostel'}`;

    sent.forEach((value, name) => {
      const row = document.createElement('tr');
      const th = document.createElement('th');
      const td = document.createElement('td');
      th.scope = 'row';
      th.textContent = name;
      td.textContent = value || '(empty)';
      row.appendChild(th);
      row.appendChild(td);
      receipt.appendChild(row);
    });
  }

  document.querySelector('#print-btn').addEventListener('click', () => {
    window.print();
  });
}
