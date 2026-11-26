(() => {
  'use strict';

  const PREFIX = 'syzora_ent300_demo_v2_';

  const get = (key, fallback) => {
    try {
      const x = localStorage.getItem(PREFIX + key);
      return x === null ? fallback : JSON.parse(x);
    } catch {
      return fallback;
    }
  };

  const set = (key, value) =>
    localStorage.setItem(PREFIX + key, JSON.stringify(value));

  const users = () => get('users', []);
  const bookings = () => get('bookings', []);
  const messages = () => get('messages', []);
  const events = () => get('events', []);
  const session = () => get('session', null);

  const id = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2);

  const $ = name => document.getElementById(name);

  const escape = val =>
    String(val ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));

  const note = (target, msg) => {
    if ($(target)) $(target).textContent = msg;
  };

  // Demo hashing only — not a production security boundary.
  async function hash(password, salt) {
    if (!crypto.subtle) {
      throw Error(
        'Demo login requires localhost or HTTPS (GitHub Pages).'
      );
    }

    const data = new TextEncoder().encode(salt + ':' + password);
    const digest = await crypto.subtle.digest('SHA-256', data);

    return [...new Uint8Array(digest)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  // Create the public academic demonstration admin account.
  async function initialize() {
    if (users().some(u => u.role === 'admin')) return;

    const salt = 'public-ent300-admin-demo';

    set('users', [
      ...users(),
      {
        id: 'demo-admin',
        name: 'Demo Administrator',
        email: 'admin@syzoranexus.demo',
        role: 'admin',
        salt,
        passwordHash: await hash('AdminDemo123!', salt),
        createdAt: new Date().toISOString()
      }
    ]);
  }

  const current = () =>
    users().find(u => u.id === session()?.userId) || null;

  // SIGN IN / SIGN UP / FORGOT PASSWORD NAVIGATION
  function showAuthView(view) {
    const views = {
      login: 'demoLoginPanel',
      signup: 'demoSignupPanel',
      forgot: 'demoForgotPanel',
      recovery: 'demoRecoveryPanel'
    };

    Object.entries(views).forEach(([name, target]) => {
      if ($(target)) $(target).hidden = name !== view;
    });

    if ($('demoAuthTabs')) {
      $('demoAuthTabs').hidden =
        view === 'forgot' || view === 'recovery';
    }

    if ($('demoShowLogin')) {
      $('demoShowLogin').classList.toggle(
        'active', view === 'login'
      );
      $('demoShowLogin').setAttribute(
        'aria-pressed', String(view === 'login')
      );
    }

    if ($('demoShowSignup')) {
      $('demoShowSignup').classList.toggle(
        'active', view === 'signup'
      );
      $('demoShowSignup').setAttribute(
        'aria-pressed', String(view === 'signup')
      );
    }

    const titles = {
      login: [
        'Welcome Back',
        'Sign in to access your account.'
      ],
      signup: [
        'Create an Account',
        'Register to manage your demo bookings.'
      ],
      forgot: [
        'Reset Password',
        'Recover access using your saved demo recovery code.'
      ],
      recovery: [
        'Save Your Recovery Code',
        'This code appears only once.'
      ]
    };

    if ($('demoAuthHeading')) {
      $('demoAuthHeading').textContent = titles[view][0];
    }

    if ($('demoAuthSubtitle')) {
      $('demoAuthSubtitle').textContent = titles[view][1];
    }
  }

  function makeRecoveryCode() {
    if (!crypto.getRandomValues) {
      throw Error('The demo requires a secure browser context.');
    }

    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);

    return [...bytes]
      .map(n => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  function ensureCustomer() {
    const u = current();

    if (!u || u.role !== 'customer') {
      location.href = 'dashboard.html';
      return null;
    }

    return u;
  }

  function recordMarkup(value) {
    return `<div class="demo-record">${value}</div>`;
  }

  // CUSTOMER AND ADMIN BOOKING RECORDS
  function listBookings(items, admin = false) {
    if (!items.length) {
      return '<p class="demo-note">No demo bookings yet.</p>';
    }

    return items.slice().reverse().map(b => recordMarkup(`
      <p>
        <strong>${escape(b.ref)}</strong> ·
        ${escape(b.service)} ·
        ${escape(b.date)} ${escape(b.time)}:00
      </p>
      <p>
        ${escape(b.hours)} hour(s),
        ${escape(b.guests)} guest(s) ·
        RM${Number(b.price).toFixed(2)} ·
        <strong>${escape(b.status)}</strong>
      </p>
      ${admin ? `
        <p>
          Customer: ${escape(b.customerName)}
          (${escape(b.customerEmail)})
        </p>
        <label>
          Booking status
          <select data-booking-status="${escape(b.id)}">
            <option ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            <option ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </label>
      ` : b.status === 'Pending' ? `
        <button type="button"
                class="btn btn-outline"
                data-cancel-booking="${escape(b.id)}">
          Cancel request
        </button>
      ` : ''}
      ${b.notes ? `<p>Notes: ${escape(b.notes)}</p>` : ''}
    `)).join('');
  }

  // RENDER DASHBOARD
  function render() {
    const u = current();
    const auth = $('demoAuthArea');
    const account = $('demoAccountArea');

    if (!auth || !account) return;

    auth.hidden = !!u;
    auth.style.display = u ? 'none' : '';

    account.hidden = !u;
    account.style.display = u ? '' : 'none';

    if (!u) return;

    $('demoWelcome').textContent = `Welcome, ${u.name}`;

    $('demoRole').textContent =
      `${u.role.toUpperCase()} • ${u.email} • local demo account`;

    const isAdmin = u.role === 'admin';

    $('demoAdminPanel').hidden = !isAdmin;
    $('demoAdminPanel').style.display = isAdmin ? '' : 'none';

    $('demoCustomerPanel').hidden = isAdmin;
    $('demoCustomerPanel').style.display = isAdmin ? 'none' : '';

    if (isAdmin) {
      $('statUsers').textContent =
        users().filter(x => x.role === 'customer').length;

      $('statBookings').textContent = bookings().length;
      $('statMessages').textContent = messages().length;
      $('statEvents').textContent = events().length;

      $('adminEvents').innerHTML = events().length
        ? events().slice().reverse().map(x => recordMarkup(`
          <p>
            <strong>${escape(x.game)}</strong> ·
            ${escape(x.createdAt.slice(0, 10))}
          </p>
          <p>${escape(x.name)} (${escape(x.email)})</p>
        `)).join('')
        : '<p class="demo-note">No event interest yet.</p>';

      $('adminBookings').innerHTML =
        listBookings(bookings(), true);

      $('adminMessages').innerHTML = messages().length
        ? messages().slice().reverse().map(m => recordMarkup(`
          <p>
            <strong>${escape(m.subject)}</strong> ·
            ${escape(m.createdAt.slice(0, 10))} ·
            ${escape(m.status)}
          </p>
          <p>${escape(m.name)} (${escape(m.email)})</p>
          <p>${escape(m.message)}</p>
          <label>
            Enquiry status
            <select data-message-status="${escape(m.id)}">
              <option ${m.status === 'New' ? 'selected' : ''}>New</option>
              <option ${m.status === 'In progress' ? 'selected' : ''}>In progress</option>
              <option ${m.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </label>
        `)).join('')
        : '<p class="demo-note">No enquiries received.</p>';

      $('adminUsers').innerHTML = users()
        .filter(x => x.role === 'customer')
        .map(x => recordMarkup(`
          <strong>${escape(x.name)}</strong> ·
          ${escape(x.email)}
          <p>
            Phone:
            ${escape(x.phone || 'Not provided (older account)')}
          </p>
          <p>Created ${escape(x.createdAt.slice(0, 10))}</p>
        `)).join('')
        || '<p class="demo-note">No customer accounts yet.</p>';

    } else {
      $('customerBookings').innerHTML = listBookings(
        bookings().filter(b => b.userId === u.id)
      );
    }
  }

  // EVENT HANDLERS
  function registerHandlers() {

    // SWITCH BETWEEN AUTHENTICATION SCREENS
    $('demoShowLogin')?.addEventListener('click', () =>
      showAuthView('login')
    );

    $('demoShowSignup')?.addEventListener('click', () =>
      showAuthView('signup')
    );

    $('demoSignupLink')?.addEventListener('click', () =>
      showAuthView('signup')
    );

    $('demoLoginLink')?.addEventListener('click', () =>
      showAuthView('login')
    );

    $('demoShowForgot')?.addEventListener('click', () => {
      $('resetEmail').value = $('loginEmail')?.value || '';
      showAuthView('forgot');
    });

    $('demoBackToLogin')?.addEventListener('click', () =>
      showAuthView('login')
    );

    $('demoRecoveryContinue')?.addEventListener('click', () => {
      $('demoRecoveryCode').textContent = '';
      set('session', null);
      showAuthView('login');

      note(
        'loginFeedback',
        'Account created or password reset. Sign in using your email and password.'
      );
    });

    // CUSTOMER REGISTRATION
    $('demoSignup')?.addEventListener('submit', async e => {
      e.preventDefault();

      const name = $('signupName').value.trim();
      const phone = $('signupPhone').value.trim();
      const email = $('signupEmail').value.trim().toLowerCase();
      const password = $('signupPassword').value;
      const confirmPassword = $('signupConfirmPassword').value;

      if (!name || password.length < 8) {
        return note(
          'signupFeedback',
          'Enter your name and a password of at least 8 characters.'
        );
      }

      const digits = phone.replace(/\D/g, '');

      if (
        !/^\+?[\d\s()-]+$/.test(phone) ||
        digits.length < 9 ||
        digits.length > 15
      ) {
        return note(
          'signupFeedback',
          'Enter a valid phone number (9–15 digits, with optional +country code).'
        );
      }

      if (password !== confirmPassword) {
        return note(
          'signupFeedback',
          'Passwords do not match.'
        );
      }

      if (users().some(u => u.email === email)) {
        return note(
          'signupFeedback',
          'This demo email is already registered.'
        );
      }

      try {
        const salt = id();
        const recoverySalt = id();
        const recoveryCode = makeRecoveryCode();

        const u = {
          id: id(),
          name,
          phone,
          email,
          role: 'customer',
          salt,
          passwordHash: await hash(password, salt),
          recoverySalt,
          recoveryHash: await hash(
            recoveryCode,
            recoverySalt
          ),
          createdAt: new Date().toISOString()
        };

        set('users', [...users(), u]);

        $('demoSignup').reset();
        $('demoRecoveryCode').textContent = recoveryCode;

        showAuthView('recovery');

      } catch (err) {
        note('signupFeedback', err.message);
      }
    });

    // FORGOT PASSWORD / RECOVERY
    $('demoResetPassword')?.addEventListener(
      'submit',
      async e => {
        e.preventDefault();

        const email =
          $('resetEmail').value.trim().toLowerCase();

        const code =
          $('resetCode').value.trim()
            .replace(/\s+/g, '')
            .toUpperCase();

        const password = $('resetPassword').value;
        const confirmation = $('resetConfirmPassword').value;

        if (password.length < 8) {
          return note(
            'resetFeedback',
            'Use at least 8 characters.'
          );
        }

        if (password !== confirmation) {
          return note(
            'resetFeedback',
            'New passwords do not match.'
          );
        }

        const arr = users();

        const u = arr.find(
          x => x.email === email && x.role === 'customer'
        );

        if (!u?.recoveryHash || !u.recoverySalt) {
          return note(
            'resetFeedback',
            'Recovery unavailable for this account. Newly registered customers receive a recovery code.'
          );
        }

        try {
          if (
            await hash(code, u.recoverySalt) !== u.recoveryHash
          ) {
            return note(
              'resetFeedback',
              'Email or recovery code is incorrect.'
            );
          }

          const recoveryCode = makeRecoveryCode();
          const salt = id();
          const recoverySalt = id();

          u.salt = salt;
          u.passwordHash = await hash(password, salt);

          u.recoverySalt = recoverySalt;
          u.recoveryHash = await hash(
            recoveryCode,
            recoverySalt
          );

          set('users', arr);

          $('demoResetPassword').reset();
          $('demoRecoveryCode').textContent = recoveryCode;

          showAuthView('recovery');

          note(
            'loginFeedback',
            'Password reset. Save the new recovery code and sign in.'
          );

        } catch (err) {
          note('resetFeedback', err.message);
        }
      }
    );

    // SIGN IN
    $('demoLogin')?.addEventListener('submit', async e => {
      e.preventDefault();

      const email =
        $('loginEmail').value.trim().toLowerCase();

      const password = $('loginPassword').value;
      const u = users().find(x => x.email === email);

      try {
        if (
          !u ||
          await hash(password, u.salt) !== u.passwordHash
        ) {
          return note(
            'loginFeedback',
            'Invalid demo email or password.'
          );
        }

        set('session', { userId: u.id });

        $('demoLogin').reset();
        render();

      } catch (err) {
        note('loginFeedback', err.message);
      }
    });

    // LOGOUT
    $('demoLogout')?.addEventListener('click', () => {
      localStorage.removeItem(PREFIX + 'session');
      showAuthView('login');
      render();
    });

    // CUSTOMER BOOKING CANCELLATION
    $('demoAccountArea')?.addEventListener('click', e => {
      const cancel =
        e.target.closest('[data-cancel-booking]');

      if (cancel) {
        const arr = bookings();

        const b = arr.find(
          x => x.id === cancel.dataset.cancelBooking
        );

        if (
          b &&
          b.userId === current()?.id &&
          b.status === 'Pending'
        ) {
          b.status = 'Cancelled';
          set('bookings', arr);
          render();
        }
      }
    });

    // ADMIN STATUS MANAGEMENT
    $('demoAdminPanel')?.addEventListener('change', e => {
      if (current()?.role !== 'admin') return;

      const b =
        e.target.closest('[data-booking-status]');

      const m =
        e.target.closest('[data-message-status]');

      if (b) {
        const arr = bookings();

        const entry = arr.find(
          x => x.id === b.dataset.bookingStatus
        );

        if (
          entry &&
          ['Pending', 'Confirmed', 'Cancelled', 'Completed']
            .includes(b.value)
        ) {
          entry.status = b.value;
          set('bookings', arr);
          render();
        }
      }

      if (m) {
        const arr = messages();

        const entry = arr.find(
          x => x.id === m.dataset.messageStatus
        );

        if (
          entry &&
          ['New', 'In progress', 'Resolved']
            .includes(m.value)
        ) {
          entry.status = m.value;
          set('messages', arr);
          render();
        }
      }
    });

    // CLEAR DEMONSTRATION RECORDS
    $('demoClear')?.addEventListener('click', () => {
      if (
        current()?.role === 'admin' &&
        confirm(
          'Clear all demo bookings and enquiries from THIS browser?'
        )
      ) {
        set('bookings', []);
        set('messages', []);
        set('events', []);
        render();
      }
    });

    // EXPORT DEMONSTRATION RECORDS
    $('demoExport')?.addEventListener('click', () => {
      if (current()?.role !== 'admin') return;

      const data = {
        exportedAt: new Date().toISOString(),

        users: users().map(
          ({ id, name, phone, email, role, createdAt }) => ({
            id,
            name,
            phone: phone || '',
            email,
            role,
            createdAt
          })
        ),

        bookings: bookings(),
        messages: messages(),
        events: events()
      };

      const link = document.createElement('a');

      link.href = URL.createObjectURL(
        new Blob(
          [JSON.stringify(data, null, 2)],
          { type: 'application/json' }
        )
      );

      link.download = 'syzora-demo-records.json';
      link.click();

      setTimeout(
        () => URL.revokeObjectURL(link.href),
        1000
      );
    });

    // CONTACT FORM
    $('demoContact')?.addEventListener('submit', e => {
      e.preventDefault();

      const f = e.target;

      const m = {
        id: id(),
        name: f.elements.name.value.trim(),
        email: f.elements.email.value.trim(),
        subject: f.elements.subject.value,
        message: f.elements.message.value.trim(),
        status: 'New',
        createdAt: new Date().toISOString()
      };

      if (!m.name || !m.message) {
        return note(
          'contactFeedback',
          'Please complete all required fields.'
        );
      }

      set('messages', [...messages(), m]);

      f.reset();

      note(
        'contactFeedback',
        'Demo enquiry saved in this browser. Sign in as admin here to view it.'
      );
    });

    // EVENT INTEREST FORM
    $('demoEventInterest')?.addEventListener(
      'submit',
      e => {
        e.preventDefault();

        const name = $('eventName').value.trim();
        const email = $('eventEmail').value.trim();
        const game = $('eventGame').value;

        if (!name || !email) {
          return note(
            'eventFeedback',
            'Complete the demo details.'
          );
        }

        set('events', [
          ...events(),
          {
            id: id(),
            name,
            email,
            game,
            createdAt: new Date().toISOString()
          }
        ]);

        e.target.reset();

        note(
          'eventFeedback',
          'Demo interest recorded. No event registration or payment was made.'
        );
      }
    );

    // BOOKING FORM
    $('demoBooking')?.addEventListener('submit', e => {
      e.preventDefault();

      const u = ensureCustomer();
      if (!u) return;

      const service =
        $('demoConsole')
          .selectedOptions[0]
          .textContent
          .split(' — ')[0];

      const hours = Number($('demoHours').value);
      const time = Number($('demoStart').value);
      const date = $('demoDate').value;
      const guests = Number($('demoGuests').value);

      const room = service.startsWith('Private');

      if (
        !date ||
        hours < 1 ||
        time + hours > 24 ||
        guests < 1 ||
        (room && guests > 4) ||
        (!room && guests > 2)
      ) {
        return note(
          'bookingFeedback',
          'Check the time, duration and guest limit (standard stations: 2; private room: 4).'
        );
      }

      const dateTime = new Date(
        `${date}T${String(time).padStart(2, '0')}:00:00`
      );

      if (
        Number.isNaN(+dateTime) ||
        dateTime <= new Date()
      ) {
        return note(
          'bookingFeedback',
          'Select a future date and start time.'
        );
      }

      const caps = {
        'PlayStation 5': 4,
        'PlayStation 4 Pro': 2,
        'Nintendo Switch OLED': 2,
        'Private PS5 Room': 1
      };

      const overlapping = bookings().filter(b =>
        b.date === date &&
        b.service === service &&
        !['Cancelled'].includes(b.status) &&
        time < Number(b.time) + Number(b.hours) &&
        Number(b.time) < time + hours
      ).length;

      if (overlapping >= (caps[service] || 1)) {
        return note(
          'bookingFeedback',
          'No demo stations available for this overlapping time. Try a different slot.'
        );
      }

      // Illustrative rates, not a real payment system.
      const rate = Number($('demoConsole').value);
      const discount = Number($('demoTier').value);

      const entry = {
        id: id(),
        ref: 'SN-' + Date.now().toString(36).toUpperCase(),
        userId: u.id,
        customerName: u.name,
        customerEmail: u.email,
        service,
        date,
        time,
        hours,
        guests,
        notes: $('demoNotes').value.trim(),
        price: Math.round(
          rate * hours * (1 - discount / 100) * 100
        ) / 100,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      set('bookings', [...bookings(), entry]);

      note(
        'bookingFeedback',
        `Demo request ${entry.ref} saved as Pending. View it in your account; no real reservation or payment was made.`
      );
    });

    // SET MINIMUM BOOKING DATE
    const date = $('demoDate');

    if (date) {
      const today = new Date();

      const local = new Date(
        today.getTime() -
        today.getTimezoneOffset() * 60000
      ).toISOString().slice(0, 10);

      date.min = local;
      date.value = local;
    }

    // UPDATE NAVIGATION FOR SIGNED-IN USERS
    document.querySelectorAll('.nav-dash').forEach(a => {
      if (current()) {
        a.innerHTML =
          '<i class="fa-solid fa-user"></i>My Account';
      }
    });
  }

  // INITIALIZE DEMO
  initialize()
    .then(() => {
      registerHandlers();
      showAuthView('login');
      render();
    })
    .catch(err =>
      console.warn('Demo initialization failed:', err)
    );

})();
