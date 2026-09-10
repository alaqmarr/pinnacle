import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-sky-600 text-white font-black text-2xl shadow-lg mb-4">
          P
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          PINNACLE DISTRIBUTING
        </h1>
        <p className="mt-2 text-xs font-mono tracking-widest text-slate-400 uppercase">
          Wholesale Packaging & Janitorial Solutions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">
              Create Customer Account
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Register for wholesale order management, cart persistence, and expedited checkout.
            </p>
          </div>

          <div
            id="register-error-banner"
            className="hidden mb-6 p-4 rounded-lg bg-red-950/80 border border-red-800/80 text-red-200 text-sm font-medium"
          ></div>

          <div
            id="register-success-banner"
            className="hidden mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm font-medium"
          ></div>

          <form id="register-form" action="/api/register" method="POST" className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-200 mb-1"
              >
                Full Name / Company Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                placeholder="e.g. Acme Industrial Supply"
                className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-200 mb-1"
              >
                Work Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                placeholder="purchasing@company.com"
                className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-200 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition font-mono"
              />
              <p className="mt-1 text-xs text-slate-400">
                Minimum 6 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-slate-200 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                required
                minLength={6}
                placeholder="••••••••••••"
                className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="submit-btn"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700 pt-4 flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="text-sky-400 hover:text-sky-300 font-medium transition"
            >
              Already have an account? Sign In →
            </Link>
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-200 transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var form = document.getElementById('register-form');
              var errorBanner = document.getElementById('register-error-banner');
              var successBanner = document.getElementById('register-success-banner');
              var submitBtn = document.getElementById('submit-btn');

              if (!form) return;

              form.addEventListener('submit', async function(e) {
                e.preventDefault();
                errorBanner.classList.add('hidden');
                errorBanner.textContent = '';
                successBanner.classList.add('hidden');

                var name = form.elements['name'].value;
                var email = form.elements['email'].value;
                var password = form.elements['password'].value;
                var confirmPassword = form.elements['confirmPassword'].value;

                if (password !== confirmPassword) {
                  errorBanner.textContent = 'Passwords do not match. Please verify your password.';
                  errorBanner.classList.remove('hidden');
                  return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';

                try {
                  var res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, email: email, password: password, confirmPassword: confirmPassword })
                  });
                  var data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || 'Registration failed');
                  }
                  successBanner.textContent = 'Account created successfully! Redirecting to sign in...';
                  successBanner.classList.remove('hidden');
                  setTimeout(function() {
                    window.location.href = '/login?registered=true';
                  }, 1200);
                } catch (err) {
                  errorBanner.textContent = err.message;
                  errorBanner.classList.remove('hidden');
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Create Account';
                }
              });
            });
          `,
        }}
      />
    </div>
  );
}
