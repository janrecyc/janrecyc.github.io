import { login } from "../auth.js";
import { navigate } from "../router.js";
import { showToast } from "../components/toast.js";

/**
 * Login View
 */
export function loginView() {
  setTimeout(bindEvents); // bind หลัง render

  return `
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

    <div class="w-full max-w-md p-8 rounded-2xl bg-white shadow-lg backdrop-blur">

      <h1 class="text-3xl font-bold text-center mb-2">
        janrecyc
      </h1>

      <p class="text-center text-gray-500 mb-6">
        ระบบ POS ร้านรับซื้อของเก่า
      </p>

      <form id="loginForm" class="flex flex-col gap-4">

        <input
          type="email"
          id="email"
          placeholder="Email"
          class="w-full px-4 py-3 rounded-xl border
          focus:ring-2 focus:ring-black outline-none
          transition-all"
          required
        />

        <input
          type="password"
          id="password"
          placeholder="Password"
          class="w-full px-4 py-3 rounded-xl border
          focus:ring-2 focus:ring-black outline-none
          transition-all"
          required
        />

        <button
          type="submit"
          class="mt-2 py-3 rounded-xl bg-black text-white font-semibold
          hover:bg-gray-800 transition-all duration-200
          active:scale-95"
        >
          เข้าสู่ระบบ
        </button>

      </form>

    </div>

  </div>
  `;
}

/**
 * Bind Events
 */
function bindEvents() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await login(email, password);

      showToast("เข้าสู่ระบบสำเร็จ", "success");
      navigate("/pos");

    } catch (err) {
      showToast(err.message || "Login failed", "error");
    }
  });
}
